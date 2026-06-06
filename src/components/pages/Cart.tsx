/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Tag, 
  Lock, 
  ArrowLeft,
  X
} from 'lucide-react';
import { Product } from '../../types';

export const BoutiqueCart: React.FC = () => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    couponApplied, 
    promoCode, 
    applyCoupon, 
    setActiveView,
    recommendedProducts,
    setSelectedProduct
  } = useApp();

  const [couponText, setCouponText] = useState('');
  const [couponError, setCouponError] = useState(false);

  // Totals calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = couponApplied ? subtotal * 0.25 : 0;
  const deliveryCost = subtotal > 150 ? 0 : 15;
  const finalTotal = subtotal - discountAmount + deliveryCost;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponText.trim()) {
      const ok = applyCoupon(couponText);
      if (ok) {
        setCouponError(false);
      } else {
        setCouponError(true);
      }
    }
  };

  const handleCheckoutClick = () => {
    setActiveView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecommendInspect = (prod: Product) => {
    setSelectedProduct(prod);
    setActiveView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="boutique-cart-page" className="space-y-8">
      
      {/* Page Title */}
      <div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Your Selection</span>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Shopping Cart</h2>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-zinc-800">
          <p className="text-lg font-medium text-slate-500 dark:text-zinc-400">Your shopping cart is empty.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400 dark:text-zinc-500">Discover great deals and amazing products in our store.</p>
          <button
            onClick={() => setActiveView('home')}
            className="mt-6 inline-flex items-center space-x-2 rounded bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Continue Shopping</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Cart items list - 8 columns */}
          <div className="space-y-4 lg:col-span-8">
            {cart.map((item, idx) => (
              <div 
                key={`${item.product.id}-${idx}`}
                className="flex items-center space-x-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-900/10"
              >
                {/* Product Thumbnail image */}
                <div 
                  onClick={() => {
                    setSelectedProduct(item.product);
                    setActiveView('product');
                  }}
                  className="aspect-square h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-950"
                >
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    className="h-full w-full object-cover transition-transform hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Info and action */}
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-zinc-550">{item.product.category}</span>
                      <h3 
                        onClick={() => {
                          setSelectedProduct(item.product);
                          setActiveView('product');
                        }}
                        className="font-serif text-sm text-gray-900 hover:text-zinc-650 cursor-pointer dark:text-white dark:hover:text-zinc-300"
                      >
                        {item.product.name}
                      </h3>
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-550">
                        Config: {item.selectedColor !== 'Default' ? `${item.selectedColor} • ` : ''}{item.selectedMaterial !== 'Default' ? item.selectedMaterial : 'Standard'}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-blue-500 dark:hover:bg-zinc-900"
                      title="Remove product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Pricing and quantity sync row */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3 rounded-lg border border-gray-150 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-850"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-mono text-xs text-gray-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-850"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="font-serif text-sm font-semibold text-gray-950 dark:text-white">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setActiveView('home')}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Continue Shopping</span>
            </button>
          </div>

          {/* Pricing Summary Side Card - 4 columns */}
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950/40">
              <h3 className="font-serif text-base text-gray-900 dark:text-white">Order Summary</h3>
              
              <div className="mt-6 space-y-3.5 text-xs text-gray-500 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-gray-950 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                
                {couponApplied && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>Coupon ({promoCode}) Applied</span>
                    </span>
                    <span>-25% (-${discountAmount.toFixed(2)})</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Duty & Delivery Shipping</span>
                  <span className="font-mono text-gray-950 dark:text-white">
                    {deliveryCost === 0 ? 'FREE' : `$${deliveryCost.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3.5 dark:border-zinc-900 flex justify-between font-serif text-sm font-semibold text-gray-950 dark:text-white">
                  <span>Total Amount</span>
                  <span className="font-sans text-base">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon inputs - matching mockup 2 */}
              <div className="border-t border-gray-150 pt-4 mt-6 dark:border-zinc-900">
                <form onSubmit={handleApplyCoupon}>
                  <p className="text-[10px] font-mono uppercase text-gray-400 dark:text-zinc-550">Have a priority coupon?</p>
                  <div className="relative mt-2 flex">
                    <input
                      type="text"
                      placeholder="e.g. MORVEX25"
                      value={couponText}
                      onChange={(e) => setCouponText(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-10 text-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 top-1 rounded-lg bg-zinc-900 px-3 py-1 text-[10px] font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                    >
                      Apply
                    </button>
                  </div>
                </form>
                {couponApplied && (
                  <p className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">✓ Authentic privilege code applied.</p>
                )}
                {couponError && (
                  <p className="mt-2 text-[10px] font-mono text-red-500">Invalid code. Try "MORVEX25" for 25% off.</p>
                )}
              </div>

              {/* Secure Checkout button */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCheckoutClick}
                  className="flex w-full items-center justify-between rounded-xl bg-[#2563eb] px-5 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-slate-900 dark:text-white"
                >
                  <span>Secure Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-center space-x-1.5 font-sans text-xs font-medium text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Secure Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recents banner with bento items (Recently Viewed) */}
      <section className="border-t border-gray-100 pt-10 dark:border-zinc-900">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Product Recommendations</span>
          <h3 className="mt-1 font-serif text-xl font-normal text-gray-900 dark:text-white">Recently Viewed Selection</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-6">
          {recommendedProducts.slice(1, 5).map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleRecommendInspect(prod)}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-3 hover:border-zinc-350 dark:border-zinc-900 dark:bg-zinc-900/10 dark:hover:border-zinc-700"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-55 dark:bg-zinc-950">
                <img 
                  src={prod.image} 
                  alt={prod.name} 
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="mt-3 font-serif text-sm text-gray-800 dark:text-zinc-200 line-clamp-1">{prod.name}</h4>
              <div className="mt-1.5 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">${prod.price}</span>
                <span className="font-mono text-[9px] text-gray-400 select-none group-hover:text-zinc-950 dark:group-hover:text-white">Inspect →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
