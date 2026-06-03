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
  Heart
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { selectedProduct, addToCart, recommendedProducts, setSelectedProduct, setActiveView, toggleWishlist, isInWishlist } = useApp();
  
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
    <div id="product-detail-page" className="space-y-12">
      
      {/* Editorial Breadcrumbs */}
      <nav className="flex items-center space-x-2 font-mono text-[10px] text-gray-400 dark:text-zinc-550 uppercase tracking-widest">
        <button onClick={() => setActiveView('home')} className="hover:text-gray-900 dark:hover:text-white">Home</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 dark:text-zinc-700">{selectedProduct.category}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-900 dark:text-white font-semibold">{selectedProduct.name}</span>
      </nav>

      {/* Main Core Showcase Columns */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 font-sans">
        
        {/* Gallery / Interactive Left Panels - 7 columns */}
        <div className="space-y-4 lg:col-span-7">
          {/* Main Visual Screen */}
          <div className="relative aspect-square w-full overflow-hidden rounded border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950">
            <img 
              src={activeThumbnail} 
              alt={selectedProduct.name} 
              className="h-full w-full object-cover transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            
            {/* Discount Percentage Floating badge */}
            {selectedProduct.discount && (
              <span className="absolute left-6 top-6 rounded bg-[#ff4747] px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
                SAVE {selectedProduct.discount}%
              </span>
            )}
          </div>

          {/* Photo Deck / Thumbnail Strips */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {itemThumbnails.map((thumbUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveThumbnail(thumbUrl)}
                className={`relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded border transition-all ${
                  activeThumbnail === thumbUrl 
                    ? 'border-[#ff4747]' 
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

        {/* Configurations & Spec Panel Right - 5 columns */}
        <div className="space-y-6 lg:col-span-5">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#ff4747] font-black">{selectedProduct.category} Selection</span>
            <h1 className="mt-1 font-sans text-3xl font-black uppercase leading-tight tracking-tight text-slate-900 dark:text-white">{selectedProduct.name}</h1>
            
            {/* Rating Stars Mock */}
            <div className="mt-3 flex items-center space-x-2">
              <div className="flex space-x-0.5 text-yellow-500">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">4.9 • 86 certified reviews</span>
            </div>
          </div>

          {/* Pricing structures */}
          <div className="rounded border border-slate-200 bg-slate-50 p-5 dark:bg-zinc-900/40 dark:border-zinc-800">
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-black text-slate-900 dark:text-white">${selectedProduct.price.toFixed(2)}</span>
              {selectedProduct.originalPrice && (
                <>
                  <span className="text-sm text-slate-400 line-through font-mono dark:text-zinc-600">${selectedProduct.originalPrice.toFixed(2)}</span>
                  <span className="font-mono text-xs text-[#ff4747] font-black">
                    (Save ${(selectedProduct.originalPrice - selectedProduct.price).toFixed(2)})
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-400 dark:text-zinc-550 leading-relaxed font-mono uppercase font-bold">Duty-free and ready for fast delivery package tracking privileges.</p>
          </div>

          {/* Color configs */}
          {selectedProduct.colors && (
            <div className="space-y-3">
              <h4 className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold">FRAME METAL ACCENT: <span className="text-[#ff4747] font-black">{selectedColor}</span></h4>
              <div className="flex space-x-3">
                {selectedProduct.colors.map((colHex, i) => {
                  const names = ['Arctic Silk', 'Matte Carbon', 'Muted Brass'];
                  const name = names[i] || 'Choice';
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(name)}
                      className={`h-7 w-7 rounded-sm border-2 transition-all ${
                        selectedColor === name ? 'border-[#ff4747] scale-110' : 'border-slate-300 hover:border-[#ff4747]'
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
                        ? 'border-[#ff4747] bg-[#ff4747] text-white'
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
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-4">
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
                className="flex flex-1 items-center justify-center space-x-2 rounded bg-[#ff4747] hover:bg-slate-900 py-3.5 text-xs font-bold uppercase text-white shadow-none transition-colors dark:text-white"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add To Boutique Cart</span>
              </button>

              {/* Wishlist toggle button */}
              <button
                onClick={() => toggleWishlist(selectedProduct)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded border transition-colors ${
                  isInWishlist(selectedProduct.id)
                    ? 'border-red-500 bg-red-50 text-red-500 dark:bg-rose-955/20 dark:text-rose-450'
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
              className="w-full rounded border-2 border-[#ff4747] bg-white py-3.5 text-xs font-bold uppercase tracking-wider text-slate-900 hover:bg-[#ff4747] hover:text-white transition-colors dark:bg-zinc-950 dark:text-white"
            >
              Direct Secure Checkout
            </button>
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
                {selectedProduct.description || 'Premium material composition engineered by the Luxe design group. This item combines pure material structures with optimal user configuration.'}
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
                      <span>Certified GreenGuard Gold Air Quality Standards</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Architectural grade steel and components</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>30-Day home validation assurance guarantee</span>
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-zinc-900 text-center">
            <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50 dark:bg-zinc-900/10">
              <Truck className="h-4 w-4 text-zinc-500" />
              <span className="mt-1 text-[8px] font-mono uppercase text-gray-400">Free Courier</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50 dark:bg-zinc-900/10">
              <ShieldCheck className="h-4 w-4 text-zinc-500" />
              <span className="mt-1 text-[8px] font-mono uppercase text-gray-400">5-Year Warranty</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50 dark:bg-zinc-900/10">
              <Award className="h-4 w-4 text-zinc-500" />
              <span className="mt-1 text-[8px] font-mono uppercase text-gray-400">Original Design</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recommended Products: Complete the Look */}
      <section className="border-t border-gray-100 pt-10 dark:border-zinc-900">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Styling recommendations</span>
            <h3 className="mt-1 font-serif text-xl font-normal text-gray-950 dark:text-white">Complete the Atelier Look</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {recommendedProducts.map((p) => (
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
                <span className="text-xs font-semibold text-gray-900 dark:text-white">${p.price}</span>
                <span className="font-mono text-[9px] text-gray-400 select-none group-hover:text-zinc-900 dark:group-hover:text-white">Inspect →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
