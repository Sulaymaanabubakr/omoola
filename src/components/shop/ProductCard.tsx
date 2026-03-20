import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice, getImagePlaceholder } from '@/utils';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore(s => s.addItem);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const outOfStock = product.inStock === false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    setAdding(true);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || getImagePlaceholder(product.name),
    });
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdding(false), 600);
  };

  const imgSrc = product.imageUrl || getImagePlaceholder(product.name);

  return (
    <div className="card-product group relative">
      {/* Featured badge */}
      {product.isFeatured && (
        <div className="absolute top-3 left-3 z-10">
          <span className="badge-featured flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            Featured
          </span>
        </div>
      )}

      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-square bg-muted">
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
            imgLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-brand-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="flex items-center gap-2 bg-white text-brand-800 text-xs font-semibold px-3 py-2 rounded-full shadow-lg">
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {product.categoryName && (
          <span className="badge-category mb-2 inline-block">{product.categoryName}</span>
        )}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 hover:text-brand-700 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-muted-foreground text-xs line-clamp-2 mb-3 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-lg font-bold text-brand-700">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={adding || outOfStock}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200',
              outOfStock
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : adding
                ? 'bg-brand-100 text-brand-700 scale-95'
                : 'bg-brand-700 text-white hover:bg-brand-800 hover:shadow-md active:scale-95'
            )}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {outOfStock ? 'Out of Stock' : adding ? 'Added!' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
