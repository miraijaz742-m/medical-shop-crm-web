import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  Users,
  Package,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Bell,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { DashboardStats, Bill, Product, Customer, Expense } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  bills?: Bill[];
  products?: Product[];
  customers?: Customer[];
  expenses?: Expense[];
}

export default memo(function Dashboard({ }: DashboardProps) {
  // Local State
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalBills: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalExpenses: 0,
    todaySales: 0,
    todayBills: 0
  });

  const [salesData, setSalesData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [nearExpiryItems, setNearExpiryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (window.electronAPI) {
        try {
          // 1. Fetch Aggregated Stats
          const [invStats, custStats, salesStats, expStats] = await Promise.all([
            window.electronAPI.inventoryGetStats(),
            window.electronAPI.customersGetStats(),
            window.electronAPI.salesGetStats(),
            window.electronAPI.expensesGetStats()
          ]);

          setStats({
            totalSales: salesStats.totalSales,
            totalBills: salesStats.totalBills,
            totalCustomers: custStats.total,
            totalProducts: invStats.totalProducts,
            lowStockProducts: invStats.lowStock,
            totalExpenses: expStats.totalExpenses,
            todaySales: salesStats.todaySales,
            todayBills: salesStats.todayBills
          });

          // 2. Fetch Charts Data
          const salesChartRaw = await window.electronAPI.salesGetChartData();
          const categoryStats = await window.electronAPI.inventoryGetCategoryStats();

          // Process Sales Data (Fill missing days)
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
          });

          const processedSales = last7Days.map(dateStr => {
            const dayData = salesChartRaw.find((d: any) => d.date === dateStr);
            const dateObj = new Date(dateStr);
            return {
              date: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
              sales: dayData ? dayData.sales : 0
            };
          });
          setSalesData(processedSales);
          setPieData(categoryStats);

          // 3. Fetch Alert Lists (Limit 20 for preview)
          const lowStock = await window.electronAPI.inventoryGetSummary({ stockStatus: 'low', limit: 20 });
          const nearExpiry = await window.electronAPI.inventoryGetSummary({ expiryStatus: 'near', limit: 20 });

          setLowStockItems(lowStock);
          setNearExpiryItems(nearExpiry);

        } catch (error) {
          console.error("Failed to load dashboard data", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
  }, []);

  const COLORS = ['#03a9f4', '#0288d1', '#4fc3f7', '#81d4fa', '#b3e5fc'];

  const statCards = [
    { title: "Today's Sales", value: `₹${stats.todaySales.toFixed(2)}`, icon: DollarSign, color: 'bg-sky-500', subtext: `${stats.todayBills} bills today` },
    { title: 'Total Sales', value: `₹${stats.totalSales.toFixed(2)}`, icon: TrendingUp, color: 'bg-sky-500', subtext: `${stats.totalBills} total bills` },
    { title: 'Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'bg-sky-500', subtext: 'Registered customers' },
    { title: 'Products', value: stats.totalProducts.toString(), icon: Package, color: 'bg-sky-500', subtext: `${stats.lowStockProducts} low stock` },
    { title: 'Expenses', value: `₹${stats.totalExpenses.toFixed(2)}`, icon: Receipt, color: 'bg-sky-500', subtext: 'Total expenses' },
    { title: 'Low Stock', value: stats.lowStockProducts.toString(), icon: AlertTriangle, color: 'bg-sky-500', subtext: 'Items to reorder' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`${stat.color} p-1.5 rounded-lg`}>
                <stat.icon className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stat.value}</div>
              <p className="text-[10px] text-gray-500 mt-0.5">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="border-l-2 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {lowStockItems.length} Items (Preview)
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-1 px-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold text-xs">{item.name}</p>
                      <p className="text-[10px] text-gray-500">Shelf: {item.shelf_number || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${item.total_stock < 5 ? 'text-red-600' : 'text-amber-600'}`}>
                        {item.total_stock} units
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <Bell className="h-6 w-6 mb-1 opacity-20" />
                  <p className="text-xs">Healthy stock</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expiry Alerts */}
        <Card className="border-l-2 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-red-500" />
              Expiring Soon
            </CardTitle>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">
              {nearExpiryItems.length} Batches (Preview)
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {nearExpiryItems.length > 0 ? (
                nearExpiryItems.map(item => {
                  const expiryDate = new Date((item as any).nearest_expiry);
                  const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  const isExpired = daysLeft < 0;

                  return (
                    <div key={item.id} className="flex items-center justify-between p-1 px-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-semibold text-xs">{item.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {expiryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isExpired ? 'bg-red-100 text-red-700' : daysLeft < 30 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                          {isExpired ? 'EXPIRED' : `${daysLeft}d`}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <Bell className="h-6 w-6 mb-1 opacity-20" />
                  <p className="text-xs">No upcoming expiries</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sales Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                <Bar dataKey="sales" fill="#03a9f4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
});
