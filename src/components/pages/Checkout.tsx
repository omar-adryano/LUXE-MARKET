/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { 
  Lock, 
  CreditCard, 
  ShieldCheck, 
  Package, 
  Truck, 
  Check, 
  Compass,
  ArrowRight,
  Mail
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const { user, cart, setCart, couponApplied, clearCart, setActiveView } = useApp();

  // Shipments inputs prefilled with user details if available
  const [firstName, setFirstName] = useState(() => {
    if (user && user.name) {
      const parts = user.name.split(' ');
      return parts[0] || '';
    }
    return '';
  });
  const [lastName, setLastName] = useState(() => {
    if (user && user.name) {
      const parts = user.name.split(' ');
      return parts.slice(1).join(' ') || '';
    }
    return '';
  });
  const [email, setEmail] = useState(() => {
    return user ? user.email : '';
  });
  const [country, setCountry] = useState('United States');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartmentUnit, setApartmentUnit] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  // PayPal SDK loading & timeout state
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  const [paypalTimeout, setPaypalTimeout] = useState(false);
  const [paypalErrorState, setPaypalErrorState] = useState<string | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const pendingOrderIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    console.log("[Checkout] PayPal Script Status - Pending:", isPending, "Resolved:", isResolved, "Rejected:", isRejected);
    if (isRejected) {
      console.error("[Checkout] PayPal script failed to initialize.");
      setPaypalErrorState("Failed to load PayPal secure connection script. Please check your network connection.");
    }
  }, [isRejected, isPending, isResolved]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPending) {
      timer = setTimeout(() => {
        console.error("[Checkout] PayPal Script loading timed out after 10 seconds.");
        setPaypalTimeout(true);
        setPaypalErrorState("PayPal connection timed out. Showing manual credit card options or reload.");
      }, 10000); // 10 seconds timeout protection
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPending]);

  // Step state
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'success'>('info');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [newOrderCode, setNewOrderCode] = useState('');

  // Stale/Validation state
  const [staleRemovedMessage, setStaleRemovedMessage] = useState<string | null>(null);
  const [validationChecked, setValidationChecked] = useState(false);
  const validationStarted = React.useRef(false);

  React.useEffect(() => {
    if (validationStarted.current) return;
    validationStarted.current = true;
    
    let active = true;
    const validateAndSyncCart = async () => {
      if (cart.length === 0) {
        setValidationChecked(true);
        return;
      }
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          setValidationChecked(true);
          return;
        }
        let data;
        try {
          data = await response.json();
        } catch (jsonErr) {
          setValidationChecked(true);
          return;
        }
        if (data && data.success && data.products && active) {
          const dbProducts = data.products;
          
          let cartUpdated = false;
          const removedItemNames: string[] = [];
          
          const validatedCart = cart.filter(item => {
            // Find if item exists in db by id or by name (case insensitive)
            const exists = dbProducts.find((p: any) => 
              p._id === item.product.id || 
              p.id === item.product.id ||
              p.name.toLowerCase() === item.product.name.toLowerCase()
            );
            
            if (!exists) {
              removedItemNames.push(item.product.name);
              cartUpdated = true;
              return false; // Remove stale item
            }
            
            // If the item exists and its ID was a static slug (e.g. 'headphones'),
            // let's update the cart's product ID to use the real database _id!
            if (item.product.id !== exists._id) {
              item.product.id = exists._id;
              item.product.price = exists.price; // sync price
              cartUpdated = true;
            }
            
            return true;
          });
          
          if (cartUpdated) {
            setCart(validatedCart);
            if (removedItemNames.length > 0) {
              setStaleRemovedMessage(
                `The product(s) "${removedItemNames.join(', ')}" are no longer available in our boutique database and were automatically removed from your cart.`
              );
            }
          }
        }
      } catch (err) {
        console.error('Error validating cart products:', err);
      } finally {
        if (active) {
          setValidationChecked(true);
        }
      }
    };
    
    validateAndSyncCart();
    return () => {
      active = false;
    };
  }, []);

  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Subtotal calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = couponApplied ? subtotal * 0.25 : 0;
  
  useEffect(() => {
    let active = true;
    const fetchShipping = async () => {
       if (cart.length === 0) return;
       setShippingLoading(true);
       try {
          const items = cart.map(item => ({
             product: item.product.id || item.product._id,
             quantity: item.quantity
          }));
          const res = await fetch('/api/shipping/calculate', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ items, countryCode: country === 'United States' ? 'US' : country === 'United Kingdom' ? 'UK' : country === 'Canada' ? 'CA' : country === 'Australia' ? 'AU' : 'US' })
          });
          const data = await res.json();
          if (active && data.shippingCost !== undefined) {
             setShippingCost(data.shippingCost);
          }
       } catch (e) {
          console.error("Failed to calculate shipping:", e);
       } finally {
          if (active) setShippingLoading(false);
       }
    };
    fetchShipping();
    return () => { active = false; };
  }, [cart, country]);

  const taxAmount = (subtotal - discountAmount) * 0.08;
  const totalAmount = subtotal - discountAmount + shippingCost + taxAmount;

  const handleReturnToExplore = () => {
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToDashboard = () => {
    setActiveView('user-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="checkout-page" className="space-y-8">
      
      {/* Visual Title Header */}
      <div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-550">Secure checkout process</span>
        <h2 className="mt-1 font-serif text-2xl font-normal text-gray-950 dark:text-white">Secure Checkout</h2>
      </div>

      {staleRemovedMessage && (
        <div id="stale-alert-banner" className="flex items-start space-x-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300 font-sans text-xs">
          <ShieldCheck className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-450">Adjustment Alert</span>
            <p className="leading-relaxed">
              {staleRemovedMessage}
            </p>
          </div>
        </div>
      )}

      {!user && checkoutStep !== 'success' && (
        <div id="guest-checkout-banner" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-850 bg-white dark:bg-zinc-900/10 transition-all font-sans">
          <div className="space-y-1 text-left">
            <div className="flex items-center space-x-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <p className="text-xs font-serif font-semibold text-gray-950 dark:text-white">Guest Checkout Active</p>
            </div>
            <p className="text-[11px] text-gray-550 dark:text-zinc-400 max-w-xl leading-relaxed">
              Checkout is currently open. You do not need to authenticate to checkout. If you want to associate this purchase with your profile and track shipping, you can log in now.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('auth_redirect_target', 'checkout');
              setActiveView('auth');
            }}
            className="shrink-0 text-center text-xs font-semibold border border-gray-200 bg-gray-50 hover:bg-white text-zinc-900 hover:text-zinc-950 px-4 py-2 rounded-xl hover:shadow-sm transition-all focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-850 cursor-pointer"
          >
            Sign In (Optional)
          </button>
        </div>
      )}

      {checkoutStep === 'success' ? (
        <div className="max-w-2xl mx-auto rounded-3xl border border-gray-150 bg-white p-8 text-center dark:border-zinc-900 dark:bg-zinc-950/20 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-2xl text-gray-950 dark:text-white">Transaction Verified</h3>
            <p className="font-mono text-xs text-zinc-500">ORDER NO: <span className="font-bold text-gray-800 dark:text-zinc-200">{newOrderCode}</span></p>
            <p className="mt-4 text-xs text-gray-400 dark:text-zinc-500 leading-relaxed max-w-md mx-auto">
              Your order has been placed successfully. We have initiated dispatch with our delivery partner. You can track your order status in your Account Dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {user ? (
              <button
                onClick={handleGoToDashboard}
                className="flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 px-6 py-3 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 cursor-pointer"
              >
                <Package className="h-4.5 w-4.5" />
                <span>Track Orders Inside Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  localStorage.setItem('auth_redirect_target', 'user-dashboard');
                  setActiveView('auth');
                }}
                className="flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 px-6 py-3 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 cursor-pointer"
              >
                <Lock className="h-4.5 w-4.5" />
                <span>Create Account to Track Orders</span>
              </button>
            )}
            <button
              onClick={handleReturnToExplore}
              className="flex items-center justify-center space-x-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-xs font-semibold text-zinc-900 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white cursor-pointer"
            >
              <Compass className="h-4.5 w-4.5" />
              <span>Return to Galleries</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Billing Form Section - Left 7 columns */}
          <div className="lg:col-span-7">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              
              {/* Contact Information */}
              <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950/20 space-y-4 shadow-sm">
                <h3 className="font-serif text-sm font-semibold flex items-center space-x-2 border-b border-gray-100 pb-3 dark:border-zinc-900 text-gray-950 dark:text-white">
                  <Mail className="h-4 w-4" />
                  <span>Contact Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 focus-within:relative z-10">
                    <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email Address <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="john.smith@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                    />
                  </div>

                  <div className="space-y-1.5 focus-within:relative z-10">
                    <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Phone Number <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="+49 123 456 789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping address details */}
              <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950/20 space-y-4 shadow-sm">
                <h3 className="font-serif text-sm font-semibold flex items-center space-x-2 border-b border-gray-100 pb-3 dark:border-zinc-900 text-gray-950 dark:text-white">
                  <Truck className="h-4 w-4" />
                  <span>Shipping Address</span>
                </h3>

                <div className="space-y-1.5 focus-within:relative z-10">
                  <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Country <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400 cursor-pointer"
                    >
                      <option value="" disabled>Select a country</option>
                      <optgroup label="North America">
                        <option value="United States">🇺🇸 United States</option>
                        <option value="Canada">🇨🇦 Canada</option>
                      </optgroup>
                      <optgroup label="Europe">
                        <option value="United Kingdom">🇬🇧 United Kingdom</option>
                        <option value="Germany">🇩🇪 Germany</option>
                        <option value="France">🇫🇷 France</option>
                        <option value="Italy">🇮🇹 Italy</option>
                        <option value="Spain">🇪🇸 Spain</option>
                        <option value="Netherlands">🇳🇱 Netherlands</option>
                        <option value="Belgium">🇧🇪 Belgium</option>
                        <option value="Austria">🇦🇹 Austria</option>
                        <option value="Switzerland">🇨🇭 Switzerland</option>
                        <option value="Ireland">🇮🇪 Ireland</option>
                        <option value="Denmark">🇩🇰 Denmark</option>
                        <option value="Norway">🇳🇴 Norway</option>
                        <option value="Sweden">🇸🇪 Sweden</option>
                        <option value="Finland">🇫🇮 Finland</option>
                        <option value="Poland">🇵🇱 Poland</option>
                        <option value="Portugal">🇵🇹 Portugal</option>
                        <option value="Czech Republic">🇨🇿 Czech Republic</option>
                      </optgroup>
                      <optgroup label="Middle East">
                        <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                        <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                        <option value="Qatar">🇶🇦 Qatar</option>
                        <option value="Kuwait">🇰🇼 Kuwait</option>
                        <option value="Bahrain">🇧🇭 Bahrain</option>
                        <option value="Egypt">🇪🇬 Egypt</option>
                      </optgroup>
                      <optgroup label="Asia Pacific">
                        <option value="Australia">🇦🇺 Australia</option>
                        <option value="New Zealand">🇳🇿 New Zealand</option>
                        <option value="Japan">🇯🇵 Japan</option>
                        <option value="Singapore">🇸🇬 Singapore</option>
                        <option value="Malaysia">🇲🇾 Malaysia</option>
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 focus-within:relative z-10">
                    <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">First Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                    />
                  </div>
                  <div className="space-y-1.5 focus-within:relative z-10">
                    <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 focus-within:relative z-10">
                  <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Street Address <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="123 Main Street"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                  />
                </div>

                <div className="space-y-1.5 focus-within:relative z-10">
                  <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Apartment / Unit <span className="lowercase normal-case font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="Apt 4B"
                    value={apartmentUnit}
                    onChange={(e) => setApartmentUnit(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 focus-within:relative z-10">
                    <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">City <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Berlin"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                    />
                  </div>
                  <div className="space-y-1.5 focus-within:relative z-10">
                    <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">State / Region <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Berlin"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 focus-within:relative z-10">
                    <label className="text-[10px] font-sans font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Postal Code <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="10115"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      pattern={
                        country === 'United States' ? "^\\d{5}(-\\d{4})?$" :
                        country === 'United Kingdom' ? "^[A-Za-z]{1,2}\\d[A-Za-z\\d]? ?\\d[A-Za-z]{2}$" :
                        country === 'Canada' ? "^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$" :
                        country === 'Australia' || country === 'New Zealand' ? "^\\d{4}$" :
                        country === 'Germany' || country === 'Italy' || country === 'Spain' || country === 'France' ? "^\\d{5}$" :
                        country === 'Japan' ? "^\\d{3}-\\d{4}$" : undefined
                      }
                      title="Please enter a valid postal code for your country"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Secure payment details */}
              <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950/20 space-y-4">
                <h3 className="font-serif text-sm font-semibold flex items-center space-x-2 border-b border-gray-100 pb-3 dark:border-zinc-900 text-gray-950 dark:text-white">
                  <CreditCard className="h-4 w-4" />
                  <span>Secure Global Payments</span>
                </h3>

                <div className="space-y-4 pt-1">
                  <div className="p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/40 dark:bg-zinc-900/10 text-center space-y-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-amber-500/10 text-amber-600">
                        OFFICIAL PAYPAL PAYMENTS
                      </div>
                      <p className="text-xs font-serif text-gray-950 dark:text-white mt-1">PayPal Wallet Checkout</p>
                      <p className="text-[10px] text-gray-450 dark:text-zinc-500 max-w-sm mx-auto leading-relaxed mt-1">
                        Process high-speed merchant payments with your verified PayPal Balance, Bank Accounts, or connected Credit Cards securely.
                      </p>
                    </div>

                    <div className="w-full max-w-sm mx-auto pt-2 text-left">
                      {isPending && !paypalTimeout && !paypalErrorState && (
                        <div className="py-2.5 flex flex-col items-center justify-center space-y-2">
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-zinc-300 border-t-zinc-950 animate-spin"></span>
                          <span className="text-[10px] font-mono text-gray-400 font-medium">Initializing secure PayPal interface...</span>
                        </div>
                      )}

                      {paypalErrorState ? (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-2 dark:bg-rose-955/15 dark:border-rose-900/40">
                          <p className="text-xs font-serif text-rose-900 dark:text-rose-450 font-semibold">PayPal Connection Offline</p>
                          <p className="text-[10px] font-mono text-rose-700 leading-relaxed dark:text-rose-400">
                            {paypalErrorState}
                          </p>
                        </div>
                      ) : (
                        (!isPending || isResolved) && (
                          <PayPalButtons
                            style={{ layout: "vertical", shape: "rect", label: "paypal", height: 40 }}
                            disabled={processingPayment || cart.length === 0 || shippingLoading}
                            onClick={(data, actions) => {
                              if (!firstName || !lastName || !email || !country || !streetAddress || !city || !stateRegion || !zipCode || !phone) {
                                setPaypalError("Please complete your delivery details before proceeding with PayPal.");
                                return actions.reject();
                              } else {
                                setPaypalError(null);
                                return actions.resolve();
                              }
                            }}
                            createOrder={async (data, actions) => {
                              const shippingAddress = {
                                fullName: `${firstName} ${lastName}`,
                                firstName: firstName,
                                lastName: lastName,
                                street: `${streetAddress} ${apartmentUnit}`.trim(),
                                apartmentUnit: apartmentUnit,
                                city: city,
                                state: stateRegion,
                                zipCode: zipCode,
                                country: country,
                                phone: phone,
                                email: email,
                              };
                              const items = cart.map(item => ({
                                product: item.product.id || item.product._id,
                                name: item.product.name,
                                quantity: item.quantity,
                                price: item.product.price,
                                selectedColor: item.selectedColor || 'Default',
                                selectedMaterial: item.selectedMaterial || 'Default',
                                image: item.product.image
                              }));
                              const token = localStorage.getItem('morvex_token');
                              const res = await fetch('/api/paypal/create-order', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(token && { 'Authorization': `Bearer ${token}` })
                                },
                                body: JSON.stringify({
                                  items,
                                  shippingAddress,
                                  subtotal,
                                  discountAmount,
                                  shippingCost,
                                  taxRate: 0.08,
                                  total: totalAmount,
                                })
                              });
                              const resData = await res.json();
                              if(res.ok && resData.id) {
                                pendingOrderIdRef.current = resData.orderId;
                                return resData.id;
                              } else {
                                throw new Error(resData.message || 'Order creation failed');
                              }
                            }}
                            onApprove={async (data, actions) => {
                              const token = localStorage.getItem('morvex_token');
                              const res = await fetch('/api/paypal/capture-order', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(token && { 'Authorization': `Bearer ${token}` })
                                },
                                body: JSON.stringify({
                                  paypalOrderId: data.orderID,
                                  systemOrderId: pendingOrderIdRef.current
                                })
                              });
                              const details = await res.json();
                              if(details.success) {
                                setNewOrderCode(details.order._id);
                                clearCart();
                                setCheckoutStep('success');
                              } else {
                                setPaypalError(details.message || 'Capture failed');
                              }
                            }}
                            onError={(err) => {
                              setPaypalError('PayPal gateway experienced an execution error: ' + String(err));
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
                  {paypalError && (
                    <div className="p-3 text-[10px] font-mono text-[#2563eb] bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-xl leading-relaxed">
                      {paypalError}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 rounded-xl bg-gray-50 p-3.5 dark:bg-zinc-900/40">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
                  <p className="text-[10px] text-gray-450 dark:text-zinc-500 leading-normal font-mono">
                    Secure transaction routing follows verified AES encryptions. We strictly bypass caching of bank credentials directly on our local servers.
                  </p>
                </div>
              </div>

            </form>
          </div>

          {/* Checkout Totals details - Right 5 columns */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950/20">
              <h3 className="font-serif text-sm font-semibold border-b border-gray-100 pb-3 dark:border-zinc-900 text-gray-950 dark:text-white">Order Summary</h3>
              
              {/* Product items loop inside summary */}
              <div className="divide-y divide-gray-100 dark:divide-zinc-900 max-h-72 overflow-y-auto pr-2 mt-4 space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex space-x-3 pt-3">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="h-10 w-10 shrink-0 rounded-lg object-cover bg-gray-50" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-950 truncate dark:text-white">{item.product.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Qty {item.quantity} • {item.selectedColor !== 'Default' ? item.selectedColor : 'Standard'}</p>
                    </div>
                    <span className="font-serif text-xs font-semibold text-gray-950 dark:text-white">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial computations summary */}
              <div className="border-t border-gray-100 mt-6 pt-6 space-y-3 text-xs text-gray-500 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-gray-950 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-mono">
                    <span>Priority coupon applied</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Priority Courier Delivery</span>
                  <span className="font-mono text-gray-950 dark:text-white">
                    {shippingLoading ? 'Calculating...' : shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>State duty VAT (8%)</span>
                  <span className="font-mono text-gray-950 dark:text-white">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-100 pt-3.5 dark:border-zinc-900 flex justify-between font-serif text-sm font-bold text-gray-950 dark:text-white">
                  <span>Total</span>
                  <span className="font-sans text-base">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Guarantees box */}
              <div className="border-t border-gray-150 pt-4 mt-6 dark:border-zinc-900/50 space-y-2.5 text-[10px] text-gray-400">
                <div className="flex items-center space-x-1.5">
                  <Lock className="h-3 w-3 text-emerald-500" />
                  <span>Verified 256-bit AES cryptographic transfer</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span>Complementary insurance coverage included</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
