import { z } from 'zod';

const extractedSubscriptionSchema = z.object({
  // Capped, not just non-empty. This value comes from a model reading an email
  // any stranger can send to a user's inbound address, so it is the main thing
  // a prompt-injection attempt can still steer. A bounded length keeps a
  // crafted "name" from carrying a payload into the dashboard or an email
  // template, and keeps it renderable in a list row.
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  // Must match the database's own constraint (currency ~ '^[A-Z]{3}$', see
  // supabase/003_currency_and_review.sql). A looser .length(3) accepted
  // lowercase codes here and then failed at insert time, where the error was
  // swallowed and the subscription silently vanished.
  currency: z.string().regex(/^[A-Z]{3}$/),
  billing_cycle: z.enum(['monthly', 'yearly']),
  renewal_date: z.string().date().nullable(),
});

const extractionErrorSchema = z.object({
  error: z.string(),
});

// Each array item is EITHER a successfully extracted subscription OR an
// error explaining why that specific item couldn't be extracted — never a
// silently dropped item.
const extractionItemSchema = z.union([
  extractedSubscriptionSchema,
  extractionErrorSchema,
]);

export const extractionResultSchema = z.object({
  subscriptions: z.array(extractionItemSchema).min(1),
});

export type ExtractedSubscription = z.infer<typeof extractedSubscriptionSchema>;
export type ExtractionItem = z.infer<typeof extractionItemSchema>;
