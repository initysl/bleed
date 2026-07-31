import { z } from 'zod';

const extractedSubscriptionSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().length(3),
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
