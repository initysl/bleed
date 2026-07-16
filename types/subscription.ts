export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  billing_cycle: BillingCycle;
  monthly_equivalent: number;
  renewal_date: string; // ISO date
  reminder_at: string; // ISO timestamp — user-chosen date + time
  notify_email: boolean;
  notify_push: boolean;
  category: string | null;
  last_used_at: string | null;
  source: 'manual' | 'email';
  raw_email_snippet: string | null;
  created_at: string;
  updated_at: string;
}

// Shape the LLM must return when extracting a subscription from an email
export interface ExtractedSubscription {
  name: string;
  price: number;
  billing_cycle: BillingCycle;
  renewal_date: string | null; // may be null if the email doesn't state one
}
