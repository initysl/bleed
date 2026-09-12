import type {
  Subscription,
  SubscriptionInput,
} from '@/app/features/subscriptions/types';

async function parseOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Every API route now answers failures as { ok: false, error: string }
    // (see lib/api/response.ts), so there is exactly one place to look.
    //
    // The previous version also probed `body.error.formErrors[0]`, a shape zod
    // v4 never emits — treeifyError returns { errors, properties }. Every
    // validation failure therefore fell through to the literal string
    // 'Request failed' and the user was told nothing about what was wrong.
    throw new Error(
      typeof body.error === 'string'
        ? body.error
        : 'Something went wrong. Please try again.',
    );
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
