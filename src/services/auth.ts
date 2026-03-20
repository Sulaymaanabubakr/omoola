import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

async function isAdminUser(uid: string): Promise<boolean> {
  const adminSnap = await getDoc(doc(db, 'admins', uid));
  return adminSnap.exists();
}

export async function signIn(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const admin = await isAdminUser(result.user.uid);
  if (!admin) {
    await firebaseSignOut(auth);
    const error = new Error('Unauthorized admin user');
    (error as Error & { code?: string }).code = 'auth/unauthorized-admin';
    throw error;
  }
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function checkAdminAccess(uid: string): Promise<boolean> {
  return isAdminUser(uid);
}
