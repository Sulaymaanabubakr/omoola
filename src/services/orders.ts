import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderItem, CartItem, Product } from '@/types';
import { getProduct } from '@/services/products';

const ORDERS_COLLECTION = 'orders';
const ORDER_ITEMS_COLLECTION = 'orderItems';

export async function createOrder(
  customerName: string,
  phone: string,
  items: CartItem[],
  address?: string,
  notes?: string
): Promise<string> {
  const liveProducts = await Promise.all(items.map(item => getProduct(item.productId)));
  const productMap = new Map<string, Product>();

  liveProducts.forEach((product) => {
    if (product) {
      productMap.set(product.id, product);
    }
  });

  const invalidItem = items.find((item) => {
    const product = productMap.get(item.productId);
    return !product || product.inStock === false;
  });

  if (invalidItem) {
    throw new Error(`${invalidItem.name} is no longer available`);
  }

  const total = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  const orderRef = doc(collection(db, ORDERS_COLLECTION));
  const batch = writeBatch(db);

  batch.set(orderRef, {
    customerName,
    phone,
    address: address || '',
    notes: notes || '',
    status: 'pending',
    total,
    createdAt: Timestamp.now(),
  });

  items.forEach(item => {
    const product = productMap.get(item.productId)!;
    const itemRef = doc(collection(db, ORDER_ITEMS_COLLECTION));
    batch.set(itemRef, {
      orderId: orderRef.id,
      productId: item.productId,
      productName: product.name,
      productImage: product.imageUrl,
      quantity: item.quantity,
      price: product.price,
    });
  });
  await batch.commit();

  return orderRef.id;
}

export async function getOrders(): Promise<Order[]> {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
  });
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const q = query(
    collection(db, ORDER_ITEMS_COLLECTION),
    where('orderId', '==', orderId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as OrderItem));
}

export async function updateOrderStatus(
  id: string,
  status: Order['status']
): Promise<void> {
  await updateDoc(doc(db, ORDERS_COLLECTION, id), { status });
}
