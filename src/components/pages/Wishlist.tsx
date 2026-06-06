import React from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, ShoppingBag } from 'lucide-react';

export const Wishlist: React.FC = () => {
  const { wishlist, toggleWishlist, addToCart, setSelectedProduct, setActiveView } = useApp();

  return (
    <div className="mx-auto max-w-7xl pt-6 pb-24 font-sans px-4">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#2563eb] font-black">YOUR SELECTION</span>
          <h1 className="mt-1 font-sans text-3xl font-black uppercase leading-tight tracking-tight text-slate-900 dark:text-white">Customer Wishlist</h1>
        </div>
        <div className="mt-2 sm:mt-0">
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950/20">
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {wishlist.map(product => (
              <div 
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setActiveView('product');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-none transition-all duration-150 hover:border-[#2563eb] dark:border-zinc-850 dark:bg-zinc-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square w-full overflow-hidden rounded bg-slate-105 dark:bg-zinc-950">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-3xl bg-[#2563eb] text-white shadow-sm hover:bg-zinc-900 transition-colors cursor-pointer"
                      title="Remove from Wishlist"
                    >
                      <Heart className="h-3.5 w-3.5 fill-current text-white" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-550">{product.category}</span>
                    <h4 className="mt-0.5 font-sans text-xs font-black uppercase text-slate-900 dark:text-zinc-50 line-clamp-1 tracking-tight">{product.name}</h4>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">${product.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-900">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, 1);
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 rounded bg-[#2563eb] py-2 text-[10px] font-bold uppercase text-white hover:bg-slate-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-2">Your wishlist is empty</p>
            <p className="text-gray-400 font-sans text-xs max-w-sm mb-6">Save items you love to revisit them later. They'll be available across all your devices once signed in.</p>
            <button
              onClick={() => {
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded flex items-center gap-2 bg-[#2563eb] px-6 py-2.5 text-xs uppercase tracking-widest font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Explore Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
