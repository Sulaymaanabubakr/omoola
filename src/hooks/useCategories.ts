import { useState, useEffect } from 'react';
import { Category } from '@/types';
import { subscribeToCategories } from '@/services/categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCategories((data) => {
      setCategories(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { categories, loading };
}
