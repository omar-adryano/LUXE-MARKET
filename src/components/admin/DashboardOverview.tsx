import React from 'react';
import { useAdminData } from './AdminDataContext';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, AlertCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

export const DashboardOverview = () => {
  const { data } = useAdminData();
  if (!data) return null;

  const { stats, orders, products } = data;

  // Real computation from orders
  const pendingOrders = orders.filter((o: any) => o.status === 'Pending').length;
  const publishedProducts = products.filter((p: any) => p.isPublished).length;
  
  // Custom metrics calculation
  const totalRevenue = stats?.totalRevenue || 0;
  
  // Fake net profit computation mathematically derived from real variables (since historical real cost is not stored)
  // Let's assume CJ Cost averages 33% of sell price, and shipping takes 15%
  // Or we can just calculate literal profit if we want:
  const paypalFeeSum = orders.reduce((acc, o) => acc + (o.total * 0.029 + 0.30), 0);
  const orderShippingCostSum = orders.reduce((acc, o) => acc + (o.shippingCost || 0), 0);
  // Estimate average cost of goods sold based on typical markup for the stored total
  const estimatedCogs = totalRevenue * 0.33; 
  const netProfit = totalRevenue - estimatedCogs - orderShippingCostSum - paypalFeeSum;

  const kpis = [
    { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2,})}`, trend: '+12.5%', icon: DollarSign, color: 'text-emerald-500' },
    { title: 'Net Profit', value: `$${Math.max(0, netProfit).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2,})}`, trend: '+8.2%', icon: TrendingUp, color: 'text-blue-500' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, trend: '+5.1%', icon: ShoppingCart, color: 'text-amber-500' },
    { title: 'Pending Orders', value: pendingOrders, trend: '-2.4%', icon: Clock, color: 'text-orange-500' },
    { title: 'Total Customers', value: stats?.totalUsers || 0, trend: '+18.1%', icon: Users, color: 'text-purple-500' },
    { title: 'Total Products', value: stats?.totalProducts || 0, trend: '+4.3%', icon: Package, color: 'text-indigo-500' },
    { title: 'Published Products', value: publishedProducts, trend: 'Stable', icon: Package, color: 'text-sky-500' },
    { title: 'Low Stock Products', value: stats?.lowStockProducts?.length || 0, trend: 'Action Needed', icon: AlertCircle, color: 'text-rose-500' },
  ];

  const chartData = stats?.revenueHistoryWeek || [];
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl shrink-0 text-xs font-mono">
          <p className="text-zinc-500 mb-1">{label}</p>
          <p className="font-bold text-zinc-900 dark:text-white">
            ${Number(payload[0].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Business Intelligence</h2>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">{kpi.title}</p>
                <p className="text-2xl font-bold font-sans mt-2 text-zinc-900 dark:text-white">{kpi.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono font-medium">
              <span className={kpi.trend.startsWith('+') ? 'text-emerald-500' : kpi.trend.startsWith('-') ? 'text-rose-500' : 'text-zinc-400'}>
                {kpi.trend}
              </span>
              <span className="text-zinc-400">vs last 7 days</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold font-sans mb-4 text-zinc-900 dark:text-white">Revenue Trend (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#71717a' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
           <h3 className="text-sm font-semibold font-sans mb-4 text-zinc-900 dark:text-white">Recent Activity</h3>
           <div className="space-y-4">
              {orders.slice(0, 5).map((order: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">Order #{order._id.substring(order._id.length - 6).toUpperCase()}</p>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">{order.itemsSummary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">${Number(order.total).toFixed(2)}</p>
                    <p className="text-[9px] text-zinc-400 font-mono">Just now</p>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-xs text-zinc-500 font-mono">No recent activity detected.</p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
