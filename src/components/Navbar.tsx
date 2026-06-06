/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
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
  Sparkles,
  Heart
} from 'lucide-react';
import { ActiveView } from '../types';

export const Navbar: React.FC = () => {
  const { 
    cart, 
    activeView, 
    setActiveView, 
    searchQuery, 
    setSearchQuery,
    products,
    setSelectedProduct,
    user
  } = useApp();
  
  const { isDarkMode, toggleDarkMode } = useTheme();

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

  return (
    <header id="morvex-navbar" className="sticky top-0 z-40 w-full bg-[#131921] transition-colors duration-300 text-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div 
          onClick={() => setActiveView('home')} 
          className="flex cursor-pointer items-center space-x-4 duration-150 active:scale-95 group"
        >
          <div className="flex h-12 w-12 items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <path d="M10 12V8C10 4.686 12.686 2 16 2C19.314 2 22 4.686 22 8V12" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="4" y="10" width="24" height="20" rx="3" fill="#2563eb" />
              <path d="M9 23V15L16 21L23 15V23" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-sans text-2xl font-black tracking-tighter text-white">MORVEX</span>
        </div>

        {/* Search Bar Premium Styling */}
        <div className="relative hidden max-w-xl flex-1 px-4 lg:px-8 md:block">
          <div className="relative flex w-full items-center group">
            <input
              type="text"
              placeholder="Search premium collection..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => setShowSearchResults(searchQuery.length > 0)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-5 pr-14 py-2.5 text-sm font-sans focus:outline-none focus:border-[#2563eb] focus:bg-white focus:ring-1 focus:ring-[#2563eb] transition-all dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900 dark:text-white placeholder-slate-400"
            />
            {searchQuery ? (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-12 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <button 
              className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#2563eb] text-white transition-colors hover:bg-blue-700"
              onClick={() => setShowSearchResults(searchQuery.length > 0)}
            >
              <Search className="h-4 w-4" />
            </button>
            
            {/* Search Dropdown Results */}
            {showSearchResults && (
              <div className="absolute top-12 z-50 w-full rounded border border-slate-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                {filteredProducts.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    <p className="px-3 py-1.5 font-sans text-xs font-semibold text-slate-500 dark:text-zinc-400">Products Found ({filteredProducts.length})</p>
                    {filteredProducts.slice(0, 8).map(product => (
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
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{product.name}</p>
                          <p className="text-xs text-slate-500 dark:text-zinc-500">${product.price.toFixed(2)} <span className="ml-1 text-[10px] text-[#2563eb]">{product.category}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 text-center text-sm text-slate-500 dark:text-zinc-400">No items match "{searchQuery}"</p>
                )}
                <div className="border-t border-slate-100 mt-2 pt-2 dark:border-zinc-800">
                  <button 
                    onClick={() => setShowSearchResults(false)} 
                    className="w-full py-1 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    Close Search Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          <nav className="hidden items-center space-x-3 lg:flex">
            {user ? (
              <button
                onClick={() => {
                  setActiveView('user-dashboard');
                  window.location.hash = 'orders';
                }}
                className={`flex flex-col items-center justify-center rounded-lg px-4 py-1.5 transition-all duration-200 hover:bg-white/10 ${activeView === 'user-dashboard' ? 'text-white' : 'text-white/80 hover:text-white'}`}
              >
                <User className="h-5 w-5 mb-1.5 stroke-[1.5]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Account</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveView('auth')}
                className={`flex flex-col items-center justify-center rounded-lg px-4 py-1.5 transition-all duration-200 hover:bg-white/10 ${activeView === 'auth' ? 'text-white' : 'text-white/80 hover:text-white'}`}
              >
                <User className="h-5 w-5 mb-1.5 stroke-[1.5]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Sign In</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveView('wishlist');
              }}
              className={`flex flex-col items-center justify-center rounded-lg px-4 py-1.5 transition-all duration-200 hover:bg-white/10 ${activeView === 'wishlist' ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              <Heart className="h-5 w-5 mb-1.5 stroke-[1.5]" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Wishlist</span>
            </button>

            <button
              onClick={() => setActiveView('cart')}
              className={`relative flex flex-col items-center justify-center rounded-lg px-4 py-1.5 transition-all duration-200 hover:bg-white/10 ${activeView === 'cart' ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              <ShoppingBag className="h-5 w-5 mb-1.5 stroke-[1.5]" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Cart</span>
              {cartItemsCount > 0 && (
                <span className="absolute right-2 top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#2563eb] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveView('admin-dashboard')}
                className={`flex flex-col items-center justify-center rounded-lg px-4 py-1.5 transition-all duration-200 hover:bg-white/10 ${activeView === 'admin-dashboard' ? 'text-white' : 'text-white/80 hover:text-white'}`}
              >
                <ShieldAlert className="h-5 w-5 mb-1.5 stroke-[1.5]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Console</span>
              </button>
            )}
          </nav>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="rounded p-2 text-white/80 hover:bg-white/10 hover:text-white border border-transparent"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded p-2 text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Always-Visible Search Row */}
      <div className="bg-[#131921] px-4 py-2.5 md:hidden">
        <div className="relative flex w-full items-center">
          <input
            type="text"
            placeholder="Search premium collection..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            onFocus={() => setShowSearchResults(searchQuery.length > 0)}
            className="w-full rounded-full border border-slate-200 bg-slate-50 pl-5 pr-14 py-2.5 text-sm font-sans focus:outline-none focus:border-[#2563eb] focus:bg-white focus:ring-1 focus:ring-[#2563eb] transition-all dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900 dark:text-white placeholder-slate-400"
          />
          {searchQuery ? (
            <button 
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-12 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button 
            className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#2563eb] text-white transition-colors hover:bg-blue-700"
            onClick={() => setShowSearchResults(searchQuery.length > 0)}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Mobile Search Dropdown Results */}
          {showSearchResults && (
            <div className="absolute top-12 z-50 w-full rounded border border-slate-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              {filteredProducts.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  <p className="px-3 py-1.5 font-sans text-xs font-semibold text-slate-500 dark:text-zinc-400">Products Found ({filteredProducts.length})</p>
                  {filteredProducts.slice(0, 5).map(product => (
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
                        <p className="text-sm font-medium text-slate-800 dark:text-white line-clamp-1">{product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">${product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-center text-sm text-slate-500 dark:text-zinc-400">No items match "{searchQuery}"</p>
              )}
              <div className="border-t border-slate-100 mt-2 pt-2 dark:border-zinc-800">
                <button 
                  onClick={() => setShowSearchResults(false)} 
                  className="w-full py-1 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  Close Search Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white shadow-lg lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-1.5 px-4 py-3">
            <button
              onClick={() => {
                setActiveView('home');
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                activeView === 'home' 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
                  : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Compass className="h-4 w-4" />
                <span>Explore</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveView('cart');
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                activeView === 'cart' 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
                  : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Cart</span>
              </div>
              {cartItemsCount > 0 && (
                <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveView('wishlist');
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                activeView === 'wishlist'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Wishlist</span>
              </div>
            </button>

            {user ? (
              <button
                onClick={() => {
                  setActiveView('user-dashboard');
                  window.location.hash = 'orders';
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeView === 'user-dashboard' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
                    : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Account</span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveView('auth');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeView === 'auth' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
                    : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </div>
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveView('admin-dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeView === 'admin-dashboard' 
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
                    : 'text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Console</span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
