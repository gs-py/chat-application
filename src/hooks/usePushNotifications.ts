import { useEffect, useState, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, isFirebaseConfigured } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { vibrateNewMessage } from '@/lib/haptics';
import { toast } from 'sonner';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Request notification permission, get FCM token, store it in profiles, and handle foreground messages.
 * Call when user is logged in.
 */
export function usePushNotifications(userId: string | undefined) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  const registerToken = useCallback(async () => {
    if (!userId || !isFirebaseConfigured() || !VAPID_KEY) return;
    setLoading(true);
    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        setLoading(false);
        return;
      }
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      setPermission(Notification.permission);
      if (token) {
        await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', userId);
      }
    } catch (err) {
      console.warn('Push registration failed:', err);
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
