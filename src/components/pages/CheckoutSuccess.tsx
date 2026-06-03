import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Check, 
  Package, 
  Compass, 
  Loader2, 
  AlertTriangle,
  CreditCard,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface VerifiedOrderDetails {
  id: string;
  total: number;
  paymentMethod: string;
  stripePaymentIntentId?: string;
  stripeTransactionId?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export const CheckoutSuccess: React.FC = () => {
  const { clearCart, fetchMyOrders, setActiveView } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<VerifiedOrderDetails | null>(null);

  useEffect(() => {
    const fn = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setError('Missing transaction session identifier.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          let errorMessage = 'Payment verification could not be validated.';
          if (response.status === 429) {
            errorMessage = 'Verification rate limit exceeded. Please wait a moment and reload.';
          } else {
            try {
              const text = await response.text();
              if (text && (text.includes('Rate exceeded') || text.includes('Too Many Requests') || text.includes('rate limit'))) {
                errorMessage = 'Verification rate limit exceeded. Please wait a moment and reload.';
              } else if (text) {
                errorMessage = text.substring(0, 150);
              }
            } catch (err) {}
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonErr) {
          setError('Verification ledger check failed to parse. Connection diagnostic failure.');
          setLoading(false);
          return;
        }
        
        if (data && data.success && data.order) {
          const ord = data.order;
          setVerifiedOrder({
            id: ord._id || ord.id,
            total: ord.total,
            paymentMethod: ord.paymentMethod || 'Stripe Credit Card',
            stripePaymentIntentId: ord.stripePaymentIntentId,
            stripeTransactionId: ord.stripeTransactionId,
            shippingAddress: ord.shippingAddress,
          });
          
          // Successful checkout complete: clear cart & refresh orders
          clearCart();
          await fetchMyOrders();
        } else {
          setError(data ? data.message : 'Payment verification could not be validated.');
        }
      } catch (err) {
        console.error(err);
        setError('Connection diagnostic failure. Unable to contact verification servers.');
      } finally {
        setLoading(false);
      }
    };
    
    fn();
  }, []);

  const handleGoToDashboard = () => {
    setActiveView('user-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToExplore = () => {
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="checkout-success-page" className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      
      {/* Visual Title Header */}
      <div className="text-center">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#ff4747] font-bold">Secure transaction carriage complete</span>
        <h2 className="mt-1 font-serif text-3xl font-normal text-gray-950 dark:text-white">Secure Purchase Carriage Receipt</h2>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-gray-150 bg-white p-12 text-center dark:border-zinc-900 dark:bg-zinc-950/20 shadow-xl flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 text-[#ff4747] animate-spin" />
          <h3 className="font-serif text-lg text-gray-950 dark:text-white">Securing Transaction Verification</h3>
          <p className="font-mono text-xs text-zinc-500 max-w-sm">
            Retransmitting and auditing checkout credentials with the Stripe central ledger...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-155 bg-rose-50/20 p-8 text-center dark:border-red-950/20 dark:bg-zinc-950/20 shadow-lg flex flex-col items-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-[#ff4747]" />
          <h3 className="font-serif text-xl font-semibold text-gray-950 dark:text-white">Verification Auditing Dropped</h3>
          <p className="font-mono text-xs text-[#ff4747] max-w-md bg-[#ff4747]/10 p-2.5 rounded-lg border border-[#ff4747]/20">
            {error}
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm leading-relaxed">
            Please verify your network link or view your account dashboard to check if payment was updated.
          </p>
          <div className="flex gap-4 pt-2">
            <button
              onClick={handleGoToDashboard}
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 cursor-pointer"
            >
              Verify Inside Dashboard
            </button>
            <button
              onClick={handleReturnToExplore}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-900 hover:bg-gray-50 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white cursor-pointer"
            >
              Back to Gallery Catalogue
            </button>
          </div>
        </div>
      ) : verifiedOrder ? (
        <div className="rounded-3xl border border-gray-150 bg-white p-8 dark:border-zinc-900 dark:bg-zinc-950/20 shadow-2xl space-y-8">
          
          <div className="flex flex-col items-center gap-4 text-center border-b border-gray-100 pb-6 dark:border-zinc-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-900">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-gray-950 dark:text-white">Secure Purchase Audited</h3>
              <p className="mt-1 font-mono text-[10px] text-zinc-400">LEDGER TRANSACTION SECURED</p>
            </div>
          </div>

          {/* Checkout transaction details metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100 dark:border-zinc-900">
            <div className="space-y-4">
              <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Atelier Carriage Receipt</span>
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-dashed border-gray-105 pb-1 dark:border-zinc-900">
                  <span className="text-zinc-400">Order System No:</span>
                  <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{verifiedOrder.id}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-105 pb-1 dark:border-zinc-900">
                  <span className="text-zinc-400">Total Charged:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-sans text-xs">${verifiedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-105 pb-1 dark:border-zinc-900">
                  <span className="text-zinc-400">Validation Mode:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">Stripe Checkout</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Stripe Ledger Audits</span>
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-dashed border-gray-105 pb-1 dark:border-zinc-900">
                  <span className="text-zinc-400">Stripe Payment Intent ID:</span>
                  <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[150px]" title={verifiedOrder.stripePaymentIntentId}>
                    {verifiedOrder.stripePaymentIntentId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-105 pb-1 dark:border-zinc-900">
                  <span className="text-zinc-400">Stripe Transaction ID:</span>
                  <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[150px]" title={verifiedOrder.stripeTransactionId}>
                    {verifiedOrder.stripeTransactionId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-105 pb-1 dark:border-zinc-900">
                  <span className="text-zinc-400">Secured Transfer:</span>
                  <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Checked
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address Review */}
          {verifiedOrder.shippingAddress && (
            <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-850 space-y-2">
              <h4 className="font-serif text-xs font-semibold text-gray-900 dark:text-zinc-100">Delivery Carriage Destination</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-mono">
                {verifiedOrder.shippingAddress.fullName}<br />
                {verifiedOrder.shippingAddress.street}<br />
                {verifiedOrder.shippingAddress.city}, {verifiedOrder.shippingAddress.state} {verifiedOrder.shippingAddress.zipCode}<br />
                {verifiedOrder.shippingAddress.country}
              </p>
            </div>
          )}

          {/* Navigation Action Triggers */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={handleGoToDashboard}
              className="flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 px-6 py-3 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 transition-colors cursor-pointer"
            >
              <Package className="h-4.5 w-4.5" />
              <span>Track Orders Inside Dashboard</span>
            </button>
            <button
              onClick={handleReturnToExplore}
              className="flex items-center justify-center space-x-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-xs font-semibold text-zinc-900 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-colors cursor-pointer"
            >
              <Compass className="h-4.5 w-4.5" />
              <span>Return to Galleries Catalogue</span>
            </button>
          </div>

        </div>
      ) : null}

    </div>
  );
};
