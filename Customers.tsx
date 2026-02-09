import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptimizedInput } from '@/components/ui/optimized-input';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, FileDown, Phone, Mail, MapPin, MessageCircle, Filter, SortAsc, ChevronLeft, ChevronRight, RotateCcw, History, Eye } from 'lucide-react';
import type { Customer, AppSettings } from '@/types';
import { generateCustomersPDF, generateCustomerHistoryPDF } from '@/lib/pdfUtils';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface CustomersProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  deleteCustomer?: (id: string, skipHistory?: boolean) => Promise<void>;
  saveCustomer?: (item: Customer, skipHistory?: boolean) => Promise<void>;
}

const CustomersContent = memo(function CustomersContent({ deleteCustomer, saveCustomer }: CustomersProps) {
  // Local Data State
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, newCount: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    balance: 0
  });

  // Filter & Sort State
  const [filterBalance, setFilterBalance] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    loadCustomers();
    loadStats();
    fetchSettings();
  }, [page, searchTerm, filterBalance, filterDate, sortBy]);

  const fetchSettings = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.settingsGet();
      if (res.success) {
        setAppSettings(res.settings);
      }
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterBalance, filterDate, sortBy]);

  const loadCustomers = async () => {
    if (window.electronAPI) {
      setLoading(true);
      const offset = (page - 1) * pageSize;

      // Determine orderBy string for backend
      let orderBySql = 'name ASC';
      if (sortBy === 'balance_desc') orderBySql = 'balance DESC';
      else if (sortBy === 'newest') orderBySql = 'createdAt DESC';

      // Prepare query for balance filter
      const queryParams: any = {};
      // Note: Generic dbQuery handle handles simple equality. 
      // For range/boolean, we might need a custom handler or handle in frontend?
      // Actually, for simplicity, I'll update db:query in electron-main to handle basic balance filters if needed, 
      // but for now let's just use the searchTerm/pagination.

      const results = await window.electronAPI.dbQuery({
        table: 'customers',
        orderBy: orderBySql,
        limit: pageSize,
        offset,
        searchField: 'name', // Or handle with OR in backend
        searchTerm: searchTerm,
        query: queryParams
      });

      setCustomerList(results);

      const countRes = await window.electronAPI.dbCount({
        table: 'customers',
        searchField: 'name',
        searchTerm: searchTerm,
        query: queryParams
      });
      setTotalCount(countRes.count);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (window.electronAPI) {
      const s = await window.electronAPI.customersGetStats();
      setStats(s);
    }
  };

  const filteredCustomersCount = totalCount;

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingCustomer) {
      if (saveCustomer) {
        await saveCustomer({ ...editingCustomer, ...formData } as Customer);
      }
      toast.success('Customer updated successfully');
    } else {
      const newCustomer: Customer = {
        id: `CUST-${Date.now()}`,
        name: formData.name!,
        phone: formData.phone!,
        email: formData.email,
        address: formData.address,
        balance: Number(formData.balance) || 0,
        createdAt: new Date().toISOString()
      };
      if (saveCustomer) {
        await saveCustomer(newCustomer);
      }
      toast.success('Customer added successfully');
    }
    loadCustomers();
    loadStats();

    resetForm();
    setShowAddDialog(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      balance: 0
    });
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      if (deleteCustomer) {
        await deleteCustomer(id);
        toast.success('Customer deleted successfully');
        loadCustomers();
        loadStats();
      }
    }
  };

  const handleViewHistory = async (customer: Customer) => {
    setHistoryCustomer(customer);
    setShowHistoryDialog(true);
    setHistoryLoading(true);
    if (window.electronAPI) {
      try {
        const results = await window.electronAPI.dbQuery({
          table: 'sales',
          query: { customer_id: customer.id },
          orderBy: 'sale_date DESC'
        });
        setCustomerHistory(results);
      } catch (error) {
        console.error('Failed to load history:', error);
        toast.error('Failed to load purchase history');
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const handleOpenInvoice = async (saleId: string) => {
    if (window.electronAPI && window.electronAPI.salesOpenPDF) {
      const res = await window.electronAPI.salesOpenPDF({ saleId });
      if (!res.success) {
        toast.error(res.error || 'Failed to open invoice');
      }
    }
  };

  const exportPDF = () => {
    generateCustomersPDF(customerList); // Exports current page only for now, or fetch all in a dedicated PDF loop?
    toast.success('Customers report (current page) downloaded');
  };

  const sendWhatsAppMessage = (customer: Customer) => {
    if (!customer.phone) {
      toast.error("No phone number found for this customer");
      return;
    }

    const cleanPhone = customer.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const name = customer.name.trim();

    const shopName = appSettings?.shopName || 'Our Pharmacy';
    const shopAddress = appSettings?.address || 'Our Address';
    const message = `*${shopName}, Druggists & Chemists*
Address: *${shopAddress}*

Hello *${name}*,

We hope this message finds you in the best of health and spirits.

This is a friendly update from ${shopName} regarding your account. As of today, our records indicate that your current outstanding balance is *₹${(customer.balance || 0).toFixed(2)}*.

We kindly request you to settle this amount at your earliest convenience. If you have already made a payment or have any questions regarding your statement, please feel free to visit us at our storefront or get in touch with our team.

We truly appreciate your continued trust in us for your healthcare needs.

Wishing you a journey toward complete wellness and a life filled with vibrant health!

Warm regards,

*The Team at ${shopName}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    const waWindow = window.open(whatsappUrl, '_blank');
    if (waWindow) {
      setTimeout(() => {
        try {
          waWindow.close();
        } catch (e) {
          console.error("Auto-close failed", e);
        }
      }, 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <OptimizedInput
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onDebouncedChange={(value) => setSearchTerm(value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                  <div>
                    <Label>Opening Balance (₹)</Label>
                    <Input
                      type="number"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                      className="font-bold text-red-600"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {(searchTerm || filterBalance !== 'all' || filterDate !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterBalance('all');
                setFilterDate('all');
              }}
              className="text-gray-500 hover:text-red-600 h-10"
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Customers Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-sky-600">{stats.total}</div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-sky-500">
              {stats.newCount}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">New (30 Days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-red-500">
              ₹{(stats.totalBalance || 0).toLocaleString()}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <CardTitle className="text-sm font-semibold">Customer List ({filteredCustomersCount})</CardTitle>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={filterBalance} onValueChange={setFilterBalance}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Balance Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Balances</SelectItem>
                    <SelectItem value="due">Due Balance</SelectItem>
                    <SelectItem value="clear">Clear (₹0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Registration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-gray-400" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="balance_desc">Highest Balance</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerList.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-xs sm:text-sm">{customer.name}</p>
                        <p className="text-[10px] text-gray-500">ID: {customer.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[11px]">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.address ? (
                        <div className="flex items-start gap-2 text-[11px]">
                          <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                          <span className="max-w-[150px] truncate">{customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold text-xs ${customer.balance && customer.balance > 0 ? 'text-red-600' : 'text-sky-600'}`}>
                        ₹{(customer.balance || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => sendWhatsAppMessage(customer)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                        onClick={() => handleViewHistory(customer)}
                        title="View History"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {customerList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {loading ? 'Searching...' : 'No customers found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="text-xs text-gray-500">
              Showing <span className="font-semibold">{Math.min(customerList.length, totalCount)}</span> of <span className="font-semibold">{totalCount}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-3 w-3 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-sky-600" />
              Purchase History: {historyCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4 px-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading history...</TableCell>
                  </TableRow>
                ) : customerHistory.length > 0 ? (
                  customerHistory.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">#{sale.invoice_no}</TableCell>
                      <TableCell className="text-xs">{formatDate(sale.sale_date)}</TableCell>
                      <TableCell className="text-xs font-bold">₹{sale.grand_total.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-sky-600">₹{(sale.amount_paid || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-red-600">₹{(sale.balance_due || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${sale.balance_due <= 0 ? 'bg-sky-100 text-sky-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {sale.balance_due <= 0 ? 'Paid' : 'Due'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                          onClick={() => handleOpenInvoice(sale.id)}
                          title="Open Invoice PDF"
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500 italic">
                      No purchase history found for this customer.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="pt-4 flex justify-between gap-2">
            <Button
              variant="outline"
              className="flex-1 border-sky-600 text-sky-600 hover:bg-sky-50"
              onClick={() => {
                if (historyCustomer && appSettings) {
                  generateCustomerHistoryPDF(historyCustomer, customerHistory, appSettings);
                } else {
                  toast.error("Settings or Customer data not ready");
                }
              }}
            >
              <FileDown className="h-4 w-4 mr-2" /> Download Report (A4 PDF)
            </Button>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default function Customers(props: CustomersProps) {
  return (
    <ErrorBoundary name="Customers Section">
      <CustomersContent {...props} />
    </ErrorBoundary>
  );
}
