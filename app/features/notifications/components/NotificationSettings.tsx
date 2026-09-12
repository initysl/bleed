'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Switch } from '@/app/components/ui/Switch';
import {
  enablePushNotifications,
  disablePushNotifications,
  hasActivePushSubscription,
  getNotificationPermissionState,
} from '@/app/features/notifications/lib/push-client';

export function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushBlocked, setPushBlocked] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  // Both toggles render a guessed state before the real one arrives. Holding
  // them inert until `loaded` stops the user acting on a value that is about
  // to change under them.
  const [loaded, setLoaded] = useState(false);

  // The zone the reminder times are resolved against — surfaced because it
  // decides WHEN a reminder actually lands, which is otherwise invisible.
  const timeZone = useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => 'UTC',
  );

  useEffect(() => {
    (async () => {
      const permission = getNotificationPermissionState();
      setPushBlocked(permission === 'denied' || permission === 'unsupported');
      setPushEnabled(await hasActivePushSubscription());
    })();

    (async () => {
      // Previously unguarded: res.json() on a failed response throws inside a
      // floating async IIFE, and the UI silently kept its optimistic default —
      // reporting email notifications as on regardless of the truth.
      try {
        const res = await fetch('/api/profile/notifications');
        const body = await res.json();
        if (res.ok && body.ok) {
          setEmailEnabled(body.data.email_notifications_enabled);
        } else {
          setEmailError('Could not load your notification settings.');
        }
      } catch {
        setEmailError('Could not load your notification settings.');
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function handlePushToggle(next: boolean) {
    setPushBusy(true);
    setPushError(null);

    if (next) {
      const result = await enablePushNotifications();
      if (result.status === 'subscribed') setPushEnabled(true);
      else if (result.status === 'denied' || result.status === 'unsupported') {
        setPushBlocked(true);
      } else if (result.status === 'error') setPushError(result.error);
    } else {
      const result = await disablePushNotifications();
      if (result.status === 'unsubscribed') setPushEnabled(false);
      else setPushError(result.error);
    }

    setPushBusy(false);
  }

  async function handleEmailToggle(next: boolean) {
    setEmailBusy(true);
    setEmailError(null);

    const res = await fetch('/api/profile/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_notifications_enabled: next }),
    });

    if (res.ok) {
      setEmailEnabled(next);
    } else {
      const body = await res.json().catch(() => ({}));
      setEmailError(body.error ?? 'Could not update. Try again.');
    }

    setEmailBusy(false);
  }

  // One channel has to stay on, and the rule is stated before it is enforced
  // rather than surfacing as a rejection after the fact.
  const emailIsLast = emailEnabled && !pushEnabled;
  const pushIsLast = pushEnabled && !emailEnabled;
  const lockCopy = 'One channel has to stay on. Enable the other to switch this off.';

  return (
    <div className='flex flex-col'>
      <div className='border-t border-line-soft'>
        <Switch
          label='Email reminders'
          description='Sent to your account address, three days before each renewal.'
          checked={emailEnabled}
          disabled={emailBusy || !loaded}
          lockedReason={emailIsLast ? lockCopy : null}
          error={emailError}
          onChange={handleEmailToggle}
        />
      </div>

      <div className='border-t border-line-soft'>
        <Switch
          label='Push notifications'
          description={
            pushBlocked
              ? 'Blocked at the browser level. Enable notifications for this site in your browser settings, then reload.'
              : 'On this device. Needs browser permission.'
          }
          checked={pushEnabled}
          disabled={pushBusy || pushBlocked}
          lockedReason={pushIsLast ? lockCopy : null}
          error={pushError}
          onChange={handlePushToggle}
        />
      </div>

      <div className='flex items-center justify-between gap-4 border-t border-line-soft py-3.5'>
        <span className='min-w-0'>
          <span className='block text-[15px] text-ink'>Delivery time</span>
          <span className='mt-0.5 block font-mono text-[11px] leading-relaxed text-ink/55'>
            Reminders land at 9am in your own timezone.
          </span>
        </span>
        <span className='shrink-0 rounded-sm border border-line bg-sunken px-2.5 py-1.5 font-mono text-[11px] text-ink/70 tnum'>
          09:00 &middot; {timeZone}
        </span>
      </div>
    </div>
  );
}
