export const CURRENCIES = [
  'NGN',
  'USD',
  'GBP',
  'EUR',
  'CAD',
  'AUD',
  'GHS',
  'KES',
  'ZAR',
  'JPY',
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

// Uses the browser/Node's own currency formatting rules rather than a hand-maintained
// symbol map — correct decimal places, symbol placement, and spacing per currency for free.
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(amount);
  } catch {
    // Unknown/invalid currency code — fall back to something legible rather than throwing.
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export interface MoneyParts {
  symbol: string;
  /** Integer part, already grouped — e.g. "11,400". */
  whole: string;
  /** Decimal separator plus fraction, e.g. ".00". Empty for zero-decimal currencies. */
  fraction: string;
}

// Splits a formatted amount into the pieces the meter renders at different
// sizes: a small symbol, a large integer, and a muted fraction.
//
// formatToParts rather than a regex over the formatted string. A regex has to
// assume the symbol leads and that "." is the decimal separator, and neither
// holds across the currencies this app supports — JPY has no fraction digits
// at all, and narrowSymbol output varies in placement and spacing.
export function moneyParts(amount: number, currency: string): MoneyParts {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(amount);

    let symbol = '';
    let whole = '';
    let fraction = '';
    let seenDecimal = false;

    for (const part of parts) {
      if (part.type === 'currency') symbol += part.value;
      else if (part.type === 'decimal') {
        seenDecimal = true;
        fraction += part.value;
      } else if (part.type === 'fraction') fraction += part.value;
      else if (part.type === 'integer' || part.type === 'group') {
        // A group separator after the decimal would be a formatter bug, but
        // guard anyway so nothing lands in the wrong bucket.
        if (!seenDecimal) whole += part.value;
      } else if (part.type === 'minusSign') whole = part.value + whole;
    }

    return { symbol, whole, fraction };
  } catch {
    return { symbol: `${currency} `, whole: Math.trunc(amount).toString(), fraction: '' };
  }
}
