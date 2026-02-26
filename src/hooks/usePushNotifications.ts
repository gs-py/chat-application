import { useEffect, useState, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, getFirebaseConfig, isFirebaseConfigured } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { vibrateNewMessage } from '@/lib/haptics';
import { toast } from 'sonner';

const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ??
  'BDCmkfWM9OX3OAZ_8I6H551RVjg858XU4MzZANWF_RzNOe9gZB0KrhR-2qBmMSCjF-w2_F_MQixZERD-pC-9RuE';

const SW_PATH = '/firebase-messaging-sw.js';

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration('/');
    if (reg?.active) return reg;
    reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
    const ready = (reg as ServiceWorkerRegistration & { ready?: Promise<ServiceWorkerRegistration> }).ready;
    if (ready) await ready;
    else await new Promise((r) => setTimeout(r, 1500));
    return reg;
  } catch (e) {
    console.warn('Service worker registration failed:', e);
    return null;
  }
}

/** Fallback: get FCM token using Firebase compat SDK (sometimes works when modular fails). */
async function getTokenCompat(vapidKey: string): Promise<string | null> {
  try {
    const firebase = (await import('firebase/compat/app')).default;
    await import('firebase/compat/messaging');
    if (!firebase.apps.length) {
      firebase.initializeApp(getFirebaseConfig());
    }
    const messaging = firebase.messaging();
    const token = await messaging.getToken({ vapidKey });
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Request notification permission, get FCM token, store it in profiles, and handle foreground messages.
 * Call when user is logged in.
 */
export function usePushNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  const registerToken = useCallback(async (): Promise<{ ok: boolean; message?: string }> => {
    if (!userId || !isFirebaseConfigured() || !VAPID_KEY) {
      return { ok: false, message: 'Push not configured' };
    }
    if (!window.isSecureContext) {
      const msg = 'Notifications require HTTPS or localhost. Open the app via https:// or http://localhost';
      console.warn(msg);
      toast.error(msg);
      return { ok: false, message: msg };
    }
    setLoading(true);
    try {
      const swReg = await getServiceWorkerRegistration();
      if (!swReg) {
        const msg = 'Service worker failed. Use HTTPS or localhost (e.g. http://localhost:5173).';
        console.warn(msg);
        toast.error(msg);
        return { ok: false, message: msg };
      }
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        setLoading(false);
        return { ok: false, message: 'Messaging not supported' };
      }
      let token: string | null = null;
      try {
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
      } catch (modularErr) {
        const isPushServiceError =
          modularErr instanceof Error &&
          (modularErr.name === 'AbortError' ||
            (modularErr as Error).message?.includes('push service') ||
            (modularErr as Error).message?.includes('failed-service-worker'));
        if (isPushServiceError) {
          token = await getTokenCompat(VAPID_KEY);
        }
        if (!token) throw modularErr;
      }
      setPermission(Notification.permission);
      if (token) {
        await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', userId);
        return { ok: true };
      }
      return { ok: false, message: 'No token received' };
    } catch (err) {
      const isPushServiceError =
        err instanceof Error &&
        (err.name === 'AbortError' ||
          err.message.includes('push service') ||
          err.message.includes('failed-service-worker'));
      const msg = isPushServiceError
        ? 'Push notifications aren’t available on this setup. You’ll still get vibration when the app is open.'
        : err instanceof Error
          ? err.message
          : 'Push registration failed';
      console.warn('Push registration failed:', err);
      if (import.meta.env.DEV) {
        console.warn('[Push debug] origin:', window.location.origin, '| secure:', window.isSecureContext, '| VAPID from env:', !!import.meta.env.VITE_FIREBASE_VAPID_KEY);
      }
      toast.error(msg);
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !isFirebaseConfigured()) return;

    let unsubscribe: (() => void) | undefined;

    getFirebaseMessaging().then((messaging) => {
      if (!messaging) return;

      onMessage(messaging, (payload) => {
        vibrateNewMessage();
        const title = payload.notification?.title ?? payload.data?.title ?? 'New message';
        const body = payload.notification?.body ?? payload.data?.body ?? '';
        toast.info(body ? `${title}: ${body}` : title);
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [userId]);

  const requestPermission = useCallback(async () => {
    if (!isFirebaseConfigured()) return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === 'granted') {
      await registerToken();
    }
  }, [registerToken]);

  return {
    permission,
    loading,
    requestPermission,
    registerToken,
    isConfigured: isFirebaseConfigured(),
  };
}
