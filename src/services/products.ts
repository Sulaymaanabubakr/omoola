import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Product } from '@/types';

const COLLECTION = 'products';

export async function getProducts(filters?: {
  categoryId?: string;
  isFeatured?: boolean;
  searchQuery?: string;
  limitCount?: number;
}): Promise<Product[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (filters?.categoryId) {
    constraints.push(where('categoryId', '==', filters.categoryId));
  }
  if (filters?.isFeatured) {
    constraints.push(where('isFeatured', '==', true));
  }
  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  let products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

  if (filters?.searchQuery) {
    const search = filters.searchQuery.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );
  }

  return products;
}

export function subscribeToProducts(
  callback: (products: Product[]) => void,
  filters?: { categoryId?: string; isFeatured?: boolean }
) {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (filters?.categoryId) {
    constraints.push(where('categoryId', '==', filters.categoryId));
  }
  if (filters?.isFeatured) {
    constraints.push(where('isFeatured', '==', true));
  }

  const q = query(collection(db, COLLECTION), ...constraints);
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
  });
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

export async function addProduct(
  data: Omit<Product, 'id' | 'createdAt'>,
  imageFile?: File
): Promise<string> {
  let imageUrl = data.imageUrl;

  if (imageFile) {
    imageUrl = await uploadProductImage(imageFile);
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    imageUrl,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt'>>,
  imageFile?: File
): Promise<void> {
  let imageUrl = data.imageUrl;

  if (imageFile) {
    imageUrl = await uploadProductImage(imageFile);
  }

  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    ...(imageUrl ? { imageUrl } : {}),
  });
}

export async function deleteProduct(id: string, imageUrl?: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
  if (imageUrl && imageUrl.includes('firebase')) {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch {
      // Image may not exist in storage
    }
  }
}

export async function uploadProductImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const filename = `products/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
  const storageRef = ref(storage, filename);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}
