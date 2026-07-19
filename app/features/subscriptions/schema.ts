import { z } from 'zod';

// Base shape shared by create and update — kept separate from the "at least
// one channel" rule below so the update variant can still be built from it
// via .partial() (a refined schema can't be partial()'d directly).
const subscriptionBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be greater than 0'),
  currency: z.string().length(3),
  billing_cycle: z.enum(['monthly', 'yearly']),
  renewal_date: z.string().date(),
  reminder_at: z.string().min(1),
  notify_email: z.boolean(),
  notify_push: z.boolean(),
  category: z.string().nullable().optional(),
});

function hasAtLeastOneChannel(data: {
  notify_email?: boolean;
  notify_push?: boolean;
}) {
  // If neither field is present in this particular payload, there's nothing to check here —
  // that only happens on a partial update where channels simply aren't being touched.
  if (data.notify_email === undefined && data.notify_push === undefined)
    return true;
  return data.notify_email !== false || data.notify_push !== false;
}

// Used by the create form and the POST route — every field required.
export const subscriptionCreateSchema = subscriptionBaseSchema.refine(
  hasAtLeastOneChannel,
  {
    message: 'At least one reminder channel must be enabled',
    path: ['notify_push'],
  },
);

// Used by the PATCH route — every field optional, since a partial update only
// sends the fields that actually changed.
export const subscriptionUpdateSchema = subscriptionBaseSchema
  .partial()
  .extend({
    last_used_at: z.iso.date().nullable().optional(),
  })
  .refine(hasAtLeastOneChannel, {
    message: 'At least one reminder channel must stay enabled',
    path: ['notify_push'],
  });
