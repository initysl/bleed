export const CURRENCIES = [
  'USD',
  'NGN',
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
