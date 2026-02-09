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
import { Plus, Search, Edit, Trash2, Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const toast = {
  success: (msg: string) => alert("Success: " + msg),
  error: (msg: string) => alert("Error: " + msg)
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};

const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Inventory Purchase',
  'Maintenance',
  'Marketing',
  'Transportation',
  'Other'
];

export default memo(function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadExpenses();
  }, [page, searchTerm]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      let query = supabase.from('expenses').select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, count, error } = await query
        .order('date', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setExpenses(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.description || !formData.amount || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingExpense) {
        const { error } = await supabase.from('expenses').update({
          category: formData.category,
          description: formData.description,
          amount: formData.amount,
          date: formData.date
        }).eq('id', editingExpense.id);
        if (error) throw error;
        toast.success('Expense updated successfully');
      } else {
        const { error } = await supabase.from('expenses').insert({
          category: formData.category,
          description: formData.description,
          amount: formData.amount,
          date: formData.date,
          user_id: user?.id
        });
        if (error) throw error;
        toast.success('Expense added successfully');
      }
      loadExpenses();
      setShowAddDialog(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date.split('T')[0]
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
        toast.success('Expense deleted successfully');
        loadExpenses();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  // Stats
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category breakdown
  const categoryData = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#8177ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex flex-col justify-center items-center h-full">
            <div className="text-3xl font-bold text-[hsl(var(--primary))]">₹{totalExpenses.toFixed(2)}</div>
            <p className="text-gray-500">Expenses in View</p>
            <div className="mt-4 text-sm text-gray-400">Total Entries: {totalCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-[hsl(var(--primary))] text-white w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Category *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Description *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter expense description"
                />
              </div>
              <div>
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm hover:opacity-90">
                {editingExpense ? 'Update' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4 pl-6 text-[10px] font-black uppercase tracking-widest min-w-[120px]">Date</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest min-w-[120px]">Category</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest min-w-[200px]">Description</TableHead>
                  <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Amount</TableHead>
                  <TableHead className="py-4 pr-6 text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-gray-500 font-medium">No expenses found</TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatDate(expense.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-600 truncate max-w-[200px]">{expense.description}</TableCell>
                      <TableCell className="text-right font-black text-slate-900">
                        ₹{Number(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[hsl(var(--primary))] hover:bg-sky-50 rounded-lg" onClick={() => handleEdit(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 flex items-center justify-between border-t text-sm">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="font-bold text-slate-600">Page {page} of {Math.ceil(totalCount / pageSize)}</span>
            <Button variant="outline" size="sm" disabled={page * pageSize >= totalCount} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
