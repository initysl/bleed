'use client';

import { useEffect, useId, useState } from 'react';
import { FiAlertCircle, FiBell, FiMail } from 'react-icons/fi';
import {
  enablePushNotifications,
  disablePushNotifications,
  hasActivePushSubscription,
  getNotificationPermissionState,
} from '@/app/features/notifications/lib/push-client';

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  helperText?: string;
  // Separated from helperText on purpose. Both used to be rendered through the
  // same muted-grey <p>, so a failed save was indistinguishable from a tip.
  errorText?: string | null;
}

function ToggleRow({
  icon,
  label,
  checked,
  disabled,
  onChange,
  helperText,
  errorText,
}: ToggleRowProps) {
  const labelId = useId();
  const descId = useId();

  return (
    <div className='flex flex-col gap-1 rounded-lg border border-sage bg-white/60 px-4 py-3'>
      <div className='flex items-center gap-2'>
        {icon}
        <span id={labelId} className='text-sm text-ink'>
          {label}
        </span>
        <button
          type='button'
          role='switch'
          aria-checked={checked}
          // The label was a SIBLING span with nothing connecting it, so a screen
          // reader announced two identical unnamed switches: "switch, on".
          aria-labelledby={labelId}
          aria-describedby={helperText || errorText ? descId : undefined}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          // h-6 w-11 clears the 24x24 WCAG 2.2 minimum target size; it was
          // 36x20. p-0.5 replaces the hand-tuned translate-x offsets.
          className={`ml-auto flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            checked ? 'bg-pine' : 'bg-sage'
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {errorText ? (
        <p
          id={descId}
          role='alert'
          className='flex items-center gap-1.5 text-xs text-rust'
        >
          <FiAlertCircle className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
          {errorText}
        </p>
      ) : (
        helperText && (
          <p id={descId} className='text-xs text-ink/60'>
            {helperText}
          </p>
        )
      )}
    </div>
  );
}

export function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushBlocked, setPushBlocked] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(true);
  // Both toggles render a guessed state before the real one arrives, so they
  // visibly flip once it does. Disabling them until `loaded` stops the user
  // acting on a value that is about to change under them.
  const [loaded, setLoaded] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // On mount: check real push subscription state (not just permission — see
  // hasActivePushSubscription's own comment for why that distinction matters),
  // and fetch the stored email preference.
  useEffect(() => {
    (async () => {
      const permission = getNotificationPermissionState();
      setPushBlocked(permission === 'denied' || permission === 'unsupported');
      setPushEnabled(await hasActivePushSubscription());
    })();

    (async () => {
      // Previously unguarded: res.json() on a failed response throws inside a
      // floating async IIFE, which is an unhandled rejection, and the UI then
      // silently kept its optimistic default — telling the user email
      // notifications were on regardless of the truth.
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
      if (result.status === 'subscribed') {
        setPushEnabled(true);
      } else if (
        result.status === 'denied' ||
        result.status === 'unsupported'
      ) {
        setPushBlocked(true);
      } else if (result.status === 'error') {
        setPushError(result.error);
      }
    } else {
      const result = await disablePushNotifications();
      if (result.status === 'unsubscribed') {
        setPushEnabled(false);
      } else {
        setPushError(result.error);
      }
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
      setEmailError(body.error ?? "Couldn't update. Try again.");
    }

    setEmailBusy(false);
  }

  return (
    <div className='flex flex-col gap-3'>
      <ToggleRow
        icon={<FiBell className='h-4 w-4 text-ink/50' />}
        label='Push notifications'
        checked={pushEnabled}
        disabled={pushBusy || pushBlocked}
        onChange={handlePushToggle}
        helperText={
          pushBlocked
            ? "Blocked at the browser level. Enable notifications for this site in your browser's settings, then reload this page."
            : undefined
        }
        errorText={pushError}
      />

      <ToggleRow
        icon={<FiMail className='h-4 w-4 text-ink/50' />}
        label='Email notifications'
        checked={emailEnabled}
        disabled={emailBusy || !loaded}
        onChange={handleEmailToggle}
        errorText={emailError}
      />
    </div>
  );
}
