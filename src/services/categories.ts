import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category } from '@/types';
import { slugify } from '@/utils';

const COLLECTION = 'categories';

export async function getCategories(): Promise<Category[]> {
  const q = query(collection(db, COLLECTION), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
}

export function subscribeToCategories(callback: (categories: Category[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy('name'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
  });
}

export async function addCategory(name: string): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    name,
    slug: slugify(name),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateCategory(id: string, name: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    name,
    slug: slugify(name),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const batch = writeBatch(db);
  const productsSnap = await getDocs(
    query(collection(db, 'products'), where('categoryId', '==', id))
  );

  productsSnap.docs.forEach((productDoc) => {
    batch.update(productDoc.ref, {
      categoryId: '',
      categoryName: '',
    });
  });

  batch.delete(doc(db, COLLECTION, id));
  await batch.commit();
}
