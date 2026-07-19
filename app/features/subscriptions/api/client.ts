import type {
  Subscription,
  SubscriptionInput,
} from '@/app/features/subscriptions/types';

async function parseOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof body.error === 'string'
        ? body.error
        : (body.error?.formErrors?.[0] ?? 'Request failed');
    throw new Error(message);
  }
  return body;
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const res = await fetch('/api/subscriptions');
  const body = await parseOrThrow(res);
  return body.data;
}

export async function createSubscription(
  input: SubscriptionInput,
): Promise<void> {
  const res = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await parseOrThrow(res);
}

export async function updateSubscription(
  id: string,
  input: SubscriptionInput,
): Promise<void> {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await parseOrThrow(res);
}

export async function deleteSubscription(id: string): Promise<void> {
  const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
  await parseOrThrow(res);
}
