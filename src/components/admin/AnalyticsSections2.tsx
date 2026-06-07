import React from 'react';
import { useAdminData } from './AdminDataContext';
import { Users, UserPlus, Fingerprint, Award, CreditCard, Heart, ShoppingBag, Eye, XOctagon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const CustomerAnalytics = () => {
  const { data } = useAdminData();
  if (!data) return null;
  const { users, orders } = data;

  const totalCustomers = users.length;
  
  const customerSpendMap: Record<string, {name: string, spend: number, ordersCount: number}> = {};
  
  orders.forEach((o: any) => {
     if (o.user) {
        let uId = typeof o.user === 'object' ? o.user._id : o.user;
        let uName = typeof o.user === 'object' ? o.user.name : 'Unknown User';
        if (!customerSpendMap[uId]) {
           customerSpendMap[uId] = { name: uName, spend: 0, ordersCount: 0 };
        }
        customerSpendMap[uId].spend += o.total;
        customerSpendMap[uId].ordersCount += 1;
     }
  });

  const buyingCustomers = Object.keys(customerSpendMap).length;
  const returningCustomers = Object.values(customerSpendMap).filter(c => c.ordersCount > 1).length;
  const avgCustomerSpend = buyingCustomers > 0 ? Object.values(customerSpendMap).reduce((acc, c) => acc + c.spend, 0) / buyingCustomers : 0;
  const topBuyers = Object.values(customerSpendMap).sort((a,b) => b.spend - a.spend).slice(0, 5);

  const pieData = [
    { name: 'Returning', value: returningCustomers, color: '#3b82f6' },
    { name: 'New (1 order)', value: buyingCustomers - returningCustomers, color: '#10b981' },
    { name: 'No Orders', value: Math.max(0, totalCustomers - buyingCustomers), color: '#6366f1' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Customer Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <Users className="h-5 w-5 text-indigo-500 mb-2" />
            <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Total Customers</p>
            <p className="text-2xl font-bold font-sans mt-1 text-zinc-900 dark:text-white">{totalCustomers}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <Fingerprint className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Returning Customers</p>
            <p className="text-2xl font-bold font-sans mt-1 text-zinc-900 dark:text-white">{returningCustomers}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <UserPlus className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">New Customers</p>
            <p className="text-2xl font-bold font-sans mt-1 text-zinc-900 dark:text-white">{buyingCustomers - returningCustomers}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <CreditCard className="h-5 w-5 text-fuchsia-500 mb-2" />
            <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Avg Spend / Buyer</p>
            <p className="text-2xl font-bold font-sans mt-1 text-zinc-900 dark:text-white">{buyingCustomers > 0 ? `$${avgCustomerSpend.toFixed(2)}` : 'No Data'}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">Top Buyers VIP Tier</h3>
            {topBuyers.length > 0 ? (
               <div className="space-y-3">
                  {topBuyers.map((buyer, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                             <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                             <p className="font-bold text-zinc-900 dark:text-white text-sm">{buyer.name}</p>
                             <p className="text-[10px] uppercase font-mono text-zinc-500">{buyer.ordersCount} Lifetime Orders</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">${buyer.spend.toFixed(2)}</p>
                       </div>
                    </div>
                  ))}
               </div>
            ) : (
               <p className="text-zinc-500 font-mono text-xs">No Data Available</p>
            )}
         </div>

         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm flex flex-col items-center">
            <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4 w-full text-left">Retention Rate</h3>
            {totalCustomers > 0 ? (
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <RechartsTooltip cursor={{fill: 'transparent'}} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl text-xs font-mono">
                              <span style={{ color: payload[0].payload.color }}>{payload[0].payload.name}: </span>
                              <span className="font-bold text-zinc-900 dark:text-white">{payload[0].value} customers</span>
                            </div>
                          )
                        }
                        return null;
                      }}/>
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            ) : (
               <p className="text-zinc-500 font-mono text-xs">No Data Available</p>
            )}
         </div>
      </div>
    </div>
  );
};

export const ProductAnalytics = () => {
  const { data } = useAdminData();
  if (!data) return null;
  const { products, orders } = data;

  const productStatsMap: Record<string, {name: string, image: string, sold: number}> = {};
  
  products.forEach((p: any) => {
     productStatsMap[p.id || p._id] = { name: p.name, image: p.image, sold: 0 };
  });

  orders.forEach((o: any) => {
     o.items.forEach((item: any) => {
        let pId = typeof item.product === 'object' ? (item.product._id || item.product.id) : item.product;
        if (pId && productStatsMap[pId]) {
           productStatsMap[pId].sold += item.quantity;
        }
     });
  });

  const bestSellers = Object.values(productStatsMap).sort((a,b) => b.sold - a.sold).slice(0,5).filter(p => p.sold > 0);
  const outOfStock = products.filter((p: any) => p.stock === 0).length;
  const lowStockProducts = products.filter((p: any) => p.stock < 25 && p.stock > 0).sort((a: any,b: any) => a.stock - b.stock).slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Product Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Best Sellers */}
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-6">
               <ShoppingBag className="h-4 w-4 text-emerald-500" />
               <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-widest">All-Time Best Sellers</h3>
            </div>
            {bestSellers.length > 0 ? (
               <div className="space-y-4">
                  {bestSellers.map((prod, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                       <span className="font-black text-zinc-300 dark:text-zinc-700 font-mono text-lg w-4 text-center">{idx + 1}</span>
                       <img src={prod.image} alt={prod.name} className="h-10 w-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0" referrerPolicy="no-referrer" />
                       <p className="font-semibold text-sm text-zinc-900 dark:text-white flex-1 truncate">{prod.name}</p>
                       <span className="text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 py-1 px-2 rounded-md">{prod.sold} sold</span>
                    </div>
                  ))}
               </div>
            ) : (
               <p className="text-zinc-500 font-mono text-xs text-center py-8">No Data Available</p>
            )}
         </div>

         {/* Stock Warnings */}
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                  <XOctagon className="h-4 w-4 text-rose-500" />
                  <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Inventory Warnings (Low Stock)</h3>
               </div>
               <span className="text-xs font-mono font-bold text-rose-500">{outOfStock} items out of stock</span>
            </div>
            {lowStockProducts.length > 0 ? (
               <div className="space-y-4">
                  {lowStockProducts.map((prod: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-lg">
                       <div className="flex items-center gap-3 overflow-hidden">
                          <img src={prod.image} alt={prod.name} className="h-8 w-8 rounded-md object-cover" referrerPolicy="no-referrer" />
                          <p className="font-medium text-xs text-rose-900 dark:text-rose-200 truncate">{prod.name}</p>
                       </div>
                       <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">{prod.stock} left</span>
                    </div>
                  ))}
               </div>
            ) : (
               <p className="text-zinc-500 font-mono text-xs text-center py-8">No Data Available</p>
            )}
         </div>
      </div>
    </div>
  );
};
