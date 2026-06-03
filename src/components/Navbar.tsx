/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Search, 
  Sun, 
  Moon, 
  User, 
  ShieldAlert, 
  Compass, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { ActiveView } from '../types';

export const Navbar: React.FC = () => {
  const { 
    cart, 
    activeView, 
    setActiveView, 
    isDarkMode, 
    toggleDarkMode, 
    searchQuery, 
    setSearchQuery,
    products,
    setSelectedProduct,
    user
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (product: any) => {
    setSelectedProduct(product);
    setActiveView('product');
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const navLinks: { label: string; view: ActiveView; icon: any }[] = [
    { label: 'Explore', view: 'home', icon: Compass },
    { label: 'Cart', view: 'cart', icon: ShoppingBag },
    ...(user ? [
      { label: 'Account', view: 'user-dashboard' as ActiveView, icon: User },
      ...(user.role === 'admin' ? [{ label: 'Console', view: 'admin-dashboard' as ActiveView, icon: ShieldAlert }] : [])
    ] : [
      { label: 'Sign In', view: 'auth' as ActiveView, icon: User }
    ])
  ];

  return (
    <header id="luxe-navbar" className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white transition-colors duration-300 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div 
          onClick={() => setActiveView('home')} 
          className="flex cursor-pointer items-center space-x-2 text-2xl font-black tracking-tighter text-slate-900 duration-150 active:scale-95 dark:text-white uppercase"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[#ff4747] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-sans">LUXE<span className="text-[#ff4747]">MARKET</span></span>
        </div>

        {/* Search Bar with High Density thick border */}
        <div className="relative hidden max-w-md flex-1 px-8 md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search premium products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => setShowSearchResults(searchQuery.length > 0)}
              className="w-full border-2 border-[#ff4747] bg-white px-4 py-2 pl-10 text-sm font-sans focus:outline-none dark:bg-zinc-900 dark:text-white"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            
            {/* Search Dropdown Results */}
            {showSearchResults && (
              <div className="absolute top-11 z-50 w-full rounded border border-slate-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                {filteredProducts.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <p className="px-3 py-1.5 font-mono text-[10px] uppercase text-zinc-400 dark:text-zinc-500">Products Found ({filteredProducts.length})</p>
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => handleSearchSelect(product)}
                        className="flex cursor-pointer items-center space-x-3 rounded p-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800"
                      >
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-10 w-10 rounded object-cover bg-gray-100 dark:bg-zinc-950" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{product.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{product.category} • ${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 text-center text-xs text-gray-500 dark:text-zinc-400">No premium items match "{searchQuery}"</p>
                )}
                <div className="border-t border-slate-100 mt-1 pt-1 dark:border-zinc-800">
                  <button 
                    onClick={() => setShowSearchResults(false)} 
                    className="w-full py-1 text-center font-mono text-[10px] text-gray-400 hover:text-gray-650 dark:text-zinc-550 dark:hover:text-zinc-400"
                  >
                    Close Search Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center space-x-4">
          <nav className="hidden items-center space-x-1.5 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => setActiveView(link.view)}
                  className={`flex items-center space-x-1.5 rounded px-3 py-1.5 text-xs font-bold transition-all duration-200 uppercase tracking-tight ${
                    isActive 
                      ? 'bg-[#ff4747] text-white border border-[#ff4747]' 
                      : 'text-slate-600 hover:bg-slate-55 hover:text-slate-900 border border-transparent dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                  {link.view === 'cart' && cartItemsCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-3xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-1 text-[9px] font-black">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="rounded p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-gray-100 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-950 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-gray-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white shadow-lg lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-1.5 px-4 py-3">
            {/* Search for Mobile */}
            <div className="relative mb-3 py-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              />
              <Search className="absolute left-3 top-4 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => {
                    setActiveView(link.view);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                    isActive 
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
                      : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.view === 'cart' && cartItemsCount > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
