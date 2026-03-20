import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message } from '@/types';

const COLLECTION = 'messages';

export async function sendMessage(
  name: string,
  contact: string,
  message: string
): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    name,
    contact,
    message,
    isRead: false,
    createdAt: Timestamp.now(),
  });
}

export async function getMessages(): Promise<Message[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
}

export function subscribeToMessages(callback: (messages: Message[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
  });
}

export async function markMessageRead(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { isRead: true });
}
