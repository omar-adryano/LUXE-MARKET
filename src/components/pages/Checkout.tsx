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
  ArrowRight
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
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  // Stripe & Payment Selection state
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [stripeError, setStripeError] = useState<string | null>(null);

  // PayPal SDK loading & timeout state
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  const [paypalTimeout, setPaypalTimeout] = useState(false);
  const [paypalErrorState, setPaypalErrorState] = useState<string | null>(null);

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

  // Subtotal calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = couponApplied ? subtotal * 0.25 : 0;
  const shippingCost = subtotal > 150 ? 0 : 15.00;
  const taxAmount = (subtotal - discountAmount) * 0.08;
  const totalAmount = subtotal - discountAmount + shippingCost + taxAmount;

  const handleSaveBackendOrder = async (payMethod: string, transactionId?: string) => {
    if (processingPayment) return;
    setProcessingPayment(true);
    setStripeError(null);

    const shippingAddress = {
      fullName: `${firstName} ${lastName}`,
      street: streetAddress,
      city: city,
      state: city.includes(',') ? city.split(',')[1]?.trim() || city : 'Atelier Room',
      zipCode: zipCode,
      country: 'Japan',
    };

    const formattedItems = cart.map(item => ({
      product: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      selectedColor: item.selectedColor || 'Default',
      selectedMaterial: item.selectedMaterial || 'Default',
      image: item.product.image
    }));

    try {
      const token = localStorage.getItem('luxe_token');
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: formattedItems,
          shippingAddress,
          paymentMethod: payMethod,
          subtotal,
          discountAmount,
          shippingCost,
          taxRate: 0.08,
          total: totalAmount,
          transactionId: transactionId || '',
        })
      });

      if (!response.ok) {
        let errorMessage = 'Verification check failed during order placement.';
        if (response.status === 429) {
          errorMessage = 'Order registration rate limit exceeded. Please wait a moment before re-submitting.';
        } else {
          try {
            const resData = await response.json();
            errorMessage = resData.message || errorMessage;
          } catch (jsonErr) {
            try {
              const text = await response.text();
              if (text && (text.includes('Rate exceeded') || text.includes('Too Many Requests') || text.includes('rate limit'))) {
                errorMessage = 'Order registration rate limit exceeded. Please wait a moment before re-submitting.';
              } else if (text) {
                errorMessage = text.substring(0, 150);
              }
            } catch (textErr) {
              errorMessage = 'Ledger query failure. The order server is currently unresponsive.';
            }
          }
        }
        setStripeError(errorMessage);
        setProcessingPayment(false);
        return;
      }

      const resData = await response.json();
      if (resData.success) {
        setNewOrderCode(resData.order.id || resData.order._id);
        clearCart();
        setCheckoutStep('success');
      } else {
        setStripeError(resData.message || 'Verification check failed during order placement.');
      }
    } catch (err) {
      setStripeError('Network connectivity check failed. Could not communicate with operations ledger.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod !== 'stripe') return;
    if (processingPayment) return;

    setProcessingPayment(true);
    setStripeError(null);

    const shippingAddress = {
      fullName: `${firstName} ${lastName}`,
      street: streetAddress,
      city: city,
      state: city.includes(',') ? city.split(',')[1]?.trim() || city : 'Atelier Room',
      zipCode: zipCode,
      country: 'Japan',
    };

    try {
      const items = cart.map(item => ({
        product: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        selectedColor: item.selectedColor || 'Default',
        selectedMaterial: item.selectedMaterial || 'Default',
        image: item.product.image
      }));

      const token = localStorage.getItem('luxe_token');
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items,
          shippingAddress,
          subtotal,
          discountAmount,
          shippingCost,
          taxRate: 0.08,
          total: totalAmount,
          originUrl: window.location.origin
        })
      });

      if (!res.ok) {
        let errorMessage = 'Error occurred initializing checkout session with Stripe.';
        if (res.status === 429) {
          errorMessage = 'Transaction rate limit exceeded. Please wait a moment before re-submitting your carriage request.';
        } else {
          try {
            const data = await res.json();
            errorMessage = data.message || errorMessage;
          } catch (jsonErr) {
            try {
              const text = await res.text();
              if (text && (text.includes('Rate exceeded') || text.includes('Too Many Requests') || text.includes('rate limit'))) {
                errorMessage = 'Transaction rate limit exceeded. Please wait a moment before re-submitting your carriage request.';
              } else if (text) {
                errorMessage = text.substring(0, 150);
              }
            } catch (textErr) {
              errorMessage = 'Ledger query failure. The Stripe gateway is currently unresponsive.';
            }
          }
        }
        setStripeError(errorMessage);
        setProcessingPayment(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        // Redirect the browser straight to Stripe Checkout
        window.location.href = data.url;
      } else {
        setStripeError(data.message || 'Error occurred initializing checkout session with Stripe.');
        setProcessingPayment(false);
      }
    } catch (err) {
      setStripeError('Network connectivity check failed. Could not contact Stripe gateway.');
      setProcessingPayment(false);
    }
  };

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
        <h2 className="mt-1 font-serif text-2xl font-normal text-gray-950 dark:text-white">Secure Order Carriage</h2>
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
              Carriage registration is currently open. You do not need to authenticate to checkout. If you want to associate this purchase with your profile and track shipping, you can log in now.
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
              Your order has been registered securely. We have initiated dispatch logistics with our specialty premium carrier. Standard tracking is fully active and maps can be reviewed inside your User Account workspace directory of operations.
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
            <form onSubmit={handleSubmitCheckout} className="space-y-6">
              
              {/* Shipping address details */}
              <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950/20 space-y-4">
                <h3 className="font-serif text-sm font-semibold flex items-center space-x-2 border-b border-gray-100 pb-3 dark:border-zinc-900 text-gray-950 dark:text-white">
                  <Truck className="h-4 w-4" />
                  <span>Delivery Carriage Destination</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kenzo"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanaka"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-gray-400">Personal Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. kenzo@atelier.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-gray-400">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7-1 Minami-Aoyama"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400">Atelier Ward / City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Minato-ku, Tokyo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400">Postal Zip Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 107-0062"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-gray-400">Carriage Contact Telephone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+81 90 0000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Secure payment details */}
              <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950/20 space-y-4">
                <h3 className="font-serif text-sm font-semibold flex items-center space-x-2 border-b border-gray-100 pb-3 dark:border-zinc-900 text-gray-950 dark:text-white">
                  <CreditCard className="h-4 w-4" />
                  <span>Secure Payment Methodologies</span>
                </h3>

                {/* Method Options Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('stripe');
                      setStripeError(null);
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-all border cursor-pointer ${
                      paymentMethod === 'stripe'
                        ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                        : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 dark:bg-zinc-900/10 dark:border-zinc-850 dark:text-zinc-400'
                    }`}
                  >
                    <span className="text-[10px] font-mono tracking-wider font-extrabold">STRIPE</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">Cards & Pay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('paypal');
                      setStripeError(null);
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-all border cursor-pointer ${
                      paymentMethod === 'paypal'
                        ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                        : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 dark:bg-zinc-900/10 dark:border-zinc-850 dark:text-zinc-400'
                    }`}
                  >
                    <span className="text-[10px] font-mono tracking-wider font-extrabold">PAYPAL</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">PayPal Wallet</span>
                  </button>
                </div>

                {paymentMethod === 'stripe' && (
                  <div className="space-y-4 pt-1 font-mono">
                    <div className="p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/40 dark:bg-zinc-900/10 text-center space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-[#ff4747]/10 text-[#ff4747]">
                        SECURE CARD & EXPRESS PAY CHANNELS
                      </div>
                      <p className="text-xs font-serif text-gray-950 dark:text-white">Central Stripe Merchant Gateway</p>
                      <p className="text-[10px] text-gray-450 dark:text-zinc-505 max-w-sm mx-auto leading-relaxed">
                        Validation uses the secure card transaction networks of Visa, Mastercard, American Express, Apple Pay, and Google Pay through the Stripe hosted portal.
                      </p>
                    </div>
                    {stripeError && (
                      <div className="p-3 text-[10px] font-mono text-[#ff4747] bg-[#ff4747]/10 border border-[#ff4747]/20 rounded-xl leading-relaxed">
                        {stripeError}
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'paypal' && (
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
                            <p className="text-[9px] text-zinc-500 font-sans">
                              Please utilize our primary Credit Card (Stripe) payment method if initialization issues persist.
                            </p>
                          </div>
                        ) : (
                          (!isPending || isResolved) && (
                            <PayPalButtons
                              style={{ layout: "vertical", shape: "rect", label: "paypal", height: 40 }}
                              disabled={processingPayment || cart.length === 0}
                              onClick={(data, actions) => {
                                if (!firstName || !lastName || !email || !streetAddress || !city || !zipCode || !phone) {
                                  setStripeError("Please complete your delivery carriage destination details before proceeding with PayPal.");
                                  return actions.reject();
                                } else {
                                  setStripeError(null);
                                  return actions.resolve();
                                }
                              }}
                              createOrder={(data, actions) => {
                                return actions.order.create({
                                  intent: "CAPTURE",
                                  purchase_units: [
                                    {
                                      amount: {
                                        currency_code: "USD",
                                        value: totalAmount.toFixed(2),
                                      },
                                      description: `Luxe Market Order Carriage for ${firstName} ${lastName}`
                                    },
                                  ],
                                });
                              }}
                              onApprove={async (data, actions) => {
                                if (actions.order) {
                                  try {
                                    const details = await actions.order.capture();
                                    const paypalOrderId = details.id || data.orderID;
                                    await handleSaveBackendOrder('PayPal Wallet', paypalOrderId);
                                  } catch (err: any) {
                                    setStripeError(err.message || 'PayPal transaction authentication check failed.');
                                  }
                                }
                              }}
                              onError={(err) => {
                                setStripeError('PayPal gateway experienced an execution error: ' + String(err));
                              }}
                            />
                          )
                        )}
                      </div>
                    </div>
                    {stripeError && (
                      <div className="p-3 text-[10px] font-mono text-[#ff4747] bg-[#ff4747]/10 border border-[#ff4747]/20 rounded-xl leading-relaxed">
                        {stripeError}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2 rounded-xl bg-gray-50 p-3.5 dark:bg-zinc-900/40">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
                  <p className="text-[10px] text-gray-450 dark:text-zinc-500 leading-normal font-mono">
                    Secure transaction routing follows verified AES encryptions. We strictly bypass caching of bank credentials directly on our local servers.
                  </p>
                </div>
              </div>

              {/* Secure checkout triggers */}
              {paymentMethod === 'stripe' && (
                <button
                  type="submit"
                  disabled={processingPayment || cart.length === 0}
                  className="w-full flex items-center justify-between rounded-xl bg-zinc-900 px-6 py-4 text-xs font-semibold text-white shadow-xl hover:bg-zinc-800 disabled:bg-gray-450 transition-all dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 cursor-pointer"
                >
                  <span>{processingPayment ? 'Processing carriage validation...' : 'Proceed to Secure Stripe Checkout'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

            </form>
          </div>

          {/* Checkout Totals details - Right 5 columns */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950/20">
              <h3 className="font-serif text-sm font-semibold border-b border-gray-100 pb-3 dark:border-zinc-900 text-gray-950 dark:text-white">Carriage Review Summary</h3>
              
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
                  <span>Carriage subtotal</span>
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
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>State duty VAT (8%)</span>
                  <span className="font-mono text-gray-950 dark:text-white">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-100 pt-3.5 dark:border-zinc-900 flex justify-between font-serif text-sm font-bold text-gray-950 dark:text-white">
                  <span>Total Carriage Costs</span>
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
