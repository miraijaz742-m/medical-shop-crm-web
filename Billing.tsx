import { useState, useEffect, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptimizedInput } from '@/components/ui/optimized-input';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Printer, Search, UserPlus, Loader2 } from 'lucide-react';
import type { Bill, BillItem, Product, Customer, AppSettings } from '@/types';
import { generateInvoicePDF } from '@/lib/pdfUtils';
import { toast } from 'sonner';

interface BillingProps {
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  products: Product[];
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const BillingContent = memo(function BillingContent({ bills, setBills, customers, setCustomers }: BillingProps) {
  const [cart, setCart] = useState<BillItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<number | string>('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    shopName: 'My Medical Shop',
    licenseNumber: 'DL-12345/67',
    address: '64, Main Road, Near Market, MUMBAI, MAHARASHTRA, 400001',
    mobile: '+91 9999999999',
    bankName: 'HDFC BANK',
    accountNumber: '50100000000000',
    ifsc: 'HDFC0000001',
    branch: 'MUMBAI MAIN',
    terms: ['1. Goods once sold cannot be taken back or exchanged.', '2. Subject to Mumbai Jurisdiction.'],
    notes: 'Thank you for your business!'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await window.electronAPI!.settingsGet();
        if (res.success && res.settings && Object.keys(res.settings).length > 0) {
          setAppSettings(prev => ({ ...prev, ...res.settings }));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Optimized Product Search
  const handleProductSearch = useCallback(async (term: string) => {
    setSearchTerm(term);

    // If the search term matches the name of the already selected product, don't search again
    if (!term.trim() || (selectedProduct && term === selectedProduct.name)) {
      setSearchResults([]);
      return;
    }

    setIsSearchingProduct(true);
    if (window.electronAPI) {
      try {
        // Use the specific inventory summary handler which joins batches
        const results = await window.electronAPI.inventoryGetSummary({
          searchTerm: term,
          limit: 20
        });
        setSearchResults(results);
        // If we are typing and it no longer matches the selected product name, reset selection
        if (selectedProduct && term !== selectedProduct.name) {
          setSelectedProduct(null);
        }
      } catch (error) {
        console.error("Search failed", error);
      }
    }
    setIsSearchingProduct(false);
  }, [selectedProduct]);

  // Optimized Customer Search
  const handleCustomerSearch = useCallback(async (name: string) => {
    setCustomerName(name);

    if (!name.trim() || selectedCustomerId) { // Don't search if a customer is already selected
      setCustomerSearchResults([]);
      return;
    }

    if (window.electronAPI) {
      try {
        const results = await window.electronAPI.dbQuery({
          table: 'customers',
          searchField: 'name',
          searchTerm: name,
          limit: 5
        });
        setCustomerSearchResults(results);
      } catch (error) {
        console.error("Customer search failed", error);
      }
    }
  }, [selectedCustomerId]);

  const addToCart = () => {
    if (!selectedProduct || quantity < 1) return;

    const product = selectedProduct;
    // Use total_stock property from aggregate query or quantity for standard Product type
    const availableStock = (product as any).total_stock ?? product.quantity;

    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} units available in stock`);
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.unitPrice }
          : item
      ));
    } else {
      const price = Number(product.sellingPrice || product.mrp || 0);
      const newItem: BillItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: price,
        total: quantity * price,
        shelf: product.shelf_number // Save shelf info
      };
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
    toast.success('Item added to cart');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal - (subtotal / 1.05); // Calculate 5% inclusive tax for display
  const rawDiscountAmount = discountType === 'percentage'
    ? subtotal * (discountValue / 100)
    : discountValue;
  const discountAmount = Math.min(rawDiscountAmount, subtotal);
  const total = subtotal - discountAmount;

  const generateBill = () => {
    if (cart.length === 0) {
      toast.error('Please add items to the cart');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    const finalAmountPaid = amountPaid === '' ? total : Number(amountPaid);
    const balanceDue = Math.max(0, total - finalAmountPaid);

    const newBill: Bill = {
      id: `INV-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerId: selectedCustomerId || undefined,
      items: [...cart],
      subtotal,
      tax,
      discount: discountAmount,
      total,
      amountPaid: finalAmountPaid,
      balanceDue: balanceDue,
      paymentMethod,
      createdAt: new Date().toISOString()
    };

    if (window.electronAPI) {
      window.electronAPI.salesCreate({
        sale: {
          id: newBill.id,
          invoiceNo: Math.floor(Math.random() * 1000000),
          saleDate: new Date().toISOString(),
          customerId: selectedCustomerId,
          customerName: newBill.customerName,
          subtotal: newBill.subtotal,
          tax: newBill.tax,
          discount: discountAmount,
          grandTotal: newBill.total,
          paymentMode: newBill.paymentMethod,
          amountPaid: newBill.amountPaid,
          balanceDue: newBill.balanceDue,
          createdAt: newBill.createdAt
        },
        items: cart.map(item => ({
          medicineId: item.productId,
          qty: item.quantity
        }))
      }).then(res => {
        if (res.success) {
          toast.success('Bill generated successfully');
          const doc = generateInvoicePDF(newBill, appSettings);
          if (doc && window.electronAPI.salesSavePDF) {
            const buffer = doc.output('arraybuffer');
            window.electronAPI.salesSavePDF({ saleId: newBill.id, buffer });
          }
          setBills([newBill, ...bills]);
          setCart([]);
          setCustomerName('');
          setCustomerPhone('');
          setAmountPaid('');
          setSelectedCustomerId(null);
          // Refresh customers to get new balances
          window.electronAPI!.dbQuery({ table: 'customers' }).then(list => {
            setCustomers(list);
          });
        } else {
          toast.error('Failed to save sale: ' + res.error);
        }
      });
    } else {
      setBills([newBill, ...bills]);
      generateInvoicePDF(newBill, appSettings);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      toast.success('Bill generated successfully');
    }
  };

  const addNewCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newCustomer: Customer = {
      id: `CUST-${Date.now()}`,
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      email: newCustomerEmail.trim() || undefined,
      balance: 0,
      createdAt: new Date().toISOString()
    };

    setCustomers([...customers, newCustomer]);
    setCustomerName(newCustomer.name);
    setCustomerPhone(newCustomer.phone);
    setSelectedCustomerId(newCustomer.id);
    setShowAddCustomer(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    toast.success('Customer added successfully');
  };

  const selectExistingCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setSelectedCustomerId(customer.id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <OptimizedInput
                  placeholder="Search products..."
                  value={searchTerm}
                  onDebouncedChange={handleProductSearch}
                  className="pl-10 pr-10"
                />
                {isSearchingProduct && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 text-sky-600 animate-spin" />
                )}

                {searchTerm && (!selectedProduct || searchTerm !== selectedProduct.name) && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1">
                    {searchResults.map(product => (
                      <div
                        key={product.id}
                        className={`p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex justify-between items-center ${selectedProduct?.id === product.id ? 'bg-sky-50 border-sky-200' : ''}`}
                        onClick={() => {
                          setSelectedProduct(product);
                          setSearchTerm(product.name);
                          setSearchResults([]); // Close dropdown
                        }}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-400">
                            {product.category} | Stock: {(product as any).total_stock ?? product.quantity ?? 0} | <span className="text-sky-700 font-bold underline">Shelf: {product.shelf_number || 'N/A'}</span>
                          </p>
                        </div>
                        <p className="font-medium">₹{(product.sellingPrice || product.mrp || 0).toFixed(2)}</p>
                      </div>
                    ))}
                    {!isSearchingProduct && searchResults.length === 0 && (
                      <p className="p-3 text-gray-500 text-center">No products found</p>
                    )}
                    {isSearchingProduct && (
                      <p className="p-3 text-gray-400 text-center text-xs">Searching...</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div className="w-32">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button onClick={addToCart} disabled={!selectedProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle>Cart ({cart.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div>
                        {item.productName}
                        <div className="text-[10px] text-gray-400">
                          Shelf: {item.shelf || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">₹{(item.unitPrice || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{(item.total || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-4 w-4 text-sky-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {cart.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Cart is empty. Add products to generate a bill.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Customer & Payment */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Customer Name *</Label>
              <OptimizedInput
                placeholder="Enter customer name"
                value={customerName}
                onDebouncedChange={handleCustomerSearch}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                placeholder="Enter phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {/* Existing Customers */}
            {/* Customer Search Results */}
            {customerName && !selectedCustomerId && customerSearchResults.length > 0 && (
              <div>
                <Label className="text-sm text-gray-500">Suggested Customers:</Label>
                <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg shadow-sm bg-white absolute z-10 w-[90%] md:w-[300px]">
                  {customerSearchResults.map(customer => (
                    <div
                      key={customer.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 text-sm"
                      onClick={() => selectExistingCustomer(customer)}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-gray-400">{customer.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      placeholder="Enter email (optional)"
                    />
                  </div>
                  <Button onClick={addNewCustomer} className="w-full">
                    Add Customer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: 'cash' | 'card' | 'upi') => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Discount</Label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-all ${discountType === 'percentage' ? 'bg-white shadow-sm font-medium text-sky-700' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => {
                      setDiscountType('percentage');
                      setDiscountValue(0);
                    }}
                  >
                    %
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-all ${discountType === 'fixed' ? 'bg-white shadow-sm font-medium text-sky-700' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => {
                      setDiscountType('fixed');
                      setDiscountValue(0);
                    }}
                  >
                    ₹
                  </button>
                </div>
              </div>
              <Input
                type="number"
                min={0}
                max={discountType === 'percentage' ? 100 : subtotal}
                value={discountValue}
                onChange={(e) => {
                  let val = parseFloat(e.target.value) || 0;
                  if (val < 0) val = 0;
                  if (discountType === 'percentage' && val > 100) val = 100;
                  setDiscountValue(val);
                }}
                placeholder={discountType === 'percentage' ? "0%" : "₹0"}
                className={discountType === 'fixed' ? 'font-bold' : ''}
              />
            </div>

            <div>
              <Label className="flex justify-between">
                Amount Paid (₹)
                <span className="text-[10px] text-gray-400">Default: Full Payment</span>
              </Label>
              <Input
                type="number"
                min={0}
                placeholder={total.toFixed(2)}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="font-bold text-sky-700"
              />
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{(subtotal || 0).toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-sky-600">
                  <span>
                    Discount
                    {discountType === 'percentage'
                      ? ` (${discountValue}%)`
                      : ' (Fixed)'}
                    :</span>
                  <span>-₹{(discountAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>₹{(total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-600">
                <span>Balance Due:</span>
                <span>₹{Math.max(0, (total || 0) - (amountPaid === '' ? (total || 0) : Number(amountPaid))).toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={generateBill}
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || !customerName.trim()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Generate Bill & Print
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default function Billing(props: BillingProps) {
  return (
    <ErrorBoundary name="Billing Section">
      <BillingContent {...props} />
    </ErrorBoundary>
  );
}
