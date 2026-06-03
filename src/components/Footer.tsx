/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight, 
  MapPin, 
  Mail, 
  Lock, 
  Truck, 
  RotateCcw, 
  Headphones,
  Sparkles
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView } = useApp();
  const [email, setEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setNewsletterSubmitted(true);
      setEmail('');
    }
  };

  return (
    <footer id="luxe-footer" className="mt-auto border-t border-gray-100 bg-gray-50/55 transition-colors duration-300 dark:border-zinc-900 dark:bg-zinc-950/60 pb-12 pt-16">
      
      {/* Guarantees Badges */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start space-x-3.5 rounded border border-slate-200 bg-white p-5 dark:bg-zinc-900/40 dark:border-zinc-800">
            <div className="rounded bg-slate-100 p-2.5 dark:bg-zinc-800 text-[#ff4747]">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white">Free Insured Delivery</h4>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed font-sans font-medium">Complementary globally sourced shipping on orders over $150.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 rounded border border-slate-200 bg-white p-5 dark:bg-zinc-900/40 dark:border-zinc-800">
            <div className="rounded bg-slate-100 p-2.5 dark:bg-zinc-800 text-[#ff4747]">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white">30-Day Hassle Returns</h4>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed font-sans font-medium">Exchange or return products easily with pre-paid return shipping labels.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 rounded border border-slate-200 bg-white p-5 dark:bg-zinc-900/40 dark:border-zinc-800">
            <div className="rounded bg-slate-100 p-2.5 dark:bg-zinc-800 text-[#ff4747]">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white">Fully Secured Payments</h4>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed font-sans font-medium">All transaction processes feature verified AES encryption security.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 rounded border border-slate-200 bg-white p-5 dark:bg-zinc-900/40 dark:border-zinc-800">
            <div className="rounded bg-slate-100 p-2.5 dark:bg-zinc-800 text-[#ff4747]">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white">Professional Concierge</h4>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed font-sans font-medium">Our styling and support team is here for you 24/7 in real time.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-zinc-900 pt-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase font-sans">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#ff4747] text-white">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <span>LUXE<span className="text-[#ff4747]">MARKET</span></span>
            </div>
            <p className="mt-4 max-w-sm text-xs text-gray-400 dark:text-zinc-500 leading-relaxed font-sans font-medium">
              Curating architectural, modern boutique products that speak with luxury and subtle refinement. Each item represents carefully optimized craftsmanship made to elevate human workspace aesthetics.
            </p>

            {/* Newsletter Input with High Density border */}
            <form onSubmit={handleSubscribe} className="mt-6 max-w-sm font-sans">
              <label className="text-[9px] font-mono tracking-wider uppercase text-gray-400 dark:text-zinc-500 font-bold">Mailing Privileges</label>
              <div className="relative mt-2 flex">
                <input
                  type="email"
                  placeholder="name@exclusive.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={newsletterSubmitted}
                  className="w-full border-2 border-[#ff4747] bg-white px-4 py-2.5 text-xs text-zinc-950 outline-none transition-colors dark:bg-zinc-900 dark:text-white font-sans placeholder-slate-400 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={newsletterSubmitted}
                  className="absolute right-1 top-1 flex h-[34px] w-[34px] items-center justify-center bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-[#ff4747] dark:hover:text-white rounded"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {newsletterSubmitted && (
                <p className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-450 font-bold">✓ Invited to catalog drops. Welcome to Luxe.</p>
              )}
            </form>
          </div>

          {/* Quick links */}
          <div>
            <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Gallery Routes</h5>
            <ul className="mt-4 space-y-3">
              <li>
                <button onClick={() => setActiveView('home')} className="text-xs text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
                  Home Catalog
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('cart')} className="text-xs text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
                  Boutique Cart
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('user-dashboard')} className="text-xs text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
                  My Cabin / Account
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('admin-dashboard')} className="text-xs text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
                  Retailer Administration Console
                </button>
              </li>
            </ul>
          </div>

          {/* Contact and credentials */}
          <div>
            <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Global Atelier</h5>
            <ul className="mt-4 space-y-3.5">
              <li className="flex items-center space-x-2 text-xs text-gray-500 dark:text-zinc-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>Tokyo • New York • Berlin</span>
              </li>
              <li className="flex items-center space-x-2 text-xs text-gray-500 dark:text-zinc-400">
                <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>concierge@luxemarket.digital</span>
              </li>
              <li className="mt-4">
                {/* Credit card cards container mimic */}
                <div className="flex space-x-2">
                  <span className="rounded-md border border-gray-200/50 bg-white px-1.5 py-0.5 text-[8px] font-mono tracking-tighter text-gray-400 font-bold dark:border-zinc-800 dark:bg-zinc-900">VISA</span>
                  <span className="rounded-md border border-gray-200/50 bg-white px-1.5 py-0.5 text-[8px] font-mono tracking-tighter text-gray-400 font-bold dark:border-zinc-800 dark:bg-zinc-900">MC</span>
                  <span className="rounded-md border border-gray-200/50 bg-white px-1.5 py-0.5 text-[8px] font-mono tracking-tighter text-gray-400 font-bold dark:border-zinc-800 dark:bg-zinc-900">AMEX</span>
                  <span className="rounded-md border border-gray-200/50 bg-white px-1.5 py-0.5 text-[8px] font-mono tracking-tighter text-gray-400 font-bold dark:border-zinc-800 dark:bg-zinc-900">PAY</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-gray-100 dark:border-zinc-900 pt-6 sm:flex-row">
          <p className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">© 2026 Luxe Market, Ltd. All rights reserved.</p>
          <div className="mt-2 flex space-x-4 sm:mt-0">
            <a href="#" className="text-[10px] font-mono text-gray-450 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-400">Privacy Charter</a>
            <a href="#" className="text-[10px] font-mono text-gray-450 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-400">Terms of Carriage</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
