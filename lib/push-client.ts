// Converts the VAPID public key (base64url string) into the Uint8Array format
// the Push API requires for applicationServerKey.
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

// Call this on page load to know whether to show "Enable notifications" at all,
// vs. already-subscribed, vs. previously-denied (browsers won't re-prompt).
export function getNotificationPermissionState():
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window))
    return 'unsupported';
  return Notification.permission;
}
