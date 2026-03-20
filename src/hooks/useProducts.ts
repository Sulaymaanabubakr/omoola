import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { getProducts, subscribeToProducts } from '@/services/products';

interface UseProductsOptions {
  categoryId?: string;
  isFeatured?: boolean;
  searchQuery?: string;
  limitCount?: number;
  realtime?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { categoryId, isFeatured, searchQuery, limitCount, realtime } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (realtime && !searchQuery) {
      setLoading(true);
      const unsub = subscribeToProducts(
        (data) => {
          setProducts(data);
          setLoading(false);
        },
        { categoryId, isFeatured }
      );
      return () => unsub();
    } else {
      setLoading(true);
      getProducts({ categoryId, isFeatured, searchQuery, limitCount })
        .then(setProducts)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [categoryId, isFeatured, searchQuery, limitCount, realtime]);

  return { products, loading, error, setProducts };
}
