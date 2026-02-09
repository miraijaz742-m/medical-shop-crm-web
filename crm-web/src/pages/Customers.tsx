import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Button,
  Input,
  Label,
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
import { Plus, Search, Edit, Trash2, FileDown, Phone, Mail, MapPin, MessageCircle, Filter, RotateCcw, History, Eye, ChevronLeft, ChevronRight, Users, DollarSign } from 'lucide-react';
import type { Customer } from '@/types';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';

const toast = {
  success: (msg: string) => alert("Success: " + msg),
  error: (msg: string) => alert("Error: " + msg)
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};

export default memo(function Customers() {
  const { user } = useAuth();
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<any | null>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    balance: 0
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [page, searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('customers').select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, count, error } = await query
        .order('name', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setCustomerList(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('balance');
      if (error) throw error;
      const total = data.length;
      const balance = data.reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
      setStats({ total, totalBalance: balance });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingCustomer) {
        const { error } = await supabase.from('customers').update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          balance: formData.balance
        }).eq('id', editingCustomer.id);
        if (error) throw error;
        toast.success('Customer updated successfully');
      } else {
        const { error } = await supabase.from('customers').insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          balance: formData.balance,
          user_id: user?.id
        });
        if (error) throw error;
        toast.success('Customer added successfully');
      }
      loadCustomers();
      loadStats();
      setShowAddDialog(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
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

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
        toast.success('Customer deleted successfully');
        loadCustomers();
        loadStats();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleViewHistory = async (customer: any) => {
    setHistoryCustomer(customer);
    setShowHistoryDialog(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase.from('bills').select('*').eq('customer_id', customer.id).order('date', { ascending: false });
      if (error) throw error;
      setCustomerHistory(data || []);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-[hsl(var(--primary))] text-white w-full sm:w-auto">
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
                  />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Balance (₹)</Label>
                  <Input
                    type="number"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full bg-[hsl(var(--primary))] text-white">
                  {editingCustomer ? 'Update' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-50 text-[hsl(var(--primary))]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">₹{stats.totalBalance.toFixed(2)}</div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Outstanding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4 pl-6 text-[10px] font-black uppercase tracking-widest min-w-[150px]">Customer</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest min-w-[150px]">Contact</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest min-w-[100px]">Balance</TableHead>
                  <TableHead className="py-4 pr-6 text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerList.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6">
                      <div className="font-bold text-slate-900">{customer.name}</div>
                      <div className="text-[10px] text-gray-500 font-medium uppercase mt-1">{customer.address || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-slate-700">{customer.phone}</div>
                      <div className="text-[10px] text-gray-500">{customer.email || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-black ${customer.balance > 0 ? 'text-red-600' : 'text-[hsl(var(--primary))]'}`}>
                        ₹{Number(customer.balance).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[hsl(var(--primary))] hover:bg-sky-50 rounded-lg" onClick={() => handleEdit(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[hsl(var(--primary))] hover:bg-sky-50 rounded-lg" onClick={() => handleViewHistory(customer)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(customer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 flex items-center justify-between border-t">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span>Page {page} of {Math.ceil(totalCount / pageSize)}</span>
            <Button variant="outline" size="sm" disabled={page * pageSize >= totalCount} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase History: {historyCustomer?.name}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerHistory.map(bill => (
                <TableRow key={bill.id}>
                  <TableCell>{formatDate(bill.date)}</TableCell>
                  <TableCell>₹{Number(bill.total_amount).toFixed(2)}</TableCell>
                  <TableCell>{bill.items?.length || 0} items</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
});
