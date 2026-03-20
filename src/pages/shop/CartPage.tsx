import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getImagePlaceholder } from '@/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore();
  const total = totalPrice();
  const count = totalItems();

  if (items.length === 0) {
    return (
      <div className="container-app py-20 flex flex-col items-center justify-center text-center gap-6 page-enter">
        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground">Add some products to get started.</p>
        </div>
        <Link to="/products" className="btn-primary flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-8 page-enter">
      <h1 className="section-title mb-2">Shopping Cart</h1>
      <p className="text-muted-foreground text-sm mb-8">
        {count} item{count !== 1 ? 's' : ''} in your cart
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div
              key={item.productId}
              className="bg-card border border-border rounded-2xl p-4 flex gap-4 animate-fade-in"
            >
              {/* Image */}
              <Link to={`/products/${item.productId}`} className="shrink-0">
                <img
                  src={item.imageUrl || getImagePlaceholder(item.name)}
                  alt={item.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-muted"
                  loading="lazy"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.productId}`}>
                  <h3 className="font-semibold text-sm sm:text-base hover:text-brand-700 transition-colors leading-snug mb-1 truncate">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-brand-700 font-bold mb-3">{formatPrice(item.price)}</p>

                <div className="flex items-center justify-between">
                  {/* Qty */}
                  <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-5">Order Summary</h2>

            <div className="space-y-3 mb-5">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate flex-1 mr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-bold text-brand-700">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Delivery fee to be confirmed on WhatsApp</p>
            </div>

            <Link
              to="/checkout"
              className="w-full btn-primary flex items-center justify-center gap-2 text-center"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/products"
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-4 block"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
