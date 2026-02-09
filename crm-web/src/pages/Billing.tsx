import { useState, useEffect, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Button,
  Input,
  Label,
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/common';
import { Plus, Trash2, Printer, Search, UserPlus, Loader2, Download } from 'lucide-react';
import type { Bill, Product, Customer } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { generateInvoicePDF } from '@/utils/pdfGenerator';

// Simplified types for Billing
interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  shelf?: string;
}

const toast = {
  success: (msg: string) => alert("Success: " + msg),
  error: (msg: string) => alert("Error: " + msg)
};

export default memo(function Billing() {
  const { user } = useAuth();
  const [cart, setCart] = useState<BillItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
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

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Optimized Product Search
  const handleProductSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearchingProduct(true);
    try {
      const { data } = await supabase.from('medicines').select('*, batches(*)').ilike('name', `%${term}%`).limit(10);
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search failed", error);
    }
    setIsSearchingProduct(false);
  };

  // Customer Search
  const handleCustomerSearch = async (name: string) => {
    setCustomerName(name);
    if (!name.trim() || selectedCustomerId) {
      setCustomerSearchResults([]);
      return;
    }
    try {
      const { data } = await supabase.from('customers').select('*').ilike('name', `%${name}%`).limit(5);
      setCustomerSearchResults(data || []);
    } catch (error) {
      console.error("Customer search failed", error);
    }
  };

  const addToCart = () => {
    if (!selectedProduct || quantity < 1) return;

    const med = selectedProduct;
    const totalStock = med.batches.reduce((acc: number, b: any) => acc + (b.quantity || 0), 0);

    if (quantity > totalStock) {
      toast.error(`Only ${totalStock} units available in stock`);
      return;
    }

    const price = med.batches[0]?.selling_price || 0; // Default to first batch price
    const newItem: BillItem = {
      productId: med.id,
      productName: med.name,
      quantity,
      unitPrice: price,
      total: quantity * price,
      shelf: med.shelf_number
    };

    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
    setSearchResults([]);
    toast.success('Item added to cart');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === 'percentage'
    ? subtotal * (discountValue / 100)
    : discountValue;
  const total = subtotal - discountAmount;

  const generateBill = async () => {
    if (cart.length === 0) return toast.error('Please add items to the cart');
    if (!customerName.trim()) return toast.error('Please enter customer name');

    const finalAmountPaid = amountPaid === '' ? total : Number(amountPaid);

    try {
      // 1. Create Sale record
      const { data: bill, error: billError } = await supabase.from('bills').insert({
        customer_id: selectedCustomerId,
        total_amount: total,
        items: cart,
        date: new Date().toISOString(),
        user_id: user?.id
      }).select().single();

      if (billError) throw billError;

      // 2. Decrement stock from batches (Simple logic: take from first batch available)
      // In a real app, you'd iterate through batches until quantity is fulfilled
      for (const item of cart) {
        const { data: batches } = await supabase.from('batches').select('*').eq('medicine_id', item.productId).gt('quantity', 0).order('expiry_date', { ascending: true });

        let remainingToDeduct = item.quantity;
        if (batches) {
          for (const batch of batches) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(batch.quantity, remainingToDeduct);
            await supabase.from('batches').update({ quantity: batch.quantity - deduct }).eq('id', batch.id);
            remainingToDeduct -= deduct;
          }
        }
      }

      toast.success('Bill generated successfully');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setAmountPaid('');
      setSelectedCustomerId(null);
    } catch (err: any) {
      toast.error('Failed to save sale: ' + err.message);
    }
  };

  const addNewCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      return toast.error('Please fill in all required fields');
    }
    try {
      const { data, error } = await supabase.from('customers').insert({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        email: newCustomerEmail.trim(),
        user_id: user?.id
      }).select().single();

      if (error) throw error;

      setCustomerName(data.name);
      setCustomerPhone(data.phone);
      setSelectedCustomerId(data.id);
      setShowAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      toast.success('Customer added successfully');
    } catch (err: any) {
      toast.error("Failed to add customer: " + err.message);
    }
  };

  const handleDownloadPDF = () => {
    if (cart.length === 0 || !customerName.trim()) {
      toast.error('Please add items and customer details first');
      return;
    }

    const invoiceData = {
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      customerName: customerName,
      customerPhone: customerPhone || undefined,
      items: cart.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.total
      })),
      subtotal: subtotal,
      tax: 0,
      discount: discountAmount,
      total: total
    };

    generateInvoicePDF(invoiceData);
    toast.success('Invoice PDF downloaded successfully');
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-2 md:p-4">
      {/* Product Selection & Cart */}
      <div className="flex-1 space-y-4 min-w-0">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-black text-slate-800">Add Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all shadow-none rounded-xl"
                />

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-[60] bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto mt-2 overflow-hidden">
                    {searchResults.map(med => (
                      <div
                        key={med.id}
                        className="p-4 hover:bg-[hsl(var(--primary))]/5 cursor-pointer border-b border-slate-50 last:border-b-0 flex justify-between items-center group transition-colors"
                        onClick={() => {
                          setSelectedProduct(med);
                          setSearchTerm(med.name);
                          setSearchResults([]);
                        }}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{med.name}</p>
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">
                            Stock: {med.batches.reduce((acc: any, b: any) => acc + b.quantity, 0)} | Shelf: {med.shelf_number || 'N/A'}
                          </p>
                        </div>
                        <p className="font-black text-[hsl(var(--primary))] shrink-0 ml-4">₹{med.batches[0]?.selling_price || 0}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <div className="w-24">
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    className="h-12 bg-slate-50 border-slate-100 text-center font-bold rounded-xl"
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <Button
                  onClick={addToCart}
                  disabled={!selectedProduct}
                  className="h-12 px-6 bg-[hsl(var(--primary))] text-white font-black uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[hsl(var(--primary))]/20 flex-1 sm:flex-none"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card className="border-none shadow-sm overflow-hidden min-h-[400px]">
          <CardHeader className="pb-4 border-b border-slate-50">
            <CardTitle className="text-lg font-black text-slate-800 flex items-center justify-between">
              Cart
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-3 py-1 rounded-full">
                {cart.length} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-50">
                    <TableHead className="py-4 pl-6 text-[10px] font-black uppercase tracking-widest min-w-[150px]">Product</TableHead>
                    <TableHead className="py-4 text-center text-[10px] font-black uppercase tracking-widest">Qty</TableHead>
                    <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest min-w-[100px]">Price</TableHead>
                    <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest min-w-[100px]">Total</TableHead>
                    <TableHead className="py-4 pr-6 w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium">
                        Your cart is empty. Start adding products.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map((item) => (
                      <TableRow key={item.productId} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] font-black text-[hsl(var(--primary))] tracking-widest uppercase mt-1 opacity-60">
                            Shelf: {item.shelf || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-700">{item.quantity}</TableCell>
                        <TableCell className="text-right font-black text-slate-900">₹{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-black text-[hsl(var(--primary))]">₹{item.total.toFixed(2)}</TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg group-hover:opacity-100 opacity-0 transition-all"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer & Payment */}
      <div className="w-full xl:w-96 space-y-6">
        <Card className="border-none shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--primary))]/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-black text-slate-800">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Name *</Label>
              <div className="relative">
                <Input
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-100 rounded-xl"
                />
                {customerSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-100 rounded-xl shadow-xl max-h-40 overflow-y-auto mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {customerSearchResults.map(c => (
                      <div key={c.id} className="p-3 hover:bg-[hsl(var(--primary))]/5 cursor-pointer border-b border-slate-50 text-sm font-bold text-slate-700" onClick={() => {
                        setCustomerName(c.name);
                        setCustomerPhone(c.phone);
                        setSelectedCustomerId(c.id);
                        setCustomerSearchResults([]);
                      }}>
                        {c.name} <span className="text-[10px] text-slate-400 ml-2">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
              <Input
                placeholder="Enter phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl"
              />
            </div>

            <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-11 border-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-50 active:scale-95 transition-all">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl w-[95vw] sm:max-w-md">
                <DialogHeader className="pb-4 border-b border-slate-50">
                  <DialogTitle className="text-xl font-black text-slate-800">New Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name *</Label>
                    <Input
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Full Name"
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone *</Label>
                    <Input
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Mobile Number"
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl"
                    />
                  </div>
                  <Button onClick={addNewCustomer} className="w-full h-12 bg-[hsl(var(--primary))] text-white font-black uppercase tracking-widest rounded-xl hover:opacity-90 mt-4 shadow-lg shadow-[hsl(var(--primary))]/20">
                    Create Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[hsl(var(--primary))]/20 rounded-full -mb-24 -mr-24 blur-3xl pointer-events-none" />
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-lg font-black text-white/90">Payment & Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-[hsl(var(--primary))]/40"
                title="Select payment method"
              >
                <SelectValue placeholder="Select method" />
                <SelectItem value="cash" className="bg-slate-900 text-white">Cash Payment</SelectItem>
                <SelectItem value="card" className="bg-slate-900 text-white">Card / Debit</SelectItem>
                <SelectItem value="upi" className="bg-slate-900 text-white">UPI / QR Code</SelectItem>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-white/60">
                <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                <span className="font-bold text-green-400">-₹{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Amount Payable</span>
                <span className="text-2xl font-black text-[hsl(var(--primary))]">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={generateBill}
                className="w-full h-14 bg-[hsl(var(--primary))] text-white font-black uppercase tracking-widest rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-[hsl(var(--primary))]/20"
                disabled={cart.length === 0 || !customerName.trim()}
              >
                <Printer className="h-5 w-5 mr-3" />
                Complete Sale
              </Button>

              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full h-12 bg-white/5 border-white/10 text-white/80 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                disabled={cart.length === 0 || !customerName.trim()}
              >
                <Download className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
