/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  Plus, 
  Minus, 
  ShoppingBag, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  Award, 
  ArrowRight,
  ChevronRight,
  Check,
  Heart,
  Clock,
  CreditCard,
  Lock
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { selectedProduct, addToCart, products, setSelectedProduct, setActiveView, toggleWishlist, isInWishlist } = useApp();
  
  // State variables for dynamic configurations
  const [activeThumbnail, setActiveThumbnail] = useState<string>(selectedProduct.image);
  const [selectedColor, setSelectedColor] = useState<string>(selectedProduct.color || 'Default');
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    selectedProduct.materials && selectedProduct.materials.length > 0
      ? selectedProduct.materials[0]
      : 'Default'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'details' | 'features'>('details');

  // Handle case where custom thumbnails don't exist
  const itemThumbnails = selectedProduct.thumbnails || [selectedProduct.image];

  // Recalculate thumbnail when selected product changed
  React.useEffect(() => {
    setActiveThumbnail(selectedProduct.image);
    setSelectedColor(selectedProduct.color || 'Default');
    setSelectedMaterial(
      selectedProduct.materials && selectedProduct.materials.length > 0
        ? selectedProduct.materials[0]
        : 'Default'
    );
    setQuantity(1);
    setActiveTab('details');
  }, [selectedProduct]);

  const handleRecommendClick = (prod: Product) => {
    setSelectedProduct(prod);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity, selectedColor, selectedMaterial);
    setActiveView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, selectedColor, selectedMaterial);
  };

  return (
    <div id="product-detail-page" className="space-y-8 lg:space-y-12 pb-24 lg:pb-8">
      
      {/* Editorial Breadcrumbs */}
      <nav className="flex items-center space-x-2 font-mono text-[10px] text-gray-400 dark:text-zinc-550 uppercase tracking-widest">
        <button onClick={() => setActiveView('home')} className="hover:text-gray-900 dark:hover:text-white">Home</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 dark:text-zinc-700">{selectedProduct.category}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-900 dark:text-white font-semibold">{selectedProduct.name}</span>
      </nav>

      {/* Main Core Showcase Columns */}
      <div className="grid grid-cols-1 gap-6 lg:gap-10 lg:grid-cols-12 font-sans">
        
        {/* Gallery / Interactive Left Panels - 6 columns */}
        <div className="space-y-4 lg:col-span-6">
          {/* Main Visual Screen */}
          <div className="relative aspect-square w-full overflow-hidden rounded border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950">
            <img 
              src={activeThumbnail} 
              alt={selectedProduct.name} 
              className="h-full w-full object-cover transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            
            {/* Discount Percentage Floating badge */}
            {((selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price) || selectedProduct.discount) ? (
              <span className="absolute left-6 top-6 rounded bg-[#2563eb] px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
                SAVE {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price
                  ? Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)
                  : selectedProduct.discount}%
              </span>
            ) : null}
          </div>

          {/* Photo Deck / Thumbnail Strips */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {itemThumbnails.map((thumbUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveThumbnail(thumbUrl)}
                className={`relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded border transition-all ${
                  activeThumbnail === thumbUrl 
                    ? 'border-[#2563eb]' 
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-400 dark:border-zinc-800 dark:bg-zinc-900/35'
                }`}
              >
                <img 
                  src={thumbUrl} 
                  alt="thumbnail" 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Configurations & Spec Panel Right - 6 columns */}
        <div className="space-y-6 lg:col-span-6 sticky top-24 self-start pb-10">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#2563eb] font-black">{selectedProduct.category} Selection</span>
            <h1 className="mt-1 font-sans text-3xl font-bold uppercase leading-tight tracking-tight text-slate-900 dark:text-white">{selectedProduct.name}</h1>
          </div>

          {/* Pricing structures */}
          <div className="rounded border border-slate-200 bg-slate-50 p-5 dark:bg-zinc-900/40 dark:border-zinc-800">
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-black text-slate-900 dark:text-white">${selectedProduct.price.toFixed(2)}</span>
              {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                <>
                  <span className="text-sm text-slate-400 line-through font-mono dark:text-zinc-600">${selectedProduct.originalPrice.toFixed(2)}</span>
                  <span className="font-mono text-xs text-[#2563eb] font-black">
                    (Save ${(selectedProduct.originalPrice - selectedProduct.price).toFixed(2)})
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-400 dark:text-zinc-550 leading-relaxed font-mono uppercase font-bold">Prices include applicable taxes. Shipping calculated at checkout.</p>
          </div>

          {/* Color configs */}
          {selectedProduct.colors && (
            <div className="space-y-3">
              <h4 className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold">FRAME METAL ACCENT: <span className="text-[#2563eb] font-black">{selectedColor}</span></h4>
              <div className="flex space-x-3">
                {selectedProduct.colors.map((colHex, i) => {
                  const names = ['Arctic Silk', 'Matte Carbon', 'Muted Brass'];
                  const name = names[i] || 'Choice';
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(name)}
                      className={`h-7 w-7 rounded-sm border-2 transition-all ${
                        selectedColor === name ? 'border-[#2563eb] scale-110' : 'border-slate-300 hover:border-[#2563eb]'
                      }`}
                      style={{ backgroundColor: colHex }}
                      title={name}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Material configurations */}
          {selectedProduct.materials && (
            <div className="space-y-3">
              <h4 className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold">SELECT UPHOLSTERY FABRIC</h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedProduct.materials.map((mat, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMaterial(mat)}
                    className={`flex items-center justify-between rounded border p-3 text-left text-xs font-black uppercase tracking-wider transition-all ${
                      selectedMaterial === mat
                        ? 'border-[#2563eb] bg-[#2563eb] text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-400 dark:border-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    <span>{mat}</span>
                    {selectedMaterial === mat && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity selector & CTA buttons */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 pt-3 pb-6 px-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] lg:shadow-none lg:px-0 backdrop-blur-md border-t border-slate-100 dark:bg-zinc-950/95 dark:border-zinc-900 lg:static lg:border-t-0 lg:bg-transparent lg:p-0 lg:-mx-0 lg:backdrop-blur-none space-y-3 lg:space-y-4 lg:pt-2">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="flex items-center rounded border border-slate-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="rounded p-2 text-gray-500 hover:bg-gray-150 dark:text-zinc-400 dark:hover:bg-zinc-850"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center font-mono text-xs font-black text-slate-900 dark:text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="rounded p-2 text-gray-500 hover:bg-gray-150 dark:text-zinc-400 dark:hover:bg-zinc-850"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center space-x-2 rounded bg-[#2563eb] hover:bg-slate-900 py-3.5 text-xs font-bold uppercase text-white shadow-none transition-colors dark:text-white"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add To Cart</span>
              </button>

              {/* Wishlist toggle button */}
              <button
                onClick={() => toggleWishlist(selectedProduct)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded border transition-colors ${
                  isInWishlist(selectedProduct.id)
                    ? 'border-red-500 bg-blue-50 text-red-500 dark:bg-rose-955/20 dark:text-rose-450'
                    : 'border-slate-200 bg-white text-gray-400 hover:border-slate-400 dark:border-zinc-850 dark:bg-zinc-900/40 dark:text-zinc-500 dark:hover:text-zinc-400'
                }`}
                title={isInWishlist(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`h-4.5 w-4.5 ${isInWishlist(selectedProduct.id) ? 'fill-current text-red-500 dark:text-rose-450' : ''}`} />
              </button>
            </div>

            {/* Buy now direct path button */}
            <button
              onClick={handleBuyNow}
              className="w-full mt-2 flex items-center justify-center gap-1.5 rounded border-2 border-[#2563eb] bg-white py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900 hover:bg-[#2563eb] hover:text-white transition-colors dark:bg-zinc-950 dark:text-white"
            >
              <Lock className="h-3.5 w-3.5" />
              Secure Checkout
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-zinc-900">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Fast Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Buyer Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Customer Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Secure Payment</span>
              </div>
            </div>
          </div>

          {/* Accordion Specification sheets */}
          <div className="border-t border-gray-100 pt-4 dark:border-zinc-900">
            <div className="flex space-x-4 border-b border-gray-100 dark:border-zinc-900 mb-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors ${
                  activeTab === 'details' ? 'border-b-2 border-zinc-950 text-gray-900 dark:border-white dark:text-white' : 'text-gray-400 dark:text-zinc-550'
                }`}
              >
                Product Details
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`pb-2.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors ${
                  activeTab === 'features' ? 'border-b-2 border-zinc-950 text-gray-900 dark:border-white dark:text-white' : 'text-gray-400 dark:text-zinc-550'
                }`}
              >
                Certifications & Specs
              </button>
            </div>

            {activeTab === 'details' ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">
                {selectedProduct.description || 'Premium material composition engineered by the MORVEX design group. This item combines pure material structures with optimal user configuration.'}
              </p>
            ) : (
              <ul className="space-y-2 text-xs text-gray-400 dark:text-zinc-500 font-sans">
                {selectedProduct.features ? (
                  selectedProduct.features.map((feat, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Category: {selectedProduct.category}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Status: In Stock</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>100% Secure Checkout</span>
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>
        </div>

      </div>

      {/* Recommended Products: Complete the Look */}
      <section className="border-t border-gray-100 pt-10 dark:border-zinc-900">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Related from {selectedProduct.category}</span>
            <h3 className="mt-1 font-serif text-xl font-normal text-gray-950 dark:text-white">Frequently Bought Together</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(() => {
            const related = products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id);
            const others = products.filter(p => p.category !== selectedProduct.category && p.id !== selectedProduct.id);
            const combined = [...related, ...others].slice(0, 4);
            return combined.map((p) => (
              <div 
                key={p.id}
                onClick={() => handleRecommendClick(p)}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-3 hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/20 dark:hover:border-zinc-700"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-950">
                <img 
                  src={p.image} 
                  alt={p.name} 
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="mt-3 font-serif text-sm text-gray-800 dark:text-zinc-100 line-clamp-1">{p.name}</h4>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">${p.price.toFixed(2)}</span>
                <span className="font-mono text-[9px] text-gray-400 select-none group-hover:text-zinc-900 dark:group-hover:text-white">Inspect →</span>
              </div>
            </div>
            ));
          })()}
        </div>
      </section>

    </div>
  );
};
