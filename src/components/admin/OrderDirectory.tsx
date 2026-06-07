import React, { useState, useMemo } from 'react';
import { useAdminData } from './AdminDataContext';
import { Search, Filter, ShoppingBag, MapPin, CreditCard, ChevronLeft, ChevronRight, X, User, Package } from 'lucide-react';

export const OrderDirectory = () => {
  const { data, refreshData } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const ordersPerPage = 10;

  const filteredOrders = useMemo(() => {
    let result = data?.orders || [];

    if (statusFilter !== 'All') {
      result = result.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(order => 
        order._id?.toLowerCase().includes(lowerTerm) ||
        order.shippingAddress?.fullName?.toLowerCase().includes(lowerTerm) ||
        order.shippingAddress?.email?.toLowerCase().includes(lowerTerm) ||
        order.user?.email?.toLowerCase().includes(lowerTerm) ||
        order.user?.name?.toLowerCase().includes(lowerTerm) ||
        order.cjOrderId?.toLowerCase().includes(lowerTerm) ||
        order.itemsSummary?.toLowerCase().includes(lowerTerm)
      );
    }

    return result;
  }, [data?.orders, statusFilter, searchTerm]);

  if (!data) return null;

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('morvex_token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        refreshData();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status });
        }
      }
    } catch (err) {
      console.error('Error updating order status', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Order Directory</h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white appearance-none cursor-pointer dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-zinc-500 uppercase">Order ID</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-zinc-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-zinc-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-zinc-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-zinc-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-mono tracking-wider text-zinc-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-medium text-zinc-900 dark:text-white">
                        #{order._id.substring(order._id.length - 8).toUpperCase()}
                      </div>
                      {order.fulfillmentStatus === 'sandbox-skipped' && (
                        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Sandbox
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-900 dark:text-white font-medium">
                        {order.shippingAddress?.fullName || order.user?.name || 'Guest'}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">
                        {order.shippingAddress?.email || order.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white font-medium font-mono">
                      ${(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        order.status === 'Processing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-zinc-500 font-mono text-sm">No orders found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
            <span className="text-xs font-mono text-zinc-500">
              Showing {(currentPage - 1) * ordersPerPage + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-zinc-900 dark:text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">
                    Order #{selectedOrder._id.substring(selectedOrder._id.length - 8).toUpperCase()}
                  </h3>
                  <p className="text-sm font-mono text-zinc-500">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
                      <User className="h-4 w-4" /> Customer Info
                    </h4>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm border border-zinc-100 dark:border-zinc-900">
                      <p className="font-medium text-zinc-900 dark:text-white mb-1">
                        {selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name || 'Guest User'}
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-400 font-mono mb-1">{selectedOrder.shippingAddress?.email || selectedOrder.user?.email}</p>
                      <p className="text-zinc-600 dark:text-zinc-400 font-mono">{selectedOrder.shippingAddress?.phone || 'No phone provided'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
                      <MapPin className="h-4 w-4" /> Shipping Address
                    </h4>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm border border-zinc-100 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      <p>{selectedOrder.shippingAddress?.street}</p>
                      {selectedOrder.shippingAddress?.apartmentUnit && <p>{selectedOrder.shippingAddress.apartmentUnit}</p>}
                      <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-300 mt-1">{selectedOrder.shippingAddress?.country}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
                      <CreditCard className="h-4 w-4" /> Payment & Status
                    </h4>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm border border-zinc-100 dark:border-zinc-900 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Payment Method</span>
                        <span className="font-medium text-zinc-900 dark:text-white">{selectedOrder.paymentMethod || 'PayPal'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Fulfillment Status</span>
                        {selectedOrder.fulfillmentStatus === 'sandbox-skipped' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Sandbox / Skipped</span>
                        ) : (
                          <span className="font-medium text-zinc-900 dark:text-white">{selectedOrder.fulfillmentStatus || 'Standard'}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500">Order Status</span>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                     <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
                      CJ Dropshipping
                    </h4>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-sm border border-zinc-100 dark:border-zinc-900 space-y-3">
                       <div className="flex justify-between items-center">
                        <span className="text-zinc-500">CJ Order ID</span>
                        <span className="font-mono text-xs text-zinc-900 dark:text-white">{selectedOrder.cjOrderId || 'Not synced'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Tracking Number</span>
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">{selectedOrder.trackingNumber || 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">Order Items</h4>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4">
                        <div className="h-16 w-16 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-900 flex shrink-0 items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-zinc-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.name}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-1">Product ID: {item.product}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm text-zinc-900 dark:text-white font-medium">${(item.price || 0).toFixed(2)}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-1">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-zinc-100/50 dark:bg-zinc-900/80 p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${(selectedOrder.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Discount</span>
                        <span>-${(selectedOrder.discountAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-white pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                      <span>Total</span>
                      <span>${(selectedOrder.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
