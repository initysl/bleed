'use client';

import { useEffect, useState } from 'react';
import { FiBell, FiMail } from 'react-icons/fi';
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
}

function ToggleRow({
  icon,
  label,
  checked,
  disabled,
  onChange,
  helperText,
}: ToggleRowProps) {
  return (
    <div className='flex flex-col gap-1 rounded-lg border border-sage bg-white/60 px-4 py-3'>
      <div className='flex items-center gap-2'>
        {icon}
        <span className='text-sm text-ink'>{label}</span>
        <button
          role='switch'
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`ml-auto h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            checked ? 'bg-pine' : 'bg-sage'
          }`}
        >
          <span
            className={`block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-4.5' : ''
            }`}
          />
        </button>
      </div>
      {helperText && <p className='text-xs text-ink/50'>{helperText}</p>}
    </div>
  );
}

export function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushBlocked, setPushBlocked] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(true);
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
      const res = await fetch('/api/profile/notifications');
      const body = await res.json();
      if (body.ok) setEmailEnabled(body.data.email_notifications_enabled);
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
            : (pushError ?? undefined)
        }
      />

      <ToggleRow
        icon={<FiMail className='h-4 w-4 text-ink/50' />}
        label='Email notifications'
        checked={emailEnabled}
        disabled={emailBusy}
        onChange={handleEmailToggle}
        helperText={emailError ?? undefined}
      />
    </div>
  );
}
