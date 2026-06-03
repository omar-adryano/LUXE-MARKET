import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  XCircle, 
  ArrowLeft,
  ShoppingBag,
  Compass
} from 'lucide-react';

export const CheckoutCancel: React.FC = () => {
  const { setActiveView } = useApp();

  const handleReturnToCheckout = () => {
    setActiveView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToExplore = () => {
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="checkout-cancel-page" className="max-w-2xl mx-auto py-16 px-4 space-y-6 text-center">
      
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-[#ff4747] dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200 dark:border-rose-900 shadow-sm animate-fade-in">
        <XCircle className="h-9 w-9 animate-pulse" />
      </div>

      <div className="space-y-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-[#ff4747] font-bold">Transaction Aborted</span>
        <h2 className="font-serif text-2xl font-normal text-gray-950 dark:text-white">Secure Payment Suspended</h2>
        <p className="mt-4 text-xs text-gray-400 dark:text-zinc-550 leading-relaxed max-w-md mx-auto font-mono">
          Your credit validation and bank transfer was suspended. No funds have been transferred. Your items remain fully configured and preserved inside your boutique shopping basket.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 max-w-sm mx-auto">
        <button
          onClick={handleReturnToCheckout}
          className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 px-5 py-3 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Resume Checkout Profile</span>
        </button>
        <button
          onClick={handleReturnToExplore}
          className="flex-1 flex items-center justify-center space-x-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-semibold text-zinc-900 hover:bg-gray-50 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white transition-colors cursor-pointer"
        >
          <Compass className="h-4 w-4" />
          <span>Showrooms Catalog</span>
        </button>
      </div>

    </div>
  );
};
