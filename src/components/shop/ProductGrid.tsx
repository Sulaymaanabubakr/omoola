import ProductCard from './ProductCard';
import { Product } from '@/types';
import { PackageSearch } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  emptyMessage?: string;
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="flex justify-between items-center pt-1">
          <div className="skeleton h-6 w-1/3 rounded" />
          <div className="skeleton h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, emptyMessage }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
          <PackageSearch className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">No products found</p>
          <p className="text-muted-foreground text-sm">
            {emptyMessage || 'Try adjusting your search or filters'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
