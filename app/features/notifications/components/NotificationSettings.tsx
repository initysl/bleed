'use client';

import { useEffect, useState } from 'react';
import { FiBell, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import {
  enablePushNotifications,
  getNotificationPermissionState,
} from '@/app/features/notifications/lib/push-client';

export function NotificationSettings() {
  const [permission, setPermission] = useState<
    'default' | 'granted' | 'denied' | 'unsupported'
  >('default');
  const [enabling, setEnabling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setPermission(getNotificationPermissionState());
  }, []);

  async function handleEnable() {
    setEnabling(true);
    const result = await enablePushNotifications();
    setEnabling(false);

    if (result.status === 'subscribed') setPermission('granted');
    else if (result.status === 'denied') setPermission('denied');
    else if (result.status === 'unsupported') setPermission('unsupported');
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    const res = await fetch('/api/notifications/test', { method: 'POST' });
    const body = await res.json();

    setTesting(false);
    setTestResult({
      ok: body.ok,
      message: body.message ?? 'Something went wrong.',
    });
  }

  return (
    <div className='flex flex-col gap-3 rounded-lg border border-sage bg-white/60 px-4 py-3'>
      <div className='flex items-center gap-2'>
        <FiBell className='h-4 w-4 text-ink/50' />
        <span className='text-sm text-ink'>Push notifications</span>
        <span className='ml-auto text-xs text-ink/40'>
          {permission === 'granted' && 'Enabled'}
          {permission === 'default' && 'Not enabled'}
          {permission === 'denied' && 'Blocked in browser'}
          {permission === 'unsupported' && 'Not supported'}
        </span>
      </div>

      {permission === 'default' && (
        <button
          onClick={handleEnable}
          disabled={enabling}
          className='self-start rounded-md bg-pine px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-pine/90 disabled:opacity-60'
        >
          {enabling ? 'Enabling…' : 'Enable'}
        </button>
      )}

      {permission === 'denied' && (
        <p className='text-xs text-ink/50'>
          Blocked at the browser level. Enable notifications for this site in
          your browser's settings, then reload this page.
        </p>
      )}

      {permission === 'granted' && (
        <div className='flex flex-col gap-2'>
          <button
            onClick={handleTest}
            disabled={testing}
            className='self-start rounded-md border border-sage px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sage/30 disabled:opacity-60'
          >
            {testing ? 'Sending…' : 'Send test notification'}
          </button>

          {testResult && (
            <div className='flex items-start gap-1.5 text-xs'>
              {testResult.ok ? (
                <FiCheckCircle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-pine' />
              ) : (
                <FiAlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-rust' />
              )}
              <span className={testResult.ok ? 'text-pine' : 'text-rust'}>
                {testResult.message}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
