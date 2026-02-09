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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';

export default memo(function Dashboard() {
  const { user } = useAuth();
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
      try {
        setLoading(true);

        // 1. Fetch Aggregated Stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
          { count: totalProducts },
          { count: lowStockCount },
          { count: totalCustomers },
          { data: bills },
          { data: expenses }
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
          supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10).eq('user_id', user?.id),
          supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
          supabase.from('bills').select('total_amount, date').eq('user_id', user?.id),
          supabase.from('expenses').select('amount').eq('user_id', user?.id)
        ]);

        const totalSales = bills?.reduce((acc, b) => acc + (b.total_amount || 0), 0) || 0;
        const totalExpenses = expenses?.reduce((acc, e) => acc + (e.amount || 0), 0) || 0;

        const todayBillsList = bills?.filter(b => new Date(b.date) >= today) || [];
        const todaySales = todayBillsList.reduce((acc, b) => acc + (b.total_amount || 0), 0);

        setStats({
          totalSales,
          totalBills: bills?.length || 0,
          totalCustomers: totalCustomers || 0,
          totalProducts: totalProducts || 0,
          lowStockProducts: lowStockCount || 0,
          totalExpenses,
          todaySales,
          todayBills: todayBillsList.length
        });

        // 2. Process Charts Data (Simple mock/fetch for now)
        // In a real app, you'd group by date in SQL or process here
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          d.setHours(0, 0, 0, 0);
          return d;
        });

        const processedSales = last7Days.map(date => {
          const dayTotal = bills?.filter(b => {
            const bd = new Date(b.date);
            bd.setHours(0, 0, 0, 0);
            return bd.getTime() === date.getTime();
          }).reduce((acc, b) => acc + (b.total_amount || 0), 0) || 0;

          return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: dayTotal
          };
        });
        setSalesData(processedSales);

        // 3. Fetch Alert Lists
        const { data: lowStock } = await supabase.from('products')
          .select('*')
          .lt('stock', 10)
          .eq('user_id', user?.id)
          .order('stock', { ascending: true })
          .limit(20);

        const { data: categories } = await supabase.from('products')
          .select('category')
          .eq('user_id', user?.id);

        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        const { data: nearExpiry } = await supabase.from('products')
          .select('*')
          .lt('expiry_date', oneMonthFromNow.toISOString())
          .eq('user_id', user?.id)
          .order('expiry_date', { ascending: true })
          .limit(20);

        setLowStockItems(lowStock || []);
        setNearExpiryItems(nearExpiry || []);

        // Category distribution
        const catMap: Record<string, number> = {};
        categories?.forEach(p => {
          if (p.category) {
            catMap[p.category] = (catMap[p.category] || 0) + 1;
          }
        });
        setPieData(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const COLORS = ['#8177ea', '#2d3748', '#4a5568', '#718096', '#a0aec0'];

  const statCards = [
    { title: "Today's Sales", value: `₹${stats.todaySales.toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500', subtext: `${stats.todayBills} bills today` },
    { title: 'Total Sales', value: `₹${stats.totalSales.toFixed(2)}`, icon: TrendingUp, color: 'bg-[hsl(var(--primary))]', subtext: `${stats.totalBills} total bills` },
    { title: 'Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'bg-blue-500', subtext: 'Registered customers' },
    { title: 'Products', value: stats.totalProducts.toString(), icon: Package, color: 'bg-indigo-500', subtext: `${stats.lowStockProducts} low stock` },
    { title: 'Expenses', value: `₹${stats.totalExpenses.toFixed(2)}`, icon: Receipt, color: 'bg-rose-500', subtext: 'Total expenses' },
    { title: 'Low Stock', value: stats.lowStockProducts.toString(), icon: AlertTriangle, color: 'bg-amber-500', subtext: 'Items to reorder' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color}/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.title}
              </CardTitle>
              <div className={`${stat.color} w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${stat.color.split('-')[1]}-500/20 transition-all group-hover:rotate-12`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="border-none shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100/50 bg-slate-50/30">
            <CardTitle className="text-sm font-black flex items-center gap-3 text-slate-800 uppercase tracking-wider">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              Low Stock Alerts
            </CardTitle>
            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 uppercase tracking-widest">
              {lowStockItems.length} Items
            </span>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                        {item.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Shelf: {item.shelf_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${item.stock < 5 ? 'text-red-500' : 'text-amber-500'}`}>
                        {item.stock} <span className="text-[10px] font-bold text-slate-400">UNITS</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Healthy stock levels</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expiry Alerts */}
        <Card className="border-none shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100/50 bg-slate-50/30">
            <CardTitle className="text-sm font-black flex items-center gap-3 text-slate-800 uppercase tracking-wider">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <Calendar className="h-5 w-5" />
              </div>
              Expiring Soon
            </CardTitle>
            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 uppercase tracking-widest">
              {nearExpiryItems.length} Batches
            </span>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {nearExpiryItems.length > 0 ? (
                nearExpiryItems.map(item => {
                  const expiryDate = new Date(item.expiry_date);
                  const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  const isExpired = daysLeft < 0;
                  const statusColor = isExpired ? 'bg-rose-500/10 text-rose-600 border-rose-200' : daysLeft < 30 ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200';

                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 hover:shadow-md hover:shadow-rose-500/5 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                          {item.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 tracking-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            Exp: {expiryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-black px-3 py-1 border rounded-lg uppercase tracking-widest ${statusColor} shadow-sm`}>
                          {isExpired ? 'EXPIRED' : `${daysLeft}d left`}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No upcoming expiries</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <Card className="border-none shadow-xl shadow-slate-200/40 p-2">
          <CardHeader className="pb-8">
            <CardTitle className="text-sm font-black flex items-center gap-3 text-slate-800 uppercase tracking-wider">
              <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--primary))]/10 flex items-center justify-center text-[hsl(var(--primary))]">
                <ShoppingCart className="h-5 w-5" />
              </div>
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} className="sm:h-[340px]">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(179, 255, 77, 0.05)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 800, color: '#0f172a' }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Sales']}
                />
                <Bar dataKey="sales" fill="url(#salesGradient)" radius={[8, 8, 8, 8]} barSize={20} />
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-none shadow-xl shadow-slate-200/40 p-2">
          <CardHeader className="pb-8">
            <CardTitle className="text-sm font-black flex items-center gap-3 text-slate-800 uppercase tracking-wider">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Package className="h-5 w-5" />
              </div>
              Inventory Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 640 ? 60 : 80}
                  outerRadius={window.innerWidth < 640 ? 90 : 110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
});
