/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  ArrowRight, 
  Plus, 
  Sparkles, 
  Flame, 
  Layers, 
  ShoppingBag,
  Star,
  Heart
} from 'lucide-react';

export const Home: React.FC = () => {
  const { products, setSelectedProduct, setActiveView, addToCart, toggleWishlist, isInWishlist } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Furniture', 'Electronics', 'Accessories', 'Fashion', 'Home & Garden', 'Sports', 'Beauty'];

  // Filter out archived or unpublished draft products for standard storefront browsing
  const activeProducts = products.filter(p => p.isArchived !== true && p.isPublished !== false);

  const filteredProducts = selectedCategory === 'All' 
    ? activeProducts 
    : activeProducts.filter(p => p.category === selectedCategory);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find featured items for bento from available active candidates
  const mainHighlight = activeProducts.find(p => p.id === 'lounge-chair') || activeProducts[0];
  const footwearHighlight = activeProducts.find(p => p.id === 'red-footwear') || activeProducts[0];
  const serumHighlight = activeProducts.find(p => p.id === 'skincare-organic') || activeProducts[0];

  return (
    <div id="home-page" className="space-y-12">
      
      {/* Editorial Boutique Hero Section with Vibrant Gradient */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#ff8c00] to-[#ff4747] text-white border border-slate-200 dark:border-zinc-800 shadow-sm">
        {/* Decorative Grid SVG overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Main Hero Copy - Left side */}
          <div className="flex flex-col justify-center px-6 py-12 sm:p-12 lg:col-span-12 xl:col-span-7 lg:py-16 xl:p-14 z-10">
            <div className="inline-flex items-center space-x-1.5 rounded bg-slate-900 px-3 py-1 text-white w-fit">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Luxe High-Density Atelier Launch</span>
            </div>
            
            <h1 className="mt-6 font-sans text-4xl sm:text-5xl md:text-6xl font-black leading-none tracking-tighter uppercase">
              SUMMER TECH<br className="hidden sm:inline" />
              & DETAIL FESTIVAL
            </h1>
            
            <p className="mt-4 max-w-lg text-sm text-white/90 leading-relaxed font-sans font-medium">
              Curating high-density architectural elements and precise workflow peripherals. Engineered for enthusiasts of absolute visual alignment, bold aesthetics, and refined ergonomics. Enjoy up to 70% off.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button 
                onClick={() => handleProductClick(mainHighlight)}
                className="group flex items-center space-x-2 rounded bg-slate-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all duration-150 hover:bg-slate-850"
              >
                <span>Shop Highlight Spec</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
              </button>
              
              <button 
                onClick={() => {
                  const el = document.getElementById('catalog-grid-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded border border-white bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all font-sans"
              >
                Inquire Catalog
              </button>
            </div>

            {/* Micro Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/20 pt-8 sm:gap-6 font-sans">
              <div>
                <p className="text-3xl font-black tracking-tight">899+</p>
                <p className="text-[10px] font-mono tracking-wider text-white/80 uppercase mt-1">Batch Issues</p>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight">4.92</p>
                <p className="text-[10px] font-mono tracking-wider text-white/80 uppercase mt-1">Atelier Rating</p>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight">100%</p>
                <p className="text-[10px] font-mono tracking-wider text-white/80 uppercase mt-1">Certified Origin</p>
              </div>
            </div>
          </div>

          {/* Feature Highlight Card - Right side */}
          <div className="relative flex items-center justify-center p-6 bg-slate-950/20 lg:col-span-12 xl:col-span-5 border-t xl:border-t-0 xl:border-l border-white/20 lg:p-10">
            <div className="group relative w-full max-w-sm rounded bg-white p-4 border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-[#ff4747] text-slate-900">
              <div className="aspect-square w-full overflow-hidden rounded bg-slate-100">
                <img 
                  src={mainHighlight.image} 
                  alt={mainHighlight.name} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#ff4747] font-bold">{mainHighlight.category}</span>
                    <h3 className="mt-1 font-sans text-sm font-black uppercase text-slate-900 tracking-tight leading-tight">{mainHighlight.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] line-through text-slate-400 font-mono">${mainHighlight.originalPrice}</span>
                    <p className="text-lg font-black text-[#ff4747] mt-0.5 font-mono">${mainHighlight.price}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-150 pt-3">
                  <div className="flex space-x-0.5 text-yellow-500">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <button 
                    onClick={() => handleProductClick(mainHighlight)}
                    className="flex items-center space-x-1 text-xs font-bold text-[#ff4747] uppercase tracking-wider hover:underline"
                  >
                    <span>Inspect Detail</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Highlights (Mockup 1 Details) */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#ff4747] font-black">CURATED ARCHITECTURE</span>
            <h2 className="mt-1 font-sans text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">BENTO CONSOLE HIGHLIGHTS</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:grid-rows-2 font-sans">
          
          {/* Bento Cell 1: Big Spotlight Cloud Sofa */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 md:col-span-8 md:row-span-2 flex flex-col justify-between dark:border-zinc-850 dark:bg-zinc-900/40">
            <div className="z-10 max-w-sm">
              <span className="inline-flex items-center space-x-1.5 rounded bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-800 dark:bg-zinc-800 dark:text-zinc-350">
                <Layers className="h-3 w-3 text-[#ff4747]" />
                <span>SPEC LIMITED LOUNGE BATCH</span>
              </span>
              <h3 className="mt-4 font-sans text-xl sm:text-2xl font-black uppercase text-gray-900 dark:text-white leading-tight">The Cloud Modular Sofa System</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans font-medium">
                Configure your ultimate aesthetic workspace landscape with dense, high-elastic memory cushions wrapped in premium heavy boucle textile.
              </p>
              <button 
                onClick={() => {
                  const cloudSofa = products.find(p => p.id === 'modular-sofa');
                  if (cloudSofa) handleProductClick(cloudSofa);
                }}
                className="mt-4 group inline-flex items-center space-x-2 rounded bg-slate-900 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                <span>Acquire Cloud Sofa</span>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            
            {/* Visual */}
            <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded bg-slate-105 dark:bg-zinc-950">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT5Duqfnw0ipClK4Hc5FGUpwQlpF3E0VPqVMKhz5FFBoX3aFelaRhaJj69J-UuA6yNoecyfo2Vpi0vhsuvP654YtD9YOFHp7cVbWLrquTXeAfTZWnaG23tOePkM6yPGYLWQUNJAG3KsnvtRdGX8G3DxAQ8d6FZWcP7KXsBBaW7e1QmemKAXSqeoH0BzvnzrFyfFVGADTWOOSfJR_SNYby55xpEQAQL1t8jKJYJBiM4Um8A10dXjuSWWUwWg2zMLcOQYDjJ3Hkzj5ET" 
                alt="Cloud Sofa" 
                className="h-full w-full object-cover transition-transform duration-750 group-hover:scale-[1.03]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Bento Cell 2: Performance Footwear */}
          <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-6 md:col-span-4 flex flex-col justify-between dark:border-zinc-850 dark:bg-zinc-900/40">
            <div>
              <span className="inline-flex items-center space-x-1 bg-red-50 px-2 py-0.5 text-[9px] font-mono font-bold text-[#ff4747] dark:bg-rose-950/40 dark:text-rose-450 rounded">
                <Flame className="h-3 w-3" />
                <span>FLASH HIT DEALS</span>
              </span>
              <h4 className="mt-3 font-sans text-sm font-black uppercase text-gray-900 dark:text-white leading-tight">{footwearHighlight.name}</h4>
              <p className="mt-1 font-mono text-xs text-slate-500 dark:text-zinc-400">${footwearHighlight.price}</p>
            </div>
            <div className="relative mt-4 h-32 overflow-hidden rounded bg-slate-105 dark:bg-zinc-950">
              <img 
                src={footwearHighlight.image} 
                alt={footwearHighlight.name} 
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => handleProductClick(footwearHighlight)}
                className="absolute bottom-2 right-2 rounded bg-slate-900/90 p-2 text-white hover:bg-[#ff4747] dark:bg-zinc-950/90"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Bento Cell 3: Organic Skincare Drops */}
          <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-6 md:col-span-4 flex flex-col justify-between dark:border-zinc-850 dark:bg-zinc-900/40">
            <div>
              <span className="inline-flex items-center space-x-1.5 rounded bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff4747] dark:bg-zinc-800">CLINICAL DIRECT</span>
              <h4 className="mt-2 font-sans text-sm font-black uppercase text-gray-900 dark:text-white leading-tight">{serumHighlight.name}</h4>
              <p className="mt-1 font-mono text-xs text-slate-500 dark:text-zinc-400">${serumHighlight.price}</p>
            </div>
            <div className="relative mt-4 h-32 overflow-hidden rounded bg-slate-105 dark:bg-zinc-950">
              <img 
                src={serumHighlight.image} 
                alt={serumHighlight.name} 
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => handleProductClick(serumHighlight)}
                className="absolute bottom-2 right-2 rounded bg-slate-900/90 p-2 text-white hover:bg-[#ff4747] dark:bg-zinc-950/90"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Boutique Categorization & Dynamic Grid Catalog (Mockup 1 Footer / Catalog) */}
      <section id="catalog-grid-section" className="space-y-6 pt-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#ff4747] font-black">Fine Signature Choices</span>
            <h2 className="mt-1 font-sans text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">The Active Operations Catalog</h2>
          </div>
          
          {/* Categories Horizontal Scroller */}
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded px-3 py-1.5 text-xs font-bold uppercase transition-all duration-150 whitespace-nowrap tracking-wider ${
                  selectedCategory === cat
                    ? 'bg-[#ff4747] text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Catalog Grid with High Density cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 font-sans">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="group cursor-pointer rounded border border-slate-200 bg-white p-3 shadow-none transition-all duration-150 hover:border-[#ff4747] dark:border-zinc-850 dark:bg-zinc-900/40"
            >
              {/* Product Thumbnail Shell */}
              <div className="relative aspect-square w-full overflow-hidden rounded bg-slate-105 dark:bg-zinc-950">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Discount Tag */}
                {product.discount && (
                  <span className="absolute left-2 top-2 rounded bg-[#ff4747] px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                    {product.discount}% OFF
                  </span>
                )}

                {/* Wishlist Toggle Badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-3xl transition-all duration-150 shadow-sm border z-10 ${
                    isInWishlist(product.id)
                      ? 'bg-red-500 border-red-500 text-white hover:bg-red-650'
                      : 'bg-white/90 border-slate-200 text-gray-500 backdrop-blur-sm hover:bg-white hover:text-red-500 dark:bg-zinc-950/90 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-red-400'
                  }`}
                  title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`h-3.5 w-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, 1);
                  }}
                  className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded bg-slate-900/95 text-white opacity-0 shadow-lg transition-all duration-200 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[#ff4747] dark:bg-white/95 dark:text-zinc-950 dark:hover:bg-[#ff4747] dark:hover:text-white"
                  title="Quick Add to Cart"
                >
                  <ShoppingBag className="h-4 w-4" />
                </button>
              </div>

              {/* Identity & Accounting */}
              <div className="mt-4 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-550">{product.category}</span>
                  <h3 className="mt-1 font-sans text-xs font-black uppercase text-slate-900 dark:text-zinc-50 line-clamp-1 tracking-tight">{product.name}</h3>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="text-[10px] line-through text-slate-400 font-mono">${product.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <span className="font-mono text-[9px] font-bold text-[#ff4747] uppercase tracking-widest">Inspect Detail →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
