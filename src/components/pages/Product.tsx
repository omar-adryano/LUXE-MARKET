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
  Lock,
  PlayCircle,
  Star,
  Package,
  AlertCircle,
  Share2
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { selectedProduct, addToCart, products, setSelectedProduct, setActiveView, toggleWishlist, isInWishlist } = useApp();
  
  // State variables for dynamic configurations
  const [activeThumbnail, setActiveThumbnail] = useState<string>(selectedProduct.videoUrl || selectedProduct.image);
  const [selectedColor, setSelectedColor] = useState<string>(selectedProduct.color || 'Default');
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    selectedProduct.materials && selectedProduct.materials.length > 0
      ? selectedProduct.materials[0]
      : 'Default'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [amount, setAmount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping' | 'reviews'>('description');

  // Shipping calculation state
  const [shippingCountry, setShippingCountry] = useState<string>('US');
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [estimatedDays, setEstimatedDays] = useState<string>('');
  const [isShippingLoading, setIsShippingLoading] = useState<boolean>(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Recalculate shipping whenever vid, country or quantity changes
  React.useEffect(() => {
    let active = true;
    const fetchShipping = async () => {
      if (!selectedProduct.vid) {
        setShippingCost(null);
        setEstimatedDays('');
        return;
      }
      setIsShippingLoading(true);
      try {
        setShippingError(null);
        const res = await fetch('/api/shipping/calculate-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vid: selectedProduct.vid,
            countryCode: shippingCountry,
            quantity: quantity,
            weight: selectedProduct.weight
          })
        });
        const data = await res.json();
        if (active) {
          if (data.error) {
             setShippingError(data.error);
             setShippingCost(null);
             setEstimatedDays('');
          } else {
             setShippingCost(data.shippingCost);
             setEstimatedDays(data.estimatedDays);
          }
        }
      } catch (e) {
        if (active) {
          console.error('Failed to calculate shipping', e);
          setShippingError('Failed to calculate shipping.');
        }
      } finally {
        if (active) setIsShippingLoading(false);
      }
    };
    
    // Debounce slightly to prevent spamming CJ API if user clicks + repeatedly
    const timeoutId = setTimeout(() => {
      fetchShipping();
    }, 500);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [selectedProduct.vid, selectedProduct.weight, shippingCountry, quantity]);

  // CJ Variants setup
  const cjVariants = selectedProduct.cjVariants || [];
  const hasVariants = cjVariants.length > 0;
  
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  
  // Dimensions extraction
  const dimensions: string[][] = [];
  if (hasVariants) {
      cjVariants.forEach(v => {
          const parts = (v.variantKey || '').split('-');
          parts.forEach((p, i) => {
              if (p) {
                  if (!dimensions[i]) dimensions[i] = [];
                  if (!dimensions[i].includes(p)) dimensions[i].push(p);
              }
          });
      });
  }
  const dimensionLabels = ['Color', 'Size', 'Style', 'Material', 'Type'];

  // Keep track of the resolved current variant
  const currentVariant = hasVariants ? cjVariants.find(v => v.variantKey === selectedParts.join('-')) || cjVariants.find(v => {
      const parts = (v.variantKey || '').split('-');
      // try to match as many as possible
      return parts[0] === selectedParts[0];
  }) || cjVariants[0] : null;

  const currentVariantImage = currentVariant?.variantImage;

  // Handle case where custom thumbnails don't exist
  let itemThumbnails = selectedProduct.videoUrl 
    ? [selectedProduct.videoUrl, ...(selectedProduct.thumbnails || [selectedProduct.image])]
    : (selectedProduct.thumbnails || [selectedProduct.image]);

  if (currentVariantImage) {
      if (!itemThumbnails.includes(currentVariantImage)) {
          itemThumbnails = [currentVariantImage, ...itemThumbnails];
      } else {
          // move to front
          itemThumbnails = [currentVariantImage, ...itemThumbnails.filter(t => t !== currentVariantImage)];
      }
  }

  // Recalculate thumbnail when selected product changed
  React.useEffect(() => {
    setActiveThumbnail(selectedProduct.videoUrl || currentVariantImage || selectedProduct.image);
    setSelectedColor(selectedProduct.color || 'Default');
    setSelectedMaterial(
      selectedProduct.materials && selectedProduct.materials.length > 0
        ? selectedProduct.materials[0]
        : 'Default'
    );
    setQuantity(1);
    setActiveTab('description');
    
    if (hasVariants && cjVariants[0]) {
        setSelectedParts((cjVariants[0].variantKey || '').split('-'));
    } else {
        setSelectedParts([]);
    }
  }, [selectedProduct, hasVariants]);

  // Update thumbnail when variant image changes
  React.useEffect(() => {
     if (currentVariantImage && activeThumbnail !== currentVariantImage && !selectedProduct.videoUrl) {
         setActiveThumbnail(currentVariantImage);
     } else if (currentVariantImage && selectedProduct.videoUrl && activeThumbnail !== selectedProduct.videoUrl && activeThumbnail !== currentVariantImage) {
         setActiveThumbnail(currentVariantImage);
     }
  }, [currentVariantImage]);

  const handlePartSelect = (dimIndex: number, val: string) => {
      const newParts = [...selectedParts];
      newParts[dimIndex] = val;
      
      // Try to find exact match
      const exactMatch = cjVariants.find(v => v.variantKey === newParts.join('-'));
      if (exactMatch) {
         setSelectedParts(newParts);
      } else {
         // Fallback: try to find a variant that has the newly selected part
         const partialMatch = cjVariants.find(v => {
            const p = (v.variantKey || '').split('-');
            return p[dimIndex] === val;
         });
         if (partialMatch) {
             setSelectedParts((partialMatch.variantKey || '').split('-'));
         } else {
             setSelectedParts(newParts); // just visually update if no logic match
         }
      }
  };

  const handleRecommendClick = (prod: Product) => {
    setSelectedProduct(prod);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity, hasVariants ? selectedParts.join(' / ') : selectedColor, selectedMaterial);
    setActiveView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, hasVariants ? selectedParts.join(' / ') : selectedColor, selectedMaterial);
  };

  return (
    <div id="product-detail-page" className="pb-24 lg:pb-16 font-sans">
      
      {/* Editorial Breadcrumbs */}
      <nav className="flex items-center space-x-2 font-mono text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-6 lg:mb-8">
        <button onClick={() => setActiveView('home')} className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-400 dark:text-zinc-600">{selectedProduct.category}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-900 dark:text-white font-semibold truncate max-w-[200px]">{selectedProduct.name}</span>
      </nav>

      {/* Main Core Showcase Columns */}
      <div className="grid grid-cols-1 gap-8 lg:gap-14 lg:grid-cols-12">
        
        {/* Gallery / Interactive Left Panels - 7 columns */}
        <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
          {/* Photo Deck / Thumbnail Strips */}
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-none w-full lg:w-24 shrink-0">
            {itemThumbnails.map((thumbUrl, idx) => {
              const isVideo = selectedProduct.videoUrl && thumbUrl === selectedProduct.videoUrl;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveThumbnail(thumbUrl)}
                  className={`relative flex items-center justify-center aspect-square flex-shrink-0 w-20 lg:w-full overflow-hidden rounded-xl border-2 transition-all ${
                    activeThumbnail === thumbUrl 
                      ? 'border-[#2563eb] shadow-sm' 
                      : 'border-transparent bg-slate-100 hover:border-slate-300 dark:bg-zinc-900 dark:hover:border-zinc-700'
                  }`}
                >
                  <img 
                    src={isVideo ? selectedProduct.image : thumbUrl} 
                    alt="thumbnail" 
                    className={`h-full w-full object-cover ${isVideo ? 'opacity-70' : ''}`} 
                    referrerPolicy="no-referrer"
                  />
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <PlayCircle className="h-6 w-6 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Visual Screen */}
          <div className="relative aspect-[4/5] lg:aspect-auto w-full flex-1 overflow-hidden rounded-2xl bg-slate-50 dark:bg-zinc-950 group border border-slate-100 dark:border-zinc-900">
            {selectedProduct.videoUrl && activeThumbnail === selectedProduct.videoUrl ? (
              <video 
                src={activeThumbnail} 
                controls
                autoPlay
                loop
                playsInline
                muted
                poster={selectedProduct.image}
                className="h-full w-full object-cover transition-all duration-300"
              />
            ) : (
              <img 
                src={activeThumbnail} 
                alt={selectedProduct.name} 
                className="h-full w-full object-cover transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            )}
            
            {/* Discount Percentage Floating badge */}
            {((selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price) || selectedProduct.discount) ? (
              <span className="absolute z-10 left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white tracking-wide shadow-sm">
                Save {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price
                  ? Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)
                  : selectedProduct.discount}%
              </span>
            ) : null}
            
            {/* Share / Wishlist Floating Actions */}
            <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
               <button
                  onClick={() => toggleWishlist(selectedProduct)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm ${
                    isInWishlist(selectedProduct.id)
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-white/80 text-gray-700 hover:bg-white hover:text-gray-900 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-900'
                  }`}
                  title={isInWishlist(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(selectedProduct.id) ? 'fill-current' : ''}`} />
               </button>
               <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm transition-all dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-900"
                >
                  <Share2 className="h-4 w-4" />
               </button>
            </div>
          </div>
        </div>

        {/* Configurations & Spec Panel Right - 5 columns */}
        <div className="lg:col-span-5 space-y-8 sticky top-24 self-start pb-10">
          
          {/* Header Info */}
          <div className="space-y-4">
            <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 font-mono text-[9px] uppercase tracking-widest text-[#2563eb] font-bold">
               {selectedProduct.category}
            </span>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
               {selectedProduct.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
               <div className="flex items-center gap-1.5">
                  <div className="flex text-[#2563eb]">
                     <Star className="h-4 w-4 fill-current" />
                     <Star className="h-4 w-4 fill-current" />
                     <Star className="h-4 w-4 fill-current" />
                     <Star className="h-4 w-4 fill-current" />
                     <Star className="h-4 w-4 fill-current" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedProduct.rating?.toFixed(1) || '4.9'}</span>
                  <span className="text-slate-500 dark:text-zinc-400">({selectedProduct.numReviews || 128} Reviews)</span>
               </div>
               <div className="h-4 w-px bg-slate-300 dark:bg-zinc-700 hidden sm:block"></div>
               <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 text-sm">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Over 1,000+ Sold</span>
               </div>
            </div>
          </div>

          {/* Pricing area */}
          <div className="flex items-center flex-wrap gap-3 pb-6 border-b border-slate-100 dark:border-zinc-900">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">${selectedProduct.price.toFixed(2)}</span>
            {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
              <>
                <span className="text-lg text-slate-400 line-through font-medium dark:text-zinc-500">${selectedProduct.originalPrice.toFixed(2)}</span>
                <span className="rounded bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  Save ${(selectedProduct.originalPrice - selectedProduct.price).toFixed(2)}
                </span>
              </>
            )}
          </div>

          {/* Dynamic Variant Configs */}
          <div className="space-y-6">
            {hasVariants ? (
              dimensions.map((dimValues, dimIndex) => (
                <div key={dimIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                     <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                        {dimensionLabels[dimIndex] || `Option ${dimIndex + 1}`}: <span className="text-slate-500 font-normal ml-1">{selectedParts[dimIndex]}</span>
                     </h4>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {dimValues.map((val, i) => {
                      const isSelected = selectedParts[dimIndex] === val;
                      return (
                        <button
                          key={i}
                          onClick={() => handlePartSelect(dimIndex, val)}
                          className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-2 border-[#2563eb] bg-blue-50 text-[#2563eb] dark:border-[#2563eb] dark:bg-[#2563eb]/10 dark:text-white'
                              : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          {val}
                          {isSelected && (
                             <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563eb] text-white">
                                <Check className="h-2.5 w-2.5" />
                             </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Fallback Color */}
                {selectedProduct.colors && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white">Color: <span className="text-slate-500 font-normal ml-1">{selectedColor}</span></h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedProduct.colors.map((colHex, i) => {
                        const names = ['Arctic Silk', 'Matte Carbon', 'Muted Brass'];
                        const name = names[i] || 'Choice';
                        const isSelected = selectedColor === name;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedColor(name)}
                            className={`h-10 w-10 rounded-full border-2 transition-all ring-offset-2 dark:ring-offset-zinc-950 ${
                              isSelected ? 'border-white ring-2 ring-[#2563eb] scale-110' : 'border-slate-200 hover:scale-105'
                            }`}
                            style={{ backgroundColor: colHex }}
                            title={name}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback Material */}
                {selectedProduct.materials && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white">Material</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedProduct.materials.map((mat, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedMaterial(mat)}
                          className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all ${
                            selectedMaterial === mat
                              ? 'border-[#2563eb] bg-blue-50 text-[#2563eb] dark:border-[#2563eb] dark:bg-[#2563eb]/10 dark:text-white'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          <span>{mat}</span>
                          {selectedMaterial === mat && <Check className="h-5 w-5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-slate-900 dark:text-white">Quantity</h4>
            <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900 w-fit shrink-0">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-semibold text-slate-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => prev + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Shipping Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden dark:bg-zinc-900/40 dark:border-zinc-800">
            <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200 flex items-center justify-between dark:bg-zinc-900/80 dark:border-zinc-800">
               <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium text-sm">
                  <Package className="h-4 w-4 text-[#2563eb]" />
                  Shipping Information
               </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-zinc-800">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Destination</label>
                  <select 
                    value={shippingCountry} 
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-shadow dark:border-zinc-700 dark:bg-zinc-900 dark:text-white appearance-none"
                  >
                    <option value="US">🇺🇸 United States</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="FR">🇫🇷 France</option>
                  </select>
                </div>
                <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-1 flex-1 sm:text-right">
                   {selectedProduct.weight ? (
                     <>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">Unit Weight: {selectedProduct.weight}g</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Total: {selectedProduct.weight * quantity}g</span>
                     </>
                   ) : (
                     <span className="text-sm text-slate-500 dark:text-zinc-400">Weight: N/A</span>
                   )}
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <span className="block text-xs font-medium text-slate-500 dark:text-zinc-400">Estimated Delivery</span>
                  {isShippingLoading ? (
                    <div className="h-5 w-24 bg-slate-200 animate-pulse rounded dark:bg-zinc-800"></div>
                  ) : shippingError ? (
                    <span className="text-sm font-medium text-red-500 flex items-center gap-1.5"><AlertCircle className="h-4 w-4"/> Unavailable</span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                       <Truck className="h-4 w-4 text-slate-400" />
                       {estimatedDays ? `${estimatedDays} Days` : 'Calculated at checkout'}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <span className="block text-xs font-medium text-slate-500 dark:text-zinc-400">Shipping Cost</span>
                  {isShippingLoading ? (
                    <div className="h-6 w-16 bg-slate-200 animate-pulse rounded dark:bg-zinc-800 ml-auto"></div>
                  ) : shippingError ? (
                    <span className="text-sm font-medium text-slate-400">—</span>
                  ) : (
                    <span className={`text-lg font-bold ${shippingCost === null ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {shippingCost === null ? 'Free' : shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Purchase CTA buttons */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 p-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] lg:shadow-none lg:p-0 backdrop-blur-md border-t border-slate-200 dark:bg-zinc-950/95 dark:border-zinc-900 lg:static lg:border-t-0 lg:bg-transparent lg:backdrop-blur-none flex gap-3">
             <button
               onClick={handleAddToCart}
               className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#2563eb] bg-white hover:bg-[#2563eb] transition-colors py-4 text-sm font-bold text-[#2563eb] hover:text-white shadow-sm dark:bg-transparent dark:text-white dark:hover:bg-[#2563eb] dark:border-[#2563eb]"
             >
               <ShoppingBag className="h-5 w-5" />
               Add To Cart
             </button>
             <button
               onClick={handleBuyNow}
               className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 transition-colors py-4 text-sm font-bold text-white shadow-sm"
             >
               Buy Now
             </button>
          </div>

          {/* Premium Trust Badges */}
          <div className="pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center text-center gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-zinc-900/50 dark:border-zinc-800">
                <Lock className="h-5 w-5 text-slate-700 dark:text-zinc-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-zinc-900/50 dark:border-zinc-800">
                <ShieldCheck className="h-5 w-5 text-slate-700 dark:text-zinc-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Buyer Protection</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-zinc-900/50 dark:border-zinc-800">
                <Truck className="h-5 w-5 text-slate-700 dark:text-zinc-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-zinc-900/50 dark:border-zinc-800">
                <Check className="h-5 w-5 text-slate-700 dark:text-zinc-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Order Tracking</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Product Content Tabs */}
      <div className="mt-16 lg:mt-24">
        <div className="border-b border-slate-200 dark:border-zinc-800 flex overflow-x-auto scrollbar-none">
          <div className="flex space-x-8 px-2 mx-auto">
             <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors relative ${
                  activeTab === 'description' ? 'text-[#2563eb] dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Description
                {activeTab === 'description' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] dark:bg-white rounded-t-full"></span>
                )}
             </button>
             <button
                onClick={() => setActiveTab('specifications')}
                className={`pb-4 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors relative ${
                  activeTab === 'specifications' ? 'text-[#2563eb] dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Specifications
                {activeTab === 'specifications' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] dark:bg-white rounded-t-full"></span>
                )}
             </button>
             <button
                onClick={() => setActiveTab('shipping')}
                className={`pb-4 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors relative ${
                  activeTab === 'shipping' ? 'text-[#2563eb] dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Shipping & Returns
                {activeTab === 'shipping' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] dark:bg-white rounded-t-full"></span>
                )}
             </button>
             <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors relative flex items-center gap-2 ${
                  activeTab === 'reviews' ? 'text-[#2563eb] dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Reviews 
                <span className="bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 py-0.5 px-2 rounded-full text-xs">{selectedProduct.numReviews || 128}</span>
                {activeTab === 'reviews' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] dark:bg-white rounded-t-full"></span>
                )}
             </button>
          </div>
        </div>

        <div className="py-8 max-w-4xl mx-auto">
          {activeTab === 'description' && (
             <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-zinc-400">
               <p>{selectedProduct.description || 'Elevate your lifestyle with this meticulously crafted item. Designed for premium durability and aesthetic brilliance, it seamlessly integrates into modern workflows. Experience maximum comfort and uncompromised build quality.'}</p>
             </div>
          )}
          {activeTab === 'specifications' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                {selectedProduct.features && selectedProduct.features.length > 0 ? (
                  selectedProduct.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                       <Check className="h-5 w-5 text-[#2563eb] shrink-0 mt-0.5" />
                       <span className="text-slate-700 dark:text-zinc-300">{feat}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                       <span className="text-slate-500 dark:text-zinc-400">Category</span>
                       <span className="font-medium text-slate-900 dark:text-white">{selectedProduct.category}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                       <span className="text-slate-500 dark:text-zinc-400">Availability</span>
                       <span className="font-medium text-emerald-600 dark:text-emerald-400">In Stock</span>
                    </div>
                    {selectedProduct.weight && (
                      <div className="flex justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                         <span className="text-slate-500 dark:text-zinc-400">Weight</span>
                         <span className="font-medium text-slate-900 dark:text-white">{selectedProduct.weight}g</span>
                      </div>
                    )}
                  </>
                )}
             </div>
          )}
          {activeTab === 'shipping' && (
             <div className="space-y-6 text-slate-600 dark:text-zinc-400">
                <div className="flex items-start gap-4">
                   <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-full shrink-0">
                      <Truck className="h-6 w-6 text-slate-700 dark:text-zinc-300" />
                   </div>
                   <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Global Shipping</h4>
                      <p className="leading-relaxed">We offer worldwide shipping via major carriers. Delivery times typically range from 5 to 15 business days depending on your region and the specific fulfillment center processing your order.</p>
                   </div>
                </div>
                <div className="flex items-start gap-4">
                   <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-full shrink-0">
                      <ShieldCheck className="h-6 w-6 text-slate-700 dark:text-zinc-300" />
                   </div>
                   <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">30-Day Returns</h4>
                      <p className="leading-relaxed">Not completely satisfied? Return your order within 30 days of delivery for a full refund or exchange. Items must be in their original condition and packaging.</p>
                   </div>
                </div>
             </div>
          )}
          {activeTab === 'reviews' && (
             <div className="text-center py-12">
                <div className="inline-flex text-amber-500 mb-4">
                   <Star className="h-8 w-8 fill-current" />
                   <Star className="h-8 w-8 fill-current" />
                   <Star className="h-8 w-8 fill-current" />
                   <Star className="h-8 w-8 fill-current" />
                   <Star className="h-8 w-8 fill-current" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{selectedProduct.rating?.toFixed(1) || '4.9'} out of 5 stars</h3>
                <p className="text-slate-500 dark:text-zinc-400 mb-6">Based on {selectedProduct.numReviews || 128} verified purchases</p>
                <div className="max-w-2xl mx-auto space-y-6">
                   {/* Mock Reviews */}
                   {[1, 2, 3].map((_, idx) => (
                     <div key={idx} className="text-left bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-slate-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-zinc-400">
                                 {['JS', 'AM', 'RK'][idx]}
                              </div>
                              <div>
                                 <p className="font-semibold text-slate-900 dark:text-white">{['James Smith', 'Amanda M.', 'Robert K.'][idx]}</p>
                                 <div className="flex text-amber-500 mt-0.5">
                                    <Star className="h-3 w-3 fill-current" />
                                    <Star className="h-3 w-3 fill-current" />
                                    <Star className="h-3 w-3 fill-current" />
                                    <Star className="h-3 w-3 fill-current" />
                                    <Star className="h-3 w-3 fill-current" />
                                 </div>
                              </div>
                           </div>
                           <span className="text-xs text-slate-400 dark:text-zinc-500">2 weeks ago</span>
                        </div>
                        <p className="text-slate-600 dark:text-zinc-300">{[
                          "Absolutely love this. The quality exceeded my expectations and it arrived much faster than anticipated. Highly recommend!",
                          "Perfect fit and finish. I was hesitant at first but viewing the video really helped. The shipping was seamless.",
                          "Great product, does exactly what it says. Packaging was secure and the item was pristine upon arrival."
                        ][idx]}</p>
                     </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Recommended Products: Complete the Look */}
      <section className="mt-16 lg:mt-20 border-t border-slate-200 pt-16 dark:border-zinc-800">
        <div className="text-center mb-10">
          <h3 className="font-sans text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-3">You May Also Like</h3>
          <p className="text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">Explore handpicked recommendations tailored to your style and preferences.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {(() => {
            const related = products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id);
            const others = products.filter(p => p.category !== selectedProduct.category && p.id !== selectedProduct.id);
            const combined = [...related, ...others].slice(0, 4);
            return combined.map((p) => (
              <div 
                key={p.id}
                onClick={() => handleRecommendClick(p)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-50 dark:bg-zinc-950 mb-4 border border-slate-100 dark:border-zinc-900">
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <button className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-white text-slate-900 w-11/12 py-3 rounded-xl font-bold text-sm shadow-lg border border-slate-100 cursor-pointer dark:bg-zinc-900 dark:text-white dark:border-zinc-800">
                     Quick View
                  </button>
                </div>
                <div className="flex flex-col flex-1">
                  <h4 className="font-medium text-sm lg:text-base text-slate-900 dark:text-white line-clamp-1 mb-1">{p.name}</h4>
                  <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400 mb-2 gap-1 relative z-0">
                     <div className="flex text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                     </div>
                     <span>{p.rating?.toFixed(1) || '4.9'}</span>
                     <span className="px-1 text-slate-300 dark:text-zinc-700">&bull;</span>
                     <span>{p.category}</span>
                  </div>
                  <div className="mt-auto pt-1 flex items-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">${p.price.toFixed(2)}</span>
                    {p.originalPrice && p.originalPrice > p.price && (
                       <span className="ml-2 text-xs text-slate-400 line-through">${p.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </section>

    </div>
  );
};
