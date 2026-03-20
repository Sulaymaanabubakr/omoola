import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ShoppingBag, User, Phone, MapPin, FileText } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/services/orders';
import { formatPrice, generateWhatsAppMessage, getImagePlaceholder } from '@/utils';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const total = totalPrice();

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container-app py-20 flex flex-col items-center gap-6 text-center page-enter">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground text-sm">Add products before checking out.</p>
        </div>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.customerName.trim()) errs.customerName = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^(\+?234|0)[789]\d{9}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = 'Enter a valid Nigerian phone number';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const orderId = await createOrder(
        form.customerName.trim(),
        form.phone.trim(),
        items,
        form.address.trim(),
        form.notes.trim()
      );

      const waLink = generateWhatsAppMessage(
        items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        form.customerName,
        form.phone,
        form.address,
        form.notes
      );

      clearCart();
      navigate('/order-success', { state: { orderId, waLink, customerName: form.customerName } });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => { const n = { ...er }; delete n[field]; return n; });
  };

  return (
    <div className="container-app py-8 page-enter">
      <div className="mb-8">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>
        <h1 className="section-title">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Customer details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                Customer Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={form.customerName}
                    onChange={set('customerName')}
                    placeholder="e.g. Adebayo Okafor"
                    className={cn('input-field', errors.customerName && 'border-destructive ring-1 ring-destructive')}
                  />
                  {errors.customerName && <p className="text-destructive text-xs mt-1">{errors.customerName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Phone Number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="08012345678"
                      className={cn('input-field pl-10', errors.phone && 'border-destructive ring-1 ring-destructive')}
                    />
                  </div>
                  {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium mb-1.5">
                  Delivery Address <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.address}
                    onChange={set('address')}
                    placeholder="Enter your delivery address"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium mb-1.5">
                  Order Notes <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                  <textarea
                    value={form.notes}
                    onChange={set('notes')}
                    placeholder="Any special instructions..."
                    rows={3}
                    className="input-field pl-10 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Order items preview */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-600" />
                Your Items ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <img
                      src={item.imageUrl || getImagePlaceholder(item.name)}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover bg-muted shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-sm shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary & submit */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-5">Order Total</h2>

              <div className="space-y-2 mb-4">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate flex-1 mr-2">
                      {item.name} ×{item.quantity}
                    </span>
                    <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 mb-1">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">Subtotal</span>
                  <span className="font-bold">{formatPrice(total)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                + Delivery fee confirmed via WhatsApp
              </p>

              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#166534] leading-relaxed">
                    After placing your order, you'll be redirected to <strong>WhatsApp</strong> to confirm with our team.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all duration-200',
                  submitting
                    ? 'bg-brand-300 cursor-not-allowed text-white'
                    : 'bg-brand-700 text-white hover:bg-brand-800 hover:shadow-lg active:scale-[0.99]'
                )}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Place Order & Chat on WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
