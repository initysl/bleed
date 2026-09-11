'use client';

import { useState, useSyncExternalStore } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import {
  enablePushNotifications,
  getNotificationPermissionState,
} from '@/app/features/notifications/lib/push-client';

type Status =
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'loading'
  | 'error';

// Permission changes only via a browser prompt this component triggers, so no
// subscription is needed.
const emptySubscribe = () => () => {};

export function EnableNotifications() {
  const [actionStatus, setActionStatus] = useState<Status | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // useSyncExternalStore rather than setState-in-an-effect. Notification
  // permission is browser state that doesn't exist during SSR, so the server
  // snapshot is 'default' and the client reads the real value on hydration —
  // no cascading render, and no react-hooks/set-state-in-effect violation.
  const permission = useSyncExternalStore(
    emptySubscribe,
    getNotificationPermissionState,
    () => 'default' as Status,
  );

  // `status` is only set once the user acts; before that the live permission
  // value is what matters.
  const status = actionStatus ?? permission;

  async function handleEnable() {
    setActionStatus('loading');
    const result = await enablePushNotifications();

    if (result.status === 'subscribed') setActionStatus('granted');
    else if (result.status === 'denied') setActionStatus('denied');
    else if (result.status === 'unsupported') setActionStatus('unsupported');
    else {
      setActionStatus('error');
      setErrorMessage(result.error);
    }
  }

  if (status === 'granted' || status === 'unsupported') return null;

  if (status === 'denied') {
    return (
      <p className='font-mini text-xs text-ink/50'>
        Notifications are blocked in your browser. Enable them in your browser&apos;s
        site settings to get renewal reminders here as well as by email.
      </p>
    );
  }

  return (
    <div className='font-mini flex w-full max-w-md flex-col gap-2 rounded-lg border border-sage bg-white/60 px-4 py-3'>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-sm text-ink/70'>
          Get a push notification a few days before something renews.
        </p>
        <button
          type='button'
          onClick={handleEnable}
          disabled={status === 'loading'}
          aria-busy={status === 'loading'}
          className='shrink-0 rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
        >
          {status === 'loading' ? 'Enabling…' : 'Enable'}
        </button>
      </div>

      {/* This was `<span className='sr-only'>`, which is exactly inverted: the
          failure was hidden from every sighted user — who saw the button return
          from "Enabling…" to "Enable" and nothing else — and exposed only to
          assistive tech, in a non-live region that would not be announced
          anyway. */}
      {status === 'error' && errorMessage && (
        <p
          role='alert'
          className='flex items-start gap-1.5 text-xs text-rust'
        >
          <FiAlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0' aria-hidden='true' />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
