import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, RotateCcw, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@/types';
import { toast } from 'sonner';

interface MedicineSummary {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  total_stock: number;
  nearest_expiry: string;
  shelf_number: string;
  sellingPrice: number;
  low_stock_threshold: number;
}

interface Batch {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity_available: number;
  purchase_price: number;
  selling_price: number;
}

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  deleteProduct?: (id: string, skipHistory?: boolean) => Promise<void>;
  saveProduct?: (item: Product, skipHistory?: boolean) => Promise<void>;
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

export default memo(function Inventory({ deleteProduct }: InventoryProps) {
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

  const loadInventory = async () => {
    if (window.electronAPI) {
      const offset = (page - 1) * pageSize;
      const list = await window.electronAPI.inventoryGetSummary({
        limit: pageSize,
        offset,
        searchTerm,
        category: categoryFilter,
        stockStatus: stockFilter,
        expiryStatus: expiryFilter
      });
      setMedicines(list);

      const countResult = await window.electronAPI.inventoryGetCount({
        searchTerm,
        category: categoryFilter,
        stockStatus: stockFilter,
        expiryStatus: expiryFilter
      });
      setTotalCount(countResult.count);
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

    if (deleteProduct) {
      try {
        await deleteProduct(id);
        toast.success("Medicine Deleted");
        loadInventory();
        setExpandedMed(null);
      } catch (err: any) {
        toast.error("Delete Failed: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    if (window.electronAPI) {
      try {
        const res = await window.electronAPI.inventoryDeleteBatch({ batchId });
        if (res.success) {
          toast.success("Batch Deleted");
          if (expandedMed) {
            const batchList = await window.electronAPI.inventoryGetBatches({ medicineId: expandedMed });
            setBatches(batchList);
            loadInventory();
          }
        } else {
          toast.error("Delete Failed: " + res.error);
        }
      } catch (err: any) {
        toast.error("Delete Failed: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setShowEditDialog(true);
  };

  const submitEditBatch = async () => {
    if (!editingBatch) return;

    if (window.electronAPI) {
      const formattedBatch = { ...editingBatch };
      if (formattedBatch.expiry_date && formattedBatch.expiry_date.length === 7) {
        formattedBatch.expiry_date = `${formattedBatch.expiry_date}-01`;
      }

      const res = await window.electronAPI.inventoryUpdateBatch({ batch: formattedBatch });
      if (res.success) {
        toast.success("Batch Updated");
        setShowEditDialog(false);
        setEditingBatch(null);
        if (expandedMed) {
          const batchList = await window.electronAPI.inventoryGetBatches({ medicineId: expandedMed });
          setBatches(batchList);
          loadInventory();
        }
      } else {
        toast.error("Update Failed: " + res.error);
      }
    }
  };

  const handleShelfUpdate = async (medicineId: string) => {
    console.log("Updating shelf for:", medicineId, "Value:", shelfValue);
    if (window.electronAPI) {
      try {
        // @ts-ignore
        const res = await window.electronAPI.inventoryUpdateMedicine({ medicineId, shelfNumber: shelfValue });
        console.log("Update response:", res);
        if (res.success) {
          toast.success("Shelf Updated");
          setEditingShelfId(null);
          loadInventory();
        } else {
          toast.error("Update Failed: " + res.error);
        }
      } catch (err: any) {
        console.error("Shelf Update Error:", err);
        toast.error("System Error: " + err.message);
      }
    }
  };

  const handleThresholdUpdate = async (medicineId: string) => {
    if (window.electronAPI) {
      try {
        // @ts-ignore
        const res = await window.electronAPI.inventoryUpdateMedicine({ medicineId, lowStockThreshold: Number(thresholdValue) });
        if (res.success) {
          toast.success("Threshold Updated");
          setEditingThresholdId(null);
          loadInventory();
        } else {
          toast.error("Update Failed: " + res.error);
        }
      } catch (err: any) {
        toast.error("System Error: " + err.message);
      }
    }
  };

  const toggleExpand = async (medId: string) => {
    if (expandedMed === medId) {
      setExpandedMed(null);
    } else {
      setExpandedMed(medId);
      if (window.electronAPI) {
        const batchList = await window.electronAPI.inventoryGetBatches({ medicineId: medId });
        setBatches(batchList);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.batch_number) return toast.error("Name and Batch required");

    const medicineData = {
      id: `MED-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      company: formData.manufacturer,
      shelf_number: formData.shelf_number,
      low_stock_threshold: Number(formData.low_stock_threshold),
      mrp: formData.selling_price * 1.1,
      createdAt: new Date().toISOString()
    };

    const batchData = {
      batch_number: formData.batch_number,
      expiry_date: formData.expiry_date.length === 7 ? `${formData.expiry_date}-01` : formData.expiry_date,
      quantity: Number(formData.quantity),
      purchase_price: Number(formData.purchase_price),
      selling_price: Number(formData.selling_price)
    };

    if (window.electronAPI) {
      const res = await window.electronAPI.inventoryAddBatch({
        medicine: medicineData,
        batch: batchData
      });
      if (res.success) {
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
      } else {
        toast.error("Failed: " + res.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search medicines..."
              className="pl-10 h-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Array.from(new Set(medicines.map(m => m.category).filter(Boolean))).sort().map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Total Stock</SelectItem>
              <SelectItem value="low">Low Stock (Below Min)</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="healthy">Healthy (Above Min)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={expiryFilter} onValueChange={setExpiryFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white">
              <SelectValue placeholder="Expiry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="near">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || categoryFilter !== 'all' || stockFilter !== 'all' || expiryFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setStockFilter('all');
                setExpiryFilter('all');
              }}
              className="h-10 text-gray-500 hover:text-red-600"
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700">
              <Plus className="h-4 w-4 mr-2" /> Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New Stock (Batch-wise)</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <datalist id="medicine-names">
                {medicines.map(m => <option key={m.id} value={m.name} />)}
              </datalist>
              <datalist id="categories-list">
                {Array.from(new Set(medicines.map(m => m.category).filter(Boolean))).map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>

              <div className="space-y-2">
                <Label>Medicine Name</Label>
                <Input
                  list="medicine-names"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  list="categories-list"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Tablets"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={formData.batch_number} onChange={e => setFormData({ ...formData, batch_number: e.target.value })} placeholder="BATCH-001" />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="month" value={formData.expiry_date.slice(0, 7)} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
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
            <Button onClick={handleSubmit} className="w-full bg-sky-600">Save Stock</Button>
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
                  value={editingBatch?.quantity_available || 0}
                  onChange={e => setEditingBatch(prev => prev ? ({ ...prev, quantity_available: Number(e.target.value) }) : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="month"
                  value={editingBatch?.expiry_date ? editingBatch.expiry_date.slice(0, 7) : ''}
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
              <Button onClick={submitEditBatch} className="bg-blue-600 hover:bg-blue-700">Update Batch</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Shelf</TableHead>
                <TableHead>Nearest Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map(med => (
                <React.Fragment key={med.id}>
                  <TableRow className="cursor-pointer hover:bg-gray-50 from-gray-50" onClick={() => toggleExpand(med.id)}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell>{med.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${med.total_stock < med.low_stock_threshold ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`}>
                        {med.total_stock} Units
                      </span>
                    </TableCell>
                    <TableCell>
                      {editingThresholdId === med.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            className="h-7 w-16 text-xs py-0 px-1"
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleThresholdUpdate(med.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] cursor-pointer hover:bg-gray-100 transition-colors ${med.total_stock < med.low_stock_threshold ? 'text-red-600 font-bold border border-red-200' : 'text-gray-500 border border-gray-200'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingThresholdId(med.id);
                            setThresholdValue(String(med.low_stock_threshold || 10));
                          }}
                        >
                          Min: {med.low_stock_threshold || 10}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingShelfId === med.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            className="h-7 w-20 text-xs py-0 px-1"
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
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShelfUpdate(med.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingShelfId(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 font-mono cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingShelfId(med.id);
                            setShelfValue(med.shelf_number || '');
                          }}
                        >
                          {med.shelf_number || 'N/A'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`text-sm ${new Date(med.nearest_expiry) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) ? 'text-red-500 font-bold' : ''}`}>
                      {formatExpiry(med.nearest_expiry)}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2 items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        {expandedMed === med.id ? 'Collapse' : 'View Batches'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMedicine(med.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedMed === med.id && (
                    <TableRow className="bg-sky-50/50 hover:bg-sky-50/50">
                      <TableCell colSpan={6} className="p-4">
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
                                  <TableCell className="py-1 text-xs font-mono">{batch.quantity_available}</TableCell>
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
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
