import { useState, useEffect } from 'react';
import { Order } from '@/types';
import { subscribeToOrders } from '@/services/orders';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { orders, loading };
}
