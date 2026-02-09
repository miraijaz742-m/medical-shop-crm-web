import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/common';
import { Plus, Search, Edit, Trash2, RotateCcw, ChevronLeft, ChevronRight, Check, X, Package, AlertTriangle, Clock, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';

// Helper for notifications (simplified toast)
const toast = {
  success: (msg: string) => alert("Success: " + msg),
  error: (msg: string) => alert("Error: " + msg)
};

interface MedicineSummary {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  total_stock: number;
  nearest_expiry: string;
  shelf_number: string;
  low_stock_threshold: number;
}

interface Batch {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
}

const formatExpiry = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export default memo(function Inventory() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<MedicineSummary[]>([]);
  const [expandedMed, setExpandedMed] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  // Edit State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [shelfValue, setShelfValue] = useState('');
  const [thresholdValue, setThresholdValue] = useState('');

  // Add Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    shelf_number: '',
    quantity: 0,
    purchase_price: 0,
    selling_price: 0,
    low_stock_threshold: 10
  });

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = async (name: string) => {
    if (name.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('name, category, manufacturer, shelf_number, low_stock_threshold')
        .ilike('name', `%${name}%`)
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
      setShowSuggestions(data && data.length > 0);
    } catch (err) {
      console.error("Fetch Suggestions Error:", err);
    }
  };

  const handleSelectSuggestion = (med: any) => {
    setFormData({
      ...formData,
      name: med.name,
      category: med.category || '',
      manufacturer: med.manufacturer || '',
      shelf_number: med.shelf_number || '',
      low_stock_threshold: med.low_stock_threshold || 10
    });
    setShowSuggestions(false);
  };

  const loadInventory = async () => {
    try {
      const offset = (page - 1) * pageSize;

      let query = supabase.from('medicines').select('*, batches(*)', { count: 'exact' });

      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
      if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);

      const { data, count, error } = await query.range(offset, offset + pageSize - 1);

      if (error) throw error;

      loadStats();

      const summaries = data.map((med: any) => {
        const totalStock = med.batches.reduce((acc: number, b: any) => acc + (b.quantity || 0), 0);
        const nearExpiry = med.batches.length > 0
          ? med.batches.reduce((prev: any, curr: any) => {
            if (!prev.expiry_date) return curr;
            if (!curr.expiry_date) return prev;
            return new Date(curr.expiry_date) < new Date(prev.expiry_date) ? curr : prev;
          }).expiry_date
          : null;

        return {
          id: med.id,
          name: med.name,
          category: med.category,
          manufacturer: med.manufacturer,
          total_stock: totalStock,
          nearest_expiry: nearExpiry,
          shelf_number: med.shelf_number,
          low_stock_threshold: med.low_stock_threshold
        };
      });

      // Handle Stock/Expiry filtering in JS (Simpler than complex SQL grouping/filtering in one go)
      let filteredSummaries = summaries;
      if (stockFilter === 'low') filteredSummaries = filteredSummaries.filter(s => s.total_stock < s.low_stock_threshold);
      if (stockFilter === 'out') filteredSummaries = filteredSummaries.filter(s => s.total_stock === 0);
      if (stockFilter === 'healthy') filteredSummaries = filteredSummaries.filter(s => s.total_stock >= s.low_stock_threshold);

      if (expiryFilter === 'expired') {
        const now = new Date();
        filteredSummaries = filteredSummaries.filter(s => s.nearest_expiry && new Date(s.nearest_expiry) < now);
      } else if (expiryFilter === 'near') {
        const now = new Date();
        const soon = new Date();
        soon.setMonth(soon.getMonth() + 1);
        filteredSummaries = filteredSummaries.filter(s => s.nearest_expiry && new Date(s.nearest_expiry) >= now && new Date(s.nearest_expiry) < soon);
      }

      setMedicines(filteredSummaries);
      setTotalCount(count || 0);

    } catch (err: any) {
      console.error("Load Inventory Error:", err);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, stockFilter, expiryFilter]);

  useEffect(() => {
    loadInventory();
  }, [page, searchTerm, categoryFilter, stockFilter, expiryFilter]);

  const handleDeleteMedicine = async (id: string) => {
    if (!confirm("Delete this medicine and all its batches? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from('medicines').delete().eq('id', id);
      if (error) throw error;
      toast.success("Medicine Deleted");
      loadInventory();
      setExpandedMed(null);
    } catch (err: any) {
      toast.error("Delete Failed: " + err.message);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    try {
      const { error } = await supabase.from('batches').delete().eq('id', batchId);
      if (error) throw error;
      toast.success("Batch Deleted");
      if (expandedMed) {
        const { data } = await supabase.from('batches').select('*').eq('medicine_id', expandedMed);
        setBatches(data || []);
        loadInventory();
      }
    } catch (err: any) {
      toast.error("Delete Failed: " + err.message);
    }
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setShowEditDialog(true);
  };

  const submitEditBatch = async () => {
    if (!editingBatch) return;
    try {
      const { error } = await supabase.from('batches').update({
        quantity: editingBatch.quantity,
        expiry_date: editingBatch.expiry_date,
        selling_price: editingBatch.selling_price
      }).eq('id', editingBatch.id);

      if (error) throw error;

      toast.success("Batch Updated");
      setShowEditDialog(false);
      setEditingBatch(null);
      if (expandedMed) {
        const { data } = await supabase.from('batches').select('*').eq('medicine_id', expandedMed);
        setBatches(data || []);
        loadInventory();
      }
    } catch (err: any) {
      toast.error("Update Failed: " + err.message);
    }
  };

  const handleShelfUpdate = async (medicineId: string) => {
    try {
      const { error } = await supabase.from('medicines').update({ shelf_number: shelfValue }).eq('id', medicineId);
      if (error) throw error;
      toast.success("Shelf Updated");
      setEditingShelfId(null);
      loadInventory();
    } catch (err: any) {
      toast.error("Update Failed: " + err.message);
    }
  };

  const handleThresholdUpdate = async (medicineId: string) => {
    try {
      const { error } = await supabase.from('medicines').update({ low_stock_threshold: Number(thresholdValue) }).eq('id', medicineId);
      if (error) throw error;
      toast.success("Threshold Updated");
      setEditingThresholdId(null);
      loadInventory();
    } catch (err: any) {
      toast.error("Update Failed: " + err.message);
    }
  };

  const toggleExpand = async (medId: string) => {
    if (expandedMed === medId) {
      setExpandedMed(null);
    } else {
      setExpandedMed(medId);
      const { data } = await supabase.from('batches').select('*').eq('medicine_id', medId);
      setBatches(data || []);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.batch_number) return toast.error("Name and Batch required");

    try {
      // Find if medicine exists
      const { data: existingMed } = await supabase.from('medicines').select('id').eq('name', formData.name).maybeSingle();

      let medId = existingMed?.id;

      if (!medId) {
        const { data: newMed, error: medError } = await supabase.from('medicines').insert({
          name: formData.name,
          category: formData.category,
          manufacturer: formData.manufacturer,
          shelf_number: formData.shelf_number,
          low_stock_threshold: Number(formData.low_stock_threshold),
          user_id: user?.id
        }).select().single();
        if (medError) throw medError;
        medId = newMed.id;
      }

      const { error: batchError } = await supabase.from('batches').insert({
        medicine_id: medId,
        batch_number: formData.batch_number,
        expiry_date: formData.expiry_date ? `${formData.expiry_date}-01` : null,
        quantity: Number(formData.quantity),
        purchase_price: Number(formData.purchase_price),
        selling_price: Number(formData.selling_price),
        user_id: user?.id
      });

      if (batchError) throw batchError;

      toast.success("Stock Added Successfully");
      setShowAddDialog(false);
      setFormData({
        name: '',
        category: '',
        manufacturer: '',
        batch_number: '',
        expiry_date: '',
        shelf_number: '',
        quantity: 0,
        purchase_price: 0,
        selling_price: 0,
        low_stock_threshold: 10
      });
      loadInventory();

    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
  };

  const [stats, setStats] = useState({ total: 0, lowStock: 0, expiringSoon: 0 });

  const loadStats = async () => {
    try {
      const { data: meds, error } = await supabase.from('medicines').select('id, low_stock_threshold, batches(quantity, expiry_date)');
      if (error) throw error;

      let totalCount = meds.length;
      let lowStockCount = 0;
      let expiringSoonCount = 0;
      const now = new Date();
      const soon = new Date();
      soon.setMonth(soon.getMonth() + 2);

      meds.forEach(med => {
        const totalStock = med.batches.reduce((acc: number, b: any) => acc + (b.quantity || 0), 0);
        if (totalStock < (med.low_stock_threshold || 10)) lowStockCount++;

        const hasExpiring = med.batches.some((b: any) => {
          if (!b.expiry_date) return false;
          const exp = new Date(b.expiry_date);
          return exp >= now && exp <= soon;
        });
        if (hasExpiring) expiringSoonCount++;
      });

      setStats({ total: totalCount, lowStock: lowStockCount, expiringSoon: expiringSoonCount });
    } catch (err) {
      console.error("Load Stats Error:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6 p-2 md:p-6 bg-gray-50/50 min-h-screen">
      {/* Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center p-4 md:p-6">
              <div className="p-3 rounded-xl bg-sky-50 text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white">
                <Package className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">Total Medicines</p>
                <div className="flex items-baseline">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</h3>
                  <span className="ml-2 text-[10px] md:text-xs text-[hsl(var(--primary))] font-medium">Items</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center p-4 md:p-6">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">Low Stock Alerts</p>
                <div className="flex items-baseline">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">{stats.lowStock}</h3>
                  <span className="ml-2 text-[10px] md:text-xs text-orange-600 font-medium">Require Reorder</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-0">
            <div className="flex items-center p-4 md:p-6">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">Expiring Soon</p>
                <div className="flex items-baseline">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">{stats.expiringSoon}</h3>
                  <span className="ml-2 text-[10px] md:text-xs text-purple-600 font-medium">Next 60 Days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search medicines..."
              className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white shadow-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[130px] h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.from(new Set(medicines.map(m => m.category).filter(Boolean))).sort().map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[100px] h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="healthy">In Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="w-[100px] h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="near">Near Expiry</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || categoryFilter !== 'all' || stockFilter !== 'all' || expiryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStockFilter('all');
                  setExpiryFilter('all');
                }}
                className="h-11 w-11 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            )}

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[hsl(var(--primary))] hover:bg-sky-700 text-white h-11 px-4 rounded-lg shadow-sm flex-1 lg:flex-none justify-center">
                  <Plus className="h-5 w-5 mr-2" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl w-[95vw] rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Stock</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                  <div className="space-y-2 relative">
                    <Label>Medicine Name</Label>
                    <Input
                      value={formData.name}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, name: val });
                        fetchSuggestions(val);
                      }}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="e.g. Paracetamol 500mg"
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-[200px] overflow-y-auto">
                        {suggestions.map((med, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-2.5 hover:bg-sky-50 cursor-pointer border-b border-gray-50 last:border-none group"
                            onClick={() => handleSelectSuggestion(med)}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 group-hover:text-[hsl(var(--primary))]">{med.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-1 rounded">{med.category || 'N/A'}</span>
                                {med.shelf_number && <span className="text-[10px] text-sky-500 font-medium">Shelf: {med.shelf_number}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Tablets"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input value={formData.batch_number} onChange={e => setFormData({ ...formData, batch_number: e.target.value })} placeholder="BATCH-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input type="month" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input type="number" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Shelf Number</Label>
                    <Input value={formData.shelf_number} onChange={e => setFormData({ ...formData, shelf_number: e.target.value })} placeholder="e.g. A-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Alert At</Label>
                    <Input type="number" value={formData.low_stock_threshold} onChange={e => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })} placeholder="Default 10" />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full h-11 bg-[hsl(var(--primary))] hover:bg-sky-700 text-white font-semibold">Save Stock</Button>
              </DialogContent>
            </Dialog>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Batch: {editingBatch?.batch_number}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Quantity Available</Label>
                    <Input
                      type="number"
                      value={editingBatch?.quantity || 0}
                      onChange={e => setEditingBatch(prev => prev ? ({ ...prev, quantity: Number(e.target.value) }) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={editingBatch?.expiry_date || ''}
                      onChange={e => setEditingBatch(prev => prev ? ({ ...prev, expiry_date: e.target.value }) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      value={editingBatch?.selling_price || 0}
                      onChange={e => setEditingBatch(prev => prev ? ({ ...prev, selling_price: Number(e.target.value) }) : null)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                  <Button onClick={submitEditBatch} className="bg-blue-600 hover:bg-blue-700 text-white">Update Batch</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="py-4 font-semibold text-gray-600 min-w-[200px]">MEDICINE INFO</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600 min-w-[120px]">SHELF</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600 min-w-[150px]">TOTAL STOCK</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600 min-w-[140px]">NEAREST EXPIRY</TableHead>
                    <TableHead className="py-4 font-semibold text-gray-600 text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map(med => (
                    <React.Fragment key={med.id}>
                      <TableRow
                        className="group cursor-pointer hover:bg-sky-50/30 border-gray-50"
                        onClick={() => toggleExpand(med.id)}
                      >
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 group-hover:text-[hsl(var(--primary))]">{med.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                {med.category || 'General'}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          {editingShelfId === med.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                className="h-8 w-20 text-xs py-0 px-2 bg-white"
                                value={shelfValue}
                                onChange={(e) => setShelfValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.stopPropagation();
                                    handleShelfUpdate(med.id);
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShelfUpdate(med.id);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100 hover:bg-sky-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingShelfId(med.id);
                                setShelfValue(med.shelf_number || '');
                              }}
                            >
                              <MapPin className="h-3 w-3" />
                              {med.shelf_number || 'SET SHELF'}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1.5 min-w-[120px]">
                            <div className="flex justify-between items-end">
                              <span className={`text-sm font-bold ${med.total_stock < (med.low_stock_threshold || 10) ? 'text-red-600' : 'text-gray-900'}`}>
                                {med.total_stock} <span className="text-[10px] text-gray-400 font-normal ml-0.5">Units</span>
                              </span>
                              {editingThresholdId === med.id ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    className="h-6 w-12 text-[10px] py-0 px-1 bg-white"
                                    type="number"
                                    value={thresholdValue}
                                    onChange={(e) => setThresholdValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.stopPropagation();
                                        handleThresholdUpdate(med.id);
                                      }
                                    }}
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <span
                                  className="text-[10px] text-gray-400 hover:text-[hsl(var(--primary))] cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingThresholdId(med.id);
                                    setThresholdValue(String(med.low_stock_threshold || 10));
                                  }}
                                >
                                  Min: {med.low_stock_threshold || 10}
                                </span>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${med.total_stock < (med.low_stock_threshold || 10) ? 'bg-red-500' : 'bg-sky-500'}`}
                                style={{ width: `${Math.min(100, (med.total_stock / ((med.low_stock_threshold || 10) * 2)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${new Date(med.nearest_expiry) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              <Calendar className="h-4 w-4" />
                            </div>
                            <span className={`text-sm font-medium ${new Date(med.nearest_expiry) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                              {formatExpiry(med.nearest_expiry)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMedicine(med.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedMed === med.id && (
                        <TableRow className="bg-sky-50/50">
                          <TableCell colSpan={5} className="p-4">
                            <div className="pl-4 border-l-2 border-sky-300">
                              <h4 className="font-semibold text-sm mb-2 text-sky-800">Available Batches</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-none">
                                    <TableHead className="h-8 text-xs">Batch #</TableHead>
                                    <TableHead className="h-8 text-xs">Expiry</TableHead>
                                    <TableHead className="h-8 text-xs">Qty</TableHead>
                                    <TableHead className="h-8 text-xs text-right">Price</TableHead>
                                    <TableHead className="h-8 text-xs text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {batches.map(batch => (
                                    <TableRow key={batch.id} className="border-none hover:bg-transparent">
                                      <TableCell className="py-1 text-xs">{batch.batch_number}</TableCell>
                                      <TableCell className="py-1 text-xs">{formatExpiry(batch.expiry_date)}</TableCell>
                                      <TableCell className="py-1 text-xs font-mono">{batch.quantity}</TableCell>
                                      <TableCell className="py-1 text-xs text-right">₹{batch.selling_price}</TableCell>
                                      <TableCell className="py-1 text-xs text-right space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-blue-600 hover:text-blue-800"
                                          onClick={() => handleEditBatch(batch)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-600 hover:text-red-800"
                                          onClick={() => handleDeleteBatch(batch.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{Math.min(medicines.length, totalCount)}</span> of <span className="font-semibold text-gray-900">{totalCount}</span> items
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= totalCount}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
