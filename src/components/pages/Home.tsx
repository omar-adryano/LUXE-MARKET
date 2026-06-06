/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  ShoppingCart, 
  Star,
  Heart,
  Smartphone,
  Headphones,
  Cpu,
  Shirt,
  Sparkles,
  Home as HomeIcon,
  Activity,
  Dog
} from 'lucide-react';

export const Home: React.FC = () => {
  const { products, setSelectedProduct, setActiveView, addToCart, toggleWishlist, isInWishlist } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const activeProducts = products.filter(p => p.isArchived !== true && p.isPublished !== false);

  const bestSellers = activeProducts.slice(0, 10);
  const electronicsPicks = activeProducts.filter(p => p.category === 'Electronics').slice(0, 5);
  const smartGadgets = activeProducts.filter(p => p.category === 'Smart Gadgets').slice(0, 5);
  const fashionPicks = activeProducts.filter(p => p.category === 'Apparel & Fashion' || p.category === 'Fashion').slice(0, 5);
  const beautyTrends = activeProducts.filter(p => p.category === 'Beauty & Skincare').slice(0, 5);
  const homeEssentials = activeProducts.filter(p => p.category === 'Home & Kitchen').slice(0, 5);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      title: 'Global Super Sale',
      subtitle: 'Up to 50% off on premium items',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1550009158-9fdf6c8bea86?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      title: 'Tech Upgrade',
      subtitle: 'Discover the latest smart gadgets',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      title: 'Fashion Forward',
      subtitle: 'Elevate your wardrobe today',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const original = product.originalPrice || 0;
    const sale = product.price || 0;
    const hasDiscount = original > sale;
    const discountPercent = hasDiscount ? Math.round(((original - sale) / original) * 100) : 0;

    return (
      <div 
        onClick={() => handleProductClick(product)}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-zinc-950">
          <img 
            src={product.image} 
            alt={product.name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          
          {/* Discount Badge */}
          {hasDiscount ? (
            <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold tracking-wide text-white">
              {discountPercent}% OFF
            </span>
          ) : product.discount ? (
            <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold tracking-wide text-white">
              {product.discount}% OFF
            </span>
          ) : null}

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-colors hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900 ${
              isInWishlist(product.id) ? 'text-red-500' : 'text-slate-400 hover:text-blue-500 dark:text-zinc-400'
            }`}
            title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Details */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-zinc-100">{product.name}</h3>
          
          {/* Rating */}
          <div className="mt-1 flex items-center gap-1">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <span className="text-xs text-slate-500 dark:text-zinc-400">({Math.floor(Math.random() * 800) + 20})</span>
          </div>

          {/* Pricing */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white">${sale.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-sm tracking-tight text-slate-400 line-through dark:text-zinc-500">${original.toFixed(2)}</span>
            )}
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product, 1);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-yellow-500"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HorizontalScroller: React.FC<{ products: Product[] }> = ({ products }) => {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
        {products.map((p) => (
          <div key={p.id} className="min-w-[200px] max-w-[240px] sm:min-w-[240px] flex-none snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    );
  };

  const PromoBanner: React.FC<{ title: string, subtitle: string, image: string, height?: string, onClick?: () => void }> = ({ title, subtitle, image, height = 'h-48', onClick }) => (
    <div onClick={onClick} className={`relative w-full ${height} overflow-hidden rounded-xl my-8 group cursor-pointer`}>
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center px-8 sm:px-12">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/90 text-sm sm:text-base max-w-sm">{subtitle}</p>
        <button className="mt-4 w-fit bg-white text-slate-900 px-6 py-2 rounded-md font-bold text-sm hover:bg-slate-100 transition-colors">
          Shop Now
        </button>
      </div>
    </div>
  );

  const categories = [
    { name: 'Electronics', id: 'Electronics', icon: Headphones },
    { name: 'Phone Accs', id: 'Phone Accessories', icon: Smartphone },
    { name: 'Smart Gadgets', id: 'Smart Gadgets', icon: Cpu },
    { name: 'Fashion', id: 'Apparel & Fashion', icon: Shirt },
    { name: 'Beauty', id: 'Beauty & Skincare', icon: Sparkles },
    { name: 'Home', id: 'Home & Kitchen', icon: HomeIcon },
    { name: 'Fitness', id: 'Fitness & Health', icon: Activity },
    { name: 'Pet Supplies', id: 'Pet Supplies', icon: Dog },
  ];

  return (
    <div id="home-page" className="pb-16 -mt-8 bg-slate-100 dark:bg-zinc-950">
      
      {/* 1. Hero Banner Slider */}
      <div className="relative w-[100vw] left-1/2 -translate-x-1/2 h-[200px] sm:h-[260px] lg:h-[320px] overflow-hidden bg-slate-900 mb-8">
        {slides.map((slide, idx) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-4xl sm:text-6xl font-black text-white mb-4 drop-shadow-lg">{slide.title}</h2>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl drop-shadow-md">{slide.subtitle}</p>
            </div>
          </div>
        ))}
        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
          {slides.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${currentSlide === idx ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/80'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Category Icons Background Row */}
      <div className="bg-white dark:bg-zinc-900 w-[100vw] relative left-1/2 -translate-x-1/2 py-8 mb-10 shadow-sm z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} onClick={() => handleCategoryClick(cat.id)} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 border ${selectedCategory === cat.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800'}`}>
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${selectedCategory === cat.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`} />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium text-center ${selectedCategory === cat.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-zinc-200'}`}>{cat.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20">
        {selectedCategory === 'All' ? (
          <>
            {/* 3. Best Sellers Section */}
            {bestSellers.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4 mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Best Sellers</h2>
                </div>
                <HorizontalScroller products={bestSellers} />
              </section>
            )}

            {/* 4. Promotional Banner (Electronics) */}
            <PromoBanner 
              title="Upgrade Your Tech" 
              subtitle="Discover cutting-edge devices designed to elevate your everyday performance." 
              image="https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              onClick={() => handleCategoryClick('Electronics')}
            />

            {/* 5. Electronics Section */}
            {electronicsPicks.length > 0 && (
              <section className="mb-12 bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Discover Electronics</h2>
                  <button onClick={() => handleCategoryClick('Electronics')} className="text-sm font-medium text-blue-600 hover:underline">See all</button>
                </div>
                <HorizontalScroller products={electronicsPicks} />
              </section>
            )}

            {/* 6. Promotional Banner (Gadgets) */}
            <PromoBanner 
              title="Smart Living" 
              subtitle="Transform your home with connected, intelligent devices." 
              image="https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              onClick={() => handleCategoryClick('Smart Gadgets')}
            />

            {/* 7. Smart Gadgets Section */}
            {smartGadgets.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Smart Gadgets</h2>
                  <button onClick={() => handleCategoryClick('Smart Gadgets')} className="text-sm font-medium text-blue-600 hover:underline">See all</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {smartGadgets.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            )}

            {/* 8. Promotional Banner (Fashion) */}
            <PromoBanner 
              title="Style Redefined" 
              subtitle="Explore the latest trends in apparel and statement pieces." 
              image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              onClick={() => handleCategoryClick('Apparel & Fashion')}
            />

            {/* 9. Fashion Section */}
            {fashionPicks.length > 0 && (
              <section className="mb-12 bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Top in Fashion</h2>
                  <button onClick={() => handleCategoryClick('Apparel & Fashion')} className="text-sm font-medium text-blue-600 hover:underline">See all</button>
                </div>
                <HorizontalScroller products={fashionPicks} />
              </section>
            )}

            {/* 10. Promotional Banner (Beauty) */}
            <PromoBanner 
              title="Radiant Glow" 
              subtitle="Premium skincare and beauty products formulated for you." 
              image="https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              onClick={() => handleCategoryClick('Beauty & Skincare')}
            />

            {/* 11. Beauty & Skincare Section */}
            {beautyTrends.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Beauty & Skincare</h2>
                  <button onClick={() => handleCategoryClick('Beauty & Skincare')} className="text-sm font-medium text-blue-600 hover:underline">See all</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {beautyTrends.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            )}

            {/* 12. Promotional Banner (Home) */}
            <PromoBanner 
              title="Elevate Your Space" 
              subtitle="Curated essentials to make your house feel like home." 
              image="https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              onClick={() => handleCategoryClick('Home & Kitchen')}
            />

            {/* 13. Home & Kitchen Section */}
            {homeEssentials.length > 0 && (
              <section className="mb-12 bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Home & Kitchen</h2>
                  <button onClick={() => handleCategoryClick('Home & Kitchen')} className="text-sm font-medium text-blue-600 hover:underline">Explore all</button>
                </div>
                <HorizontalScroller products={homeEssentials} />
              </section>
            )}
          </>
        ) : (
          <section className="mt-4 mb-16 min-h-[400px]">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800 gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleCategoryClick('All')}
                  className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                >
                  ← Back
                </button>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{selectedCategory}</h2>
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                {activeProducts.filter(p => p.category === selectedCategory || (selectedCategory === 'Fashion' && p.category === 'Apparel & Fashion')).length} Products
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {activeProducts.filter(p => p.category === selectedCategory || (selectedCategory === 'Fashion' && p.category === 'Apparel & Fashion')).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

