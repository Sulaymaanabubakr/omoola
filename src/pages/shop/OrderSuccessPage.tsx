import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, MessageCircle, ShoppingBag, Home } from 'lucide-react';

interface LocationState {
  orderId: string;
  waLink: string;
  customerName: string;
}

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  useEffect(() => {
    if (!state?.orderId) {
      navigate('/', { replace: true });
      return;
    }
    // Auto-open WhatsApp
    const timer = setTimeout(() => {
      if (state.waLink) window.open(state.waLink, '_blank');
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigate, state?.orderId, state?.waLink]);

  if (!state?.orderId) return null;

  return (
    <div className="container-app py-20 flex flex-col items-center text-center gap-8 page-enter max-w-lg mx-auto">
      {/* Success icon */}
      <div className="relative">
        <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-brand-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
      </div>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
          Order Placed! 🎉
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Thank you, <span className="font-semibold text-foreground">{state.customerName}</span>! 
          Your order has been received. We're opening WhatsApp so you can confirm with our team.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 w-full text-left">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Order Reference</p>
        <p className="font-mono text-sm font-semibold text-foreground truncate">{state.orderId}</p>
      </div>

      <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-5 w-full">
        <p className="text-sm font-semibold text-[#166534] mb-1">What happens next?</p>
        <ol className="text-xs text-[#16a34a] space-y-1.5 text-left list-none">
          <li className="flex items-start gap-2"><span className="font-bold shrink-0">1.</span> WhatsApp opens automatically with your order details.</li>
          <li className="flex items-start gap-2"><span className="font-bold shrink-0">2.</span> Our team confirms your order and delivery fee.</li>
          <li className="flex items-start gap-2"><span className="font-bold shrink-0">3.</span> We deliver your items promptly.</li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <a
          href={state.waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#20b558] transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Open WhatsApp
        </a>
        <Link
          to="/products"
          className="flex-1 flex items-center justify-center gap-2 bg-card border border-border py-4 rounded-2xl font-semibold text-sm hover:bg-muted transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>

      <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
