import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBphYM2HL0VPAFdC8YUTeym5rLYHJkjvf8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'chat-app-6f938.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'chat-app-6f938',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'chat-app-6f938.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '621218037610',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:621218037610:web:21cf564f58f8cabb526f13',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-CWW6VHYZFL',
};

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId);
}

const app = initializeApp(firebaseConfig);
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

export function getFirebaseAnalytics() {
  if (typeof window === 'undefined') return null;
  if (!analyticsInstance) analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

let messagingInstance: Messaging | null = null;

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!isFirebaseConfigured()) return null;
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
}
