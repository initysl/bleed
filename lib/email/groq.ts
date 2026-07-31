import Groq from 'groq-sdk';
import {
  extractionResultSchema,
  type ExtractionItem,
} from './extraction-schema';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You extract subscription details from forwarded emails or plain-English notes.

An email may describe ONE subscription, MULTIPLE distinct subscriptions (e.g. a billing
summary listing several separate charges, or a bundle confirmation), or none at all.

Reply ONLY with minified JSON matching this exact shape, no markdown, no commentary:
{"subscriptions": [ {...}, {...} ]}

Each item in "subscriptions" is EITHER a successfully extracted subscription:
{"name": string, "price": number, "currency": string, "billing_cycle": "monthly" | "yearly", "renewal_date": string | null}
OR, if that specific item couldn't be confidently extracted, an error item:
{"error": string}

Rules:
- If the email describes multiple distinct subscriptions or charges, return one array item
  per subscription — never merge them into one, and never silently drop any of them.
- If the email describes exactly one subscription, return a single-item array.
- If you cannot find ANY subscription in the email at all, return
  {"subscriptions": [{"error": "reason"}]} — the array itself is never empty.
- "price" is a number only, no currency symbols.
- "currency" is a 3-letter ISO 4217 code (e.g. "USD", "NGN", "GBP", "EUR"). Infer from symbols
  ($ -> USD unless context says otherwise, ₦ -> NGN, £ -> GBP, € -> EUR) or explicit mentions.
  If genuinely ambiguous, default to "USD".
- "billing_cycle" must be exactly "monthly" or "yearly" — infer from context (e.g. "$99/year" -> yearly).
- "renewal_date" is an ISO date (YYYY-MM-DD) if the email states or implies a next billing/renewal date, otherwise null.`;

// Returns one or more items — always an array, even for a single subscription,
// so callers have one consistent code path instead of a special-cased "one
// subscription" shape plus a separately-handled "multiple" case.
export async function extractSubscriptions(
  emailText: string,
): Promise<ExtractionItem[]> {
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: emailText },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;

  if (!raw) {
    return [{ error: 'empty response from model' }];
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    // response_format: json_object guarantees SYNTACTICALLY valid JSON, but
    // not that the model didn't wrap it oddly or truncate — still worth a
    // defensive catch rather than trusting it unconditionally.
    return [{ error: 'model returned invalid JSON' }];
  }

  const result = extractionResultSchema.safeParse(parsedJson);

  if (!result.success) {
    // This is the actual fix for the "no runtime validation" gap — previously
    // a shape mismatch here would have propagated a malformed object all the
    // way to a database insert, surfacing later as a confusing DB error
    // rather than being caught at the point where it actually happened.
    return [{ error: 'model response did not match the expected schema' }];
  }

  return result.data.subscriptions;
}
