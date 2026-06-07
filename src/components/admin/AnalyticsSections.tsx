import React from 'react';
import { useAdminData } from './AdminDataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Package, TrendingUp, Users, Truck, DollarSign } from 'lucide-react';

export const CategoryPerformance = () => {
  const { data } = useAdminData();
  if (!data) return null;
  const { products, orders } = data;

  // Calculate stats per category
  const catMap: Record<string, { products: number, revenue: number, profit: number, orders: number, bestSeller: {name: string, sold: number} | null }> = {};
  
  products.forEach((p: any) => {
    const cat = p.category || 'Uncategorized';
    if (!catMap[cat]) catMap[cat] = { products: 0, revenue: 0, profit: 0, orders: 0, bestSeller: null };
    catMap[cat].products += 1;
  });

  const productCategoryMap: Record<string, string> = {};
  products.forEach((p: any) => {
    productCategoryMap[p._id || p.id] = p.category || 'Uncategorized';
  });

  orders.forEach((o: any) => {
    const orderCatCounts: Record<string, number> = {};
    const orderCatRev: Record<string, number> = {};
    
    o.items.forEach((item: any) => {
       const cat = productCategoryMap[item.product] || 'Uncategorized';
       if (!catMap[cat]) catMap[cat] = { products: 0, revenue: 0, profit: 0, orders: 0, bestSeller: null };
       if (!orderCatCounts[cat]) orderCatCounts[cat] = 0;
       if (!orderCatRev[cat]) orderCatRev[cat] = 0;
       
       orderCatCounts[cat] += item.quantity;
       const rev = item.price * item.quantity;
       orderCatRev[cat] += rev;
       catMap[cat].revenue += rev;
       catMap[cat].profit += rev * 0.4; // 40% margin estimation for profit inside category view
    });

    Object.keys(orderCatCounts).forEach(c => {
       catMap[c].orders += 1;
    });
  });

  const categoryList = Object.entries(catMap).map(([name, stats]) => ({
     name,
     ...stats,
     avgPrice: stats.products > 0 ? (stats.revenue / Math.max(1, stats.orders)) : 0
  })).sort((a,b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Category Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categoryList.length > 0 ? categoryList.map((cat, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl">
             <h3 className="font-bold text-zinc-900 dark:text-white line-clamp-1">{cat.name}</h3>
             <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Revenue</span>
                   <span className="font-bold text-emerald-600 dark:text-emerald-400">${cat.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Estimated Profit</span>
                   <span className="font-bold text-blue-600 dark:text-blue-400">${cat.profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Orders</span>
                   <span className="font-medium text-zinc-900 dark:text-white">{cat.orders}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Products</span>
                   <span className="font-medium text-zinc-900 dark:text-white">{cat.products} Active</span>
                </div>
             </div>
             
             <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500" 
                     style={{width: `${Math.min(100, Math.max(5, (cat.revenue / (categoryList[0]?.revenue || 1)) * 100))}%`}}
                   />
                </div>
             </div>
          </div>
        )) : (
          <div className="col-span-full p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <p className="text-zinc-500 font-mono text-xs">No Data Available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProfitCenter = () => {
  const { data } = useAdminData();
  if (!data) return null;
  const { orders } = data;

  let totalSellingPrice = 0;
  let totalShippingCost = 0;
  let totalPayPalFees = 0;

  orders.forEach((o: any) => {
     totalSellingPrice += o.total;
     totalShippingCost += (o.shippingCost || 0);
     totalPayPalFees += (o.total * 0.029 + 0.30);
  });

  // Since actual CJ Cost isn't stored historically, we derive it from our standard 3x markup assumption
  // Selling Price = CJ Cost * 3 => CJ Cost = Selling Price / 3
  const totalCjCost = totalSellingPrice / 3;
  const netProfit = totalSellingPrice - totalCjCost - totalShippingCost - totalPayPalFees;

  const profitData = [
    { name: 'Cost of Goods', value: totalCjCost, color: '#f43f5e' },
    { name: 'Shipping Costs', value: totalShippingCost, color: '#f59e0b' },
    { name: 'PayPal Fees', value: totalPayPalFees, color: '#0ea5e9' },
    { name: 'Net Profit', value: Math.max(0, netProfit), color: '#10b981' }
  ];

  return (
     <div className="space-y-6">
       <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Profit Center</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-6">Financial breakdown</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">Total Selling Price (Gross Revenue)</span>
                  <span className="font-bold text-zinc-900 dark:text-white">${totalSellingPrice.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/30">
                  <span className="text-sm font-medium">- CJ Dropshipping Cost</span>
                  <span className="font-bold">-${totalCjCost.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 rounded-lg border border-orange-100 dark:border-orange-900/30">
                  <span className="text-sm font-medium">- Total Shipping Cost</span>
                  <span className="font-bold">-${totalShippingCost.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-sky-50 dark:bg-sky-900/10 text-sky-700 dark:text-sky-400 rounded-lg border border-sky-100 dark:border-sky-900/30">
                  <span className="text-sm font-medium">- Payment Gateways Fee (PayPal)</span>
                  <span className="font-bold">-${totalPayPalFees.toFixed(2)}</span>
               </div>
               
               <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-4" />
               
               <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                  <span className="text-lg font-bold font-serif">Net Profit</span>
                  <span className="text-xl font-bold">${netProfit.toFixed(2)}</span>
               </div>
            </div>
         </div>
         
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[300px]">
             {orders.length > 0 ? (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl text-xs font-mono">
                              <span style={{ color: payload[0].payload.color }}>{payload[0].payload.name}: </span>
                              <span className="font-bold text-zinc-900 dark:text-white">${Number(payload[0].value).toFixed(2)}</span>
                            </div>
                          )
                        }
                        return null;
                      }}/>
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {profitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             ) : (
                <p className="text-zinc-500 font-mono text-xs">No Data Available</p>
             )}
         </div>
       </div>
     </div>
  )
};

export const ShippingAnalytics = () => {
  const { data } = useAdminData();
  if (!data) return null;
  const { shippingCaches, orders } = data;

  const totalCaches = shippingCaches.length;
  const avgCost = totalCaches > 0 ? shippingCaches.reduce((sum, c) => sum + (c.shippingCost || 0), 0) / totalCaches : 0;
  
  const mostExpensive = totalCaches > 0 ? [...shippingCaches].sort((a,b) => b.shippingCost - a.shippingCost)[0] : null;
  const cheapest = totalCaches > 0 ? [...shippingCaches].sort((a,b) => a.shippingCost - b.shippingCost)[0] : null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Shipping Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <Truck className="h-5 w-5 text-indigo-500 mb-2" />
            <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Cached Records</p>
            <p className="text-2xl font-bold font-sans mt-1 text-zinc-900 dark:text-white">{totalCaches}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <DollarSign className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Avg Shipping Cost</p>
            <p className="text-2xl font-bold font-sans mt-1 text-zinc-900 dark:text-white">{totalCaches > 0 ? `$${avgCost.toFixed(2)}` : 'No Data'}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <TrendingUp className="h-5 w-5 text-rose-500 mb-2" />
            <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Most Expensive Route</p>
            <p className="text-lg font-bold font-sans mt-1 text-zinc-900 dark:text-white line-clamp-1">{mostExpensive ? `$${mostExpensive.shippingCost.toFixed(2)} (${mostExpensive.countryCode})` : 'No Data'}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
            <Package className="h-5 w-5 text-teal-500 mb-2" />
            <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Cheapest Route</p>
            <p className="text-lg font-bold font-sans mt-1 text-zinc-900 dark:text-white line-clamp-1">{cheapest ? `$${cheapest.shippingCost.toFixed(2)} (${cheapest.countryCode})` : 'No Data'}</p>
         </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm">
         <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">Live Caches Registry</h3>
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                   <th className="pb-3 font-medium">Variant ID</th>
                   <th className="pb-3 font-medium">Country Code</th>
                   <th className="pb-3 font-medium">Cost Evaluated</th>
                   <th className="pb-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                 {shippingCaches.length > 0 ? shippingCaches.slice(0, 15).map((cache, i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                       <td className="py-3">{cache.vid || 'N/A'}</td>
                       <td className="py-3">{cache.countryCode || 'US'}</td>
                       <td className="py-3 font-bold">${(cache.shippingCost || 0).toFixed(2)}</td>
                       <td className="py-3 text-zinc-400">{new Date(cache.updatedAt).toLocaleString()}</td>
                    </tr>
                 )) : (
                    <tr>
                       <td colSpan={4} className="py-8 text-center text-zinc-500">No Data Available</td>
                    </tr>
                 )}
              </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};
