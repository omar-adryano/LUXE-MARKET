import React from 'react';
import { useAdminData } from './AdminDataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export const SalesAnalytics = () => {
  const { data } = useAdminData();
  if (!data) return null;
  const { stats, orders } = data;

  const chartData = stats?.revenueHistoryWeek || [];
  
  // Aggregate monthly
  const monthlyDataMap: Record<string, number> = {};
  orders.forEach((o: any) => {
     const date = new Date(o.createdAt);
     const month = date.toLocaleString('default', { month: 'short' });
     if (!monthlyDataMap[month]) monthlyDataMap[month] = 0;
     monthlyDataMap[month] += o.total;
  });

  const monthlyChartData = Object.entries(monthlyDataMap).map(([month, total]) => ({ month, total }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Sales Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">Revenue Trend (Last 7 Days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#71717a' }} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} content={({ active, payload, label }: any) => {
                     if (active && payload && payload.length) {
                       return (
                         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl text-xs font-mono">
                           <p className="text-zinc-500 mb-1">{label}</p>
                           <p className="font-bold text-emerald-500">${Number(payload[0].value).toFixed(2)}</p>
                         </div>
                       );
                     }
                     return null;
                  }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">Monthly Revenue</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#71717a' }} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} content={({ active, payload, label }: any) => {
                     if (active && payload && payload.length) {
                       return (
                         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl text-xs font-mono">
                           <p className="text-zinc-500 mb-1">{label}</p>
                           <p className="font-bold text-blue-500">${Number(payload[0].value).toFixed(2)}</p>
                         </div>
                       );
                     }
                     return null;
                  }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};
