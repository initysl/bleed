function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export type PushSetupResult =
  | { status: 'unsupported' }
  | { status: 'denied' }
  | { status: 'subscribed' }
  | { status: 'error'; error: string };

export async function enablePushNotifications(): Promise<PushSetupResult> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { status: 'unsupported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { status: 'denied' };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      }));

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        status: 'error',
        error: body.error ?? 'Failed to save subscription',
      };
    }

    return { status: 'subscribed' };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export type PushDisableResult =
  | { status: 'unsubscribed' }
  | { status: 'error'; error: string };

export async function disablePushNotifications(): Promise<PushDisableResult> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const res = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          status: 'error',
          error: body.error ?? 'Failed to remove subscription',
        };
      }
    }

    return { status: 'unsubscribed' };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// The authoritative check for "is push actually active on this device" —
// Notification.permission being "granted" is NOT sufficient on its own, since
// permission and an actual saved PushSubscription are two separate things
// (this exact gap caused the earlier "no device registered" bug).
export async function hasActivePushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window))
    return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return subscription != null;
  } catch {
    return false;
  }
}

export function getNotificationPermissionState():
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window))
    return 'unsupported';
  return Notification.permission;
}
