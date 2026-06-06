/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User as UserIcon, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Settings, 
  LogOut, 
  Truck,
  Sparkles,
  Info,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Smartphone,
  MapPinOff,
  UserCheck,
  Heart,
  ShoppingBag
} from 'lucide-react';
import { Order } from '../../types';

export const UserDashboard: React.FC = () => {
  const { orders, user, logout, updateUserField, setActiveView, wishlist, toggleWishlist, addToCart, setSelectedProduct } = useApp();
  
  // Guard access if not logged in
  if (!user) {
    return (
      <div className="text-center py-20 font-sans">
        <p className="text-sm text-gray-400">Please sign in to view dashboard</p>
      </div>
    );
  }

  // Keep track of which historical record is selected for active live tracking details
  const [selectedOrderTracking, setSelectedOrderTracking] = useState<Order>(
    orders.find(o => o.status === 'Shipped' || o.status === 'Processing') || orders[0]
  );

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'profile'>(
    window.location.hash === '#profile' ? 'profile' : 'orders'
  );

  React.useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#profile') {
        setActiveSubTab('profile');
      } else {
        setActiveSubTab('orders');
      }
    };
    window.addEventListener('hashchange', handleHash);
    // Initial check
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Profile Form States
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profilePhone, setProfilePhone] = useState(localStorage.getItem('morvex_phone') || '+1 (555) 019-2834');
  const [profileAddress, setProfileAddress] = useState(localStorage.getItem('morvex_address') || ' at 123 Main St, Apt 4D');
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Verification state helper
  const isVerified = user.isVerified || false;

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserField({ name: profileName, email: profileEmail });
    localStorage.setItem('morvex_phone', profilePhone);
    localStorage.setItem('morvex_address', profileAddress);
    setProfileSavedFeedback(true);
    setTimeout(() => setProfileSavedFeedback(false), 3000);
  };

  // Quick elevate toggle helper for sandbox review ease
  const handleToggleDevRole = () => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    updateUserField({ role: nextRole });
  };

  // Tracking steps descriptions
  const trackingMilestones = [
    { title: 'Order Registered', desc: 'Secure packaging validated by fulfillment network' },
    { title: 'In Transit', desc: 'Package cleared shipping facility' },
    { title: 'Out For Delivery', desc: 'Entrusted to local priority concierge couriers' },
    { title: 'Delivered', desc: 'Successfully signed at delivery destination' }
  ];

  // Tracking step resolution
  const activeStep = selectedOrderTracking ? (
    selectedOrderTracking.status === 'Delivered' 
      ? 3 
      : selectedOrderTracking.status === 'Shipped' 
        ? 1 
        : selectedOrderTracking.status === 'Processing'
          ? 0
          : -1
  ) : -1;

  return (
    <div id="user-dashboard-page" className="space-y-8 font-sans">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Account Dashboard</span>
          <h2 className="mt-1 font-serif text-2xl font-normal text-gray-950 dark:text-white">My Account</h2>
        </div>

        {/* Verification Status Banner / Callout */}
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500 font-mono">
              <ShieldCheck className="h-4 w-4" />
              VERIFIED ACCOUNT
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 font-mono">
                <ShieldAlert className="h-4 w-4" />
                UNVERIFIED EMAIL
              </span>
              <button
                onClick={() => { setActiveView('auth'); }}
                className="rounded-xl bg-amber-550 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors uppercase cursor-pointer"
              >
                Verify Code Now
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Left Profile Sidebar Card - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-md dark:border-zinc-900/60 dark:bg-zinc-950/20">
            {/* Visual Profile Avatar with Role based badge */}
            <div className="relative mx-auto h-20 w-20 rounded-full border border-gray-100 bg-gray-55/70 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950 text-white font-serif text-2xl uppercase">
                {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'US'}
              </div>
              
              {user.role === 'admin' ? (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-md outline outline-2 outline-white dark:outline-zinc-950" title="System Administrator Crest">
                  <UserCheck className="h-3 w-3" />
                </span>
              ) : (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-md outline outline-2 outline-white dark:outline-zinc-950" title="Loyal Gold Tier Membership Privileges">
                  <Sparkles className="h-3 w-3" />
                </span>
              )}
            </div>

            {/* Account naming details */}
            <div className="mt-4 text-center">
              <h3 className="font-serif text-base text-gray-950 dark:text-white truncate">{user.name}</h3>
              <p className="font-mono text-[9px] text-amber-500 uppercase font-semibold tracking-wider mt-1">
                {user.role === 'admin' ? '🛡️ SYSTEM ADMINISTRATOR' : 'GOLD MEMBER'}
              </p>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500 font-mono truncate">{user.email}</p>
            </div>

            {/* Sidebar nav selections */}
            <div className="border-t border-gray-100 mt-6 pt-6 space-y-2 text-left dark:border-zinc-900/65">
              <button
                onClick={() => {
                  setActiveSubTab('orders');
                  window.location.hash = 'orders';
                }}
                className={`flex w-full items-center space-x-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeSubTab === 'orders' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-900'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Orders</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveSubTab('profile');
                  window.location.hash = 'profile';
                }}
                className={`flex w-full items-center space-x-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeSubTab === 'profile' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-900'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Profile Settings</span>
              </button>

              {/* Real logout button */}
              <button
                onClick={() => logout()}
                className="flex w-full items-center space-x-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-500 hover:bg-blue-50 dark:hover:bg-red-950/20 transition-colors mt-4 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
            
          </div>
        </div>

        {/* Right Dashboard Terminal - 9 columns */}
        <div className="lg:col-span-9 space-y-6">
          
          {activeSubTab === 'orders' ? (
            <>
              {/* Interactive Shipping Tracking Maps (Mockup 5 Top Panel) */}
              <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-md dark:border-zinc-900 dark:bg-zinc-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 dark:border-zinc-900">
                  <div className="flex items-center space-x-2 text-gray-950 dark:text-white">
                    <Truck className="h-4.5 w-4.5 text-zinc-650 dark:text-zinc-400" />
                    <h3 className="font-serif text-sm font-semibold">Live Order Tracking</h3>
                  </div>
                  {selectedOrderTracking && (
                    <div className="flex flex-col sm:items-end mt-1 sm:mt-0">
                      <span className="font-mono text-[10px] text-gray-400">Currently tracking: <span className="font-bold text-gray-700 dark:text-zinc-300">{selectedOrderTracking.id}</span></span>
                      {selectedOrderTracking.trackingNumber && (
                        <span className="font-mono text-[10px] text-zinc-500 mt-0.5">Tracking code: <span className="text-blue-500 dark:text-blue-400">{selectedOrderTracking.trackingNumber}</span></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tracking Milestones progress visualization */}
                {activeStep !== -1 && selectedOrderTracking ? (
                  <div className="mt-8 space-y-6">
                    <div className="relative">
                      {/* Connection bar */}
                      <div className="absolute left-[15px] top-[15px] bottom-[15px] w-0.5 bg-gray-100 dark:bg-zinc-850 md:left-0 md:top-4 md:h-0.5 md:w-full md:bottom-auto" />
                      
                      {/* Interactive Connection highlighted line */}
                      <div 
                        className="absolute left-[15px] top-[15px] w-0.5 bg-zinc-900 dark:bg-white md:left-0 md:top-4 md:h-0.5 md:bottom-auto transition-all duration-500"
                        style={{ 
                          height: typeof window !== 'undefined' && window.innerWidth < 768 ? `${(activeStep / 3) * 100}%` : 'auto',
                          width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${(activeStep / 3) * 100}%` : 'auto'
                        }} 
                      />

                      <div className="flex flex-col gap-6 md:flex-row md:justify-between relative z-10">
                        {trackingMilestones.map((milestone, idx) => {
                          const isCompleted = idx <= activeStep;
                          const isCurrent = idx === activeStep;
                          return (
                            <div key={idx} className="flex items-start md:flex-col md:items-center md:text-center flex-1 max-w-[200px]">
                              {/* Connector dot */}
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                isCompleted 
                                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950 font-bold' 
                                  : 'border-gray-200 bg-white text-gray-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-700'
                              }`}>
                                {isCompleted && !isCurrent ? (
                                  <CheckCircle className="h-4.5 w-4.5 text-white dark:text-zinc-950 fill-current" />
                                ) : (
                                  <span className="font-mono text-xs">{idx + 1}</span>
                                )}
                              </div>

                              <div className="ml-4 md:ml-0 md:mt-3">
                                <h4 className={`text-xs font-semibold ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-650'}`}>{milestone.title}</h4>
                                <p className="mt-0.5 text-[9px] text-gray-400 dark:text-zinc-550 leading-relaxed md:max-w-[130px] md:mx-auto">{milestone.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex items-center space-x-2 rounded-xl bg-gray-50/50 p-4 dark:bg-zinc-900/10 text-gray-550">
                    <Info className="h-4 w-4 text-zinc-400" />
                    <p className="text-xs leading-relaxed font-mono">Select an active order row from history below to monitor logistics streams.</p>
                  </div>
                )}
              </div>

              {/* General order history (Mockup 5 Bottom historical logs table) */}
              <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-md dark:border-zinc-900 dark:bg-zinc-950/20">
                <div className="border-b border-gray-100 pb-3 mb-4 dark:border-zinc-900 flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-gray-950 dark:text-white">
                    <Clock className="h-4.5 w-4.5 text-zinc-650 dark:text-zinc-400" />
                    <h3 className="font-serif text-sm font-semibold">Order History</h3>
                  </div>
                  <span className="font-mono text-[9px] text-gray-400">Total registers ({orders.length})</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-500 dark:text-zinc-400 font-sans">
                    <thead>
                      <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:border-zinc-900">
                        <th className="pb-3 pr-2">Order Identification Code</th>
                        <th className="pb-3 pr-2">Submission Date</th>
                        <th className="pb-3 pr-2">Curated Contents summary</th>
                        <th className="pb-3 pr-2">Amount Summary</th>
                        <th className="pb-3 text-right">Order Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-900">
                      {orders.length > 0 ? (
                        orders.map((ord) => {
                          const isSelected = selectedOrderTracking ? (selectedOrderTracking.id === ord.id) : false;
                          return (
                            <tr 
                              key={ord.id}
                              onClick={() => setSelectedOrderTracking(ord)}
                              className={`group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-900/20 transition-colors ${
                                isSelected ? 'bg-zinc-50/55 dark:bg-zinc-900/30 font-semibold' : ''
                              }`}
                            >
                              <td className="py-4 font-mono font-bold text-gray-950 dark:text-white pr-2">
                                <span className="flex items-center space-x-1">
                                  <span>{ord.id}</span>
                                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />}
                                </span>
                              </td>
                              <td className="py-4 text-[11px] text-gray-400 pr-2">{ord.date}</td>
                              <td className="py-4 text-[11px] text-gray-800 dark:text-zinc-300 max-w-[200px] truncate pr-2">{ord.itemsSummary}</td>
                              <td className="py-4 font-mono text-gray-900 dark:text-white pr-2">${ord.total.toFixed(2)}</td>
                              <td className="py-4 text-right">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] uppercase font-mono tracking-wider font-bold ${
                                  ord.status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/40 dark:text-emerald-400'
                                    : ord.status === 'Shipped'
                                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-955/40 dark:text-blue-400'
                                      : ord.status === 'Processing'
                                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/40 dark:text-amber-400'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400 font-mono text-xs">No transactions registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Profile configs updates panel (Mockup 5 alternative selector) */
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-md dark:border-zinc-900 dark:bg-zinc-950/20">
                <div className="border-b border-gray-100 pb-3 mb-6 dark:border-zinc-900 flex justify-between items-center">
                  <h3 className="font-serif text-sm font-semibold text-gray-950 dark:text-white">Profile Configuration Settings</h3>
                  <span className="font-mono text-[9px] text-[#2563eb] font-bold">ACCOUNT SETTINGS</span>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4 max-w-xl">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400">FullName Signature</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-white"
                      />
                      <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400">Personal Contact Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-white"
                      />
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400">Contact Telephone</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-white"
                      />
                      <Smartphone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400">Preferred Delivery Destination Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-white"
                      />
                      <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-850 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 cursor-pointer"
                  >
                    Save Profile Settings
                  </button>

                  {profileSavedFeedback && (
                    <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-450 mt-2">✓ Verified changes registered successfully inside internal registries.</p>
                  )}
                </form>
              </div>

              {/* Developer Testing Console Card - Roles verification & elevation */}
              {(import.meta as any).env?.DEV && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50/20 p-6 shadow-md dark:border-amber-955/30 dark:bg-amber-955/5">
                  <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
                    <UserCheck className="h-5 w-5 font-bold" />
                    <h4 className="font-serif text-sm font-bold uppercase tracking-tight">DEVELOPER BAY: Sandbox Clearance Override</h4>
                  </div>
                  <p className="mt-2 text-xs text-amber-655 dark:text-amber-500/80 leading-relaxed font-sans">
                    The active account <strong>"{user.name}"</strong> has current role classification: <span className="font-bold underline uppercase">{user.role}</span>.<br />
                    Toggle the selector below to change your account credentials between standard <strong>User</strong> and administrative <strong>Admin</strong> in real-time to preview Admin Dashboard features immediately.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleToggleDevRole}
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 text-xs font-black uppercase tracking-wide cursor-pointer transition-colors"
                    >
                      Set as {user.role === 'admin' ? 'USER' : 'ADMIN'}
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => setActiveView('admin-dashboard')}
                        className="rounded-xl border border-amber-500 text-amber-550 hover:bg-amber-500/10 px-4 py-2 text-xs font-bold tracking-wide cursor-pointer"
                      >
                        Go to Admin-Console Grids →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
