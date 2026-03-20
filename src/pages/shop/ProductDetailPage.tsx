import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Star, Check, Share2,
  MessageCircle, Tag, Minus, Plus
} from 'lucide-react';
import { getProduct } from '@/services/products';
import { Product } from '@/types';
import { formatPrice, getImagePlaceholder } from '@/utils';
import { useCartStore } from '@/store/cartStore';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/shop/ProductCard';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { categories } = useCategories();
  const addItem = useCartStore(s => s.addItem);
  const cartItems = useCartStore(s => s.items);

  const cartItem = cartItems.find(i => i.productId === id);
  const category = categories.find(c => c.id === product?.categoryId);
  const outOfStock = product?.inStock === false;

  const { products: related } = useProducts({
    categoryId: product?.categoryId || undefined,
    limitCount: 4,
  });
  const relatedFiltered = related.filter(p => p.id !== id).slice(0, 4);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then(p => {
        if (p) setProduct(p);
        else navigate('/products');
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    if (outOfStock) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || getImagePlaceholder(product.name),
      });
    }
    setJustAdded(true);
    toast.success(`${quantity}x ${product.name} added to cart`);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  if (loading) {
    return (
      <div className="container-app py-10 page-enter">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square skeleton rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/3 rounded" />
            <div className="skeleton h-8 w-2/3 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-4/5 rounded" />
            <div className="skeleton h-10 w-1/3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const imgSrc = product.imageUrl || getImagePlaceholder(product.name);

  return (
    <div className="container-app py-8 page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
        {category && (
          <>
            <span>/</span>
            <Link to={`/products?category=${category.id}`} className="hover:text-foreground transition-colors">
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground truncate max-w-[150px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mb-16">
        {/* Image */}
        <div className="relative">
          <div className="aspect-square rounded-3xl overflow-hidden bg-muted border border-border">
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={imgSrc}
              alt={product.name}
              onLoad={() => setImgLoaded(true)}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          </div>
          {product.isFeatured && (
            <div className="absolute top-4 left-4">
              <span className="badge-featured flex items-center gap-1 shadow-md">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {category && (
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-3.5 h-3.5 text-brand-600" />
              <Link
                to={`/products?category=${category.id}`}
                className="badge-category hover:bg-brand-200 transition-colors"
              >
                {category.name}
              </Link>
            </div>
          )}

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            {product.name}
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-6 text-sm sm:text-base">
            {product.description}
          </p>

          <div className="flex items-baseline gap-2 mb-8">
            <span className="font-display text-4xl font-bold text-brand-700">
              {formatPrice(product.price)}
            </span>
            <span className="text-muted-foreground text-sm">per unit</span>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-3 bg-muted rounded-xl p-1">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={cn(
                'flex-1 min-w-[160px] flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all duration-300',
                outOfStock
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : justAdded
                  ? 'bg-brand-100 text-brand-700 border-2 border-brand-300'
                  : 'bg-brand-700 text-white hover:bg-brand-800 hover:shadow-lg'
              )}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                </>
              )}
            </button>

            <Link
              to="/cart"
              onClick={() => {
                if (!cartItem && !outOfStock) handleAddToCart();
              }}
              className={cn(
                'flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm transition-colors',
                outOfStock
                  ? 'bg-muted text-muted-foreground pointer-events-none'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              )}
            >
              Buy Now
            </Link>

            <button
              onClick={handleShare}
              className="w-14 h-14 flex items-center justify-center border border-border rounded-2xl hover:bg-muted transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Cart status */}
          {cartItem && (
            <p className="mt-4 text-sm text-brand-700 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {cartItem.quantity} in your cart
              <Link to="/cart" className="underline font-medium">View cart</Link>
            </p>
          )}

          {/* WhatsApp quick order */}
          <div className="mt-6 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-[#16a34a] shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-[#166534]">Order via WhatsApp</p>
              <p className="text-[#16a34a] text-xs mt-0.5">
                Add to cart and checkout, or{' '}
                <a
                  href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '2348000000000'}?text=${encodeURIComponent(`Hi! I'd like to order: ${product.name} x${quantity} (${formatPrice(product.price * quantity)})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  message us directly
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedFiltered.length > 0 && (
        <div>
          <h2 className="section-title mb-6">More from {category?.name || 'This Category'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedFiltered.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
