/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  ArrowRight, 
  ShoppingCart, 
  Star,
  Heart
} from 'lucide-react';

export const Home: React.FC = () => {
  const { products, setSelectedProduct, setActiveView, addToCart, toggleWishlist, isInWishlist } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Best Sellers', 'New Arrivals', 'Electronics', 'Phone Accessories', 'Smart Gadgets', 'Home & Kitchen', 'Beauty & Skincare', 'Fitness & Health', 'Pet Supplies', 'Office & Desk', 'Travel Accessories', 'Jewelry & Watches'];

  const activeProducts = products.filter(p => p.isArchived !== true && p.isPublished !== false);

  const bestSellers = activeProducts.slice(0, 8);
  const newArrivals = activeProducts.slice(8, 16);
  const electronicsPicks = activeProducts.filter(p => ['Electronics', 'Phone Accessories', 'Smart Gadgets'].includes(p.category)).slice(0, 8);
  const homeEssentials = activeProducts.filter(p => p.category === 'Home & Kitchen').slice(0, 8);
  const beautyTrends = activeProducts.filter(p => p.category === 'Beauty & Skincare').slice(0, 8);
  const fitnessFavorites = activeProducts.filter(p => p.category === 'Fitness & Health').slice(0, 8);
  const petSupplies = activeProducts.filter(p => p.category === 'Pet Supplies').slice(0, 8);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const ProductCarousel: React.FC<{ title: string, categoryName: string, products: Product[] }> = ({ title, categoryName, products }) => {
    if (!products || products.length === 0) return null;
    return (
      <section className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{title}</h2>
          <button 
            onClick={() => {
              setSelectedCategory(categoryName);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.slice(0, 5).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    );
  };

  return (
    <div id="home-page" className="pb-16 pt-4">
      
      {/* Category Navigation */}
      <div className="mb-8 overflow-x-auto whitespace-nowrap pb-4 scrollbar-none">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {selectedCategory === 'All' ? (
        <>
          <ProductCarousel title="Best Sellers" categoryName="Best Sellers" products={bestSellers} />
          <ProductCarousel title="New Arrivals" categoryName="New Arrivals" products={newArrivals} />
          <ProductCarousel title="Electronics" categoryName="Electronics" products={activeProducts.filter(p => p.category === 'Electronics').slice(0, 8)} />
          <ProductCarousel title="Phone Accessories" categoryName="Phone Accessories" products={activeProducts.filter(p => p.category === 'Phone Accessories').slice(0, 8)} />
          <ProductCarousel title="Smart Gadgets" categoryName="Smart Gadgets" products={activeProducts.filter(p => p.category === 'Smart Gadgets').slice(0, 8)} />
          <ProductCarousel title="Home & Kitchen" categoryName="Home & Kitchen" products={homeEssentials} />
          <ProductCarousel title="Beauty & Skincare" categoryName="Beauty & Skincare" products={beautyTrends} />
          <ProductCarousel title="Fitness & Health" categoryName="Fitness & Health" products={fitnessFavorites} />
          <ProductCarousel title="Pet Supplies" categoryName="Pet Supplies" products={petSupplies} />
        </>
      ) : (() => {
        const matchingProducts = activeProducts.filter(p => p.category === selectedCategory || (selectedCategory === 'Best Sellers' && bestSellers.includes(p)) || (selectedCategory === 'New Arrivals' && newArrivals.includes(p)));
        return (
        <section className="mt-4">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{selectedCategory}</h2>
            <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">{matchingProducts.length} Products</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {matchingProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
        );
      })()}
    </div>
  );
};
