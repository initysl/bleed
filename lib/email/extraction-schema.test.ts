import { describe, expect, it } from 'vitest';
import { extractionResultSchema } from './extraction-schema';

const parse = (subscriptions: unknown) =>
  extractionResultSchema.safeParse({ subscriptions });

const valid = {
  name: 'Netflix',
  price: 15.49,
  currency: 'USD',
  billing_cycle: 'monthly',
  renewal_date: '2026-10-01',
};

describe('extractionResultSchema', () => {
  it('accepts a well-formed subscription', () => {
    expect(parse([valid]).success).toBe(true);
  });

  it('accepts a null renewal_date', () => {
    expect(parse([{ ...valid, renewal_date: null }]).success).toBe(true);
  });

  it('accepts an error item in place of a subscription', () => {
    expect(parse([{ error: 'no subscription found' }]).success).toBe(true);
  });

  it('accepts a mix of extracted and failed items', () => {
    const result = parse([valid, { error: 'second charge was unclear' }]);
    expect(result.success).toBe(true);
    expect(result.success && result.data.subscriptions).toHaveLength(2);
  });

  it('rejects an empty array — the model must always say something', () => {
    expect(parse([]).success).toBe(false);
  });

  describe('currency must match the database constraint', () => {
    // supabase/003_currency_and_review.sql enforces currency ~ '^[A-Z]{3}$'.
    // A looser check here accepted values the insert then rejected, and that
    // failure was swallowed, so the subscription vanished with no trace.
    it('accepts uppercase ISO codes', () => {
      for (const c of ['USD', 'NGN', 'GBP', 'EUR', 'KES']) {
        expect(parse([{ ...valid, currency: c }]).success).toBe(true);
      }
    });

    it.each(['usd', 'Usd', 'US', 'USDD', '$', '123'])(
      'rejects %s',
      (currency) => {
        expect(parse([{ ...valid, currency }]).success).toBe(false);
      },
    );
  });

  describe('name is bounded', () => {
    it('accepts a normal name', () => {
      expect(parse([{ ...valid, name: 'Adobe Creative Cloud' }]).success).toBe(
        true,
      );
    });

    it('rejects an empty name', () => {
      expect(parse([{ ...valid, name: '' }]).success).toBe(false);
    });

    it('rejects an overlong name, which is the prompt-injection lever', () => {
      expect(parse([{ ...valid, name: 'x'.repeat(101) }]).success).toBe(false);
    });

    it('accepts exactly the limit', () => {
      expect(parse([{ ...valid, name: 'x'.repeat(100) }]).success).toBe(true);
    });
  });

  it('rejects a non-positive price', () => {
    expect(parse([{ ...valid, price: 0 }]).success).toBe(false);
    expect(parse([{ ...valid, price: -5 }]).success).toBe(false);
  });

  it('rejects an unknown billing cycle', () => {
    expect(parse([{ ...valid, billing_cycle: 'weekly' }]).success).toBe(false);
  });

  it('rejects a malformed renewal_date', () => {
    expect(parse([{ ...valid, renewal_date: '01/10/2026' }]).success).toBe(
      false,
    );
  });
});
