'use client';

import { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';
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

export function EnableNotifications() {
  const [status, setStatus] = useState<Status>('default');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus(getNotificationPermissionState());
  }, []);

  async function handleEnable() {
    setStatus('loading');
    const result = await enablePushNotifications();

    if (result.status === 'subscribed') setStatus('granted');
    else if (result.status === 'denied') setStatus('denied');
    else if (result.status === 'unsupported') setStatus('unsupported');
    else {
      setStatus('error');
      setErrorMessage(result.error);
    }
  }

  if (status === 'granted' || status === 'unsupported') return null;

  if (status === 'denied') {
    return (
      <p className='text-xs text-ink/50'>
        Notifications are blocked in your browser. Enable them in your browser's
        site settings to get renewal reminders here as well as by email.
      </p>
    );
  }

  return (
    <div className='flex w-full max-w-md items-center justify-between gap-3 rounded-lg border border-sage bg-white/60 px-4 py-3'>
      <div className='flex items-center gap-2'>
        <FiBell className='h-4 w-4 text-ink/50' />
        <p className='text-sm text-ink/70'>
          Get a push notification a few days before something renews.
        </p>
      </div>
      <button
        onClick={handleEnable}
        disabled={status === 'loading'}
        className='shrink-0 rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine'
      >
        {status === 'loading' ? 'Enabling…' : 'Enable'}
      </button>
      {status === 'error' && <span className='sr-only'>{errorMessage}</span>}
    </div>
  );
}
