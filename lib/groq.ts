import Groq from 'groq-sdk';
import type { ExtractedSubscription } from '@/types/subscription';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You extract subscription details from forwarded emails or plain-English notes.
Reply ONLY with minified JSON matching this exact shape, no markdown, no commentary:
{"name": string, "price": number, "currency": string, "billing_cycle": "monthly" | "yearly", "renewal_date": string | null}

Rules:
- "price" is a number only, no currency symbols.
- "currency" is a 3-letter ISO 4217 code (e.g. "USD", "NGN", "GBP", "EUR"). Infer from symbols
  ($ -> USD unless context says otherwise, ₦ -> NGN, £ -> GBP, € -> EUR) or explicit mentions.
  If genuinely ambiguous, default to "USD".
- "billing_cycle" must be exactly "monthly" or "yearly" — infer from context (e.g. "$99/year" -> yearly).
- "renewal_date" is an ISO date (YYYY-MM-DD) if the email states or implies a next billing/renewal date, otherwise null.
- If you cannot confidently find a price or subscription name, respond with {"error": "reason"} instead.`;

export async function extractSubscription(
  emailText: string,
): Promise<ExtractedSubscription | { error: string }> {
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: emailText },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw);
}
