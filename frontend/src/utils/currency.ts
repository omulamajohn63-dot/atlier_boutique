/**
 * Boutique Currency & Pricing Configuration
 * Default Currency: Kenyan Shilling (KES / KSh)
 */

export const DEFAULT_CURRENCY = {
  code: 'KES',
  symbol: 'KSh',
  name: 'Kenyan Shilling',
};

// Shipping thresholds & costs in Kenyan Shillings (KSh)
export const FREE_SHIPPING_THRESHOLD = 15000; // KSh 15,000 threshold for complimentary express delivery
export const STANDARD_SHIPPING_COST = 500;   // KSh 500
export const EXPRESS_SHIPPING_COST = 1500;   // KSh 1,500
export const VAT_RATE = 0.16;                 // Kenya standard VAT (16%)

/**
 * Formats a monetary number into Kenyan Shillings (e.g. "KSh 24,500")
 */
export function formatPrice(
  amount: number,
  options?: {
    symbol?: string;
    includeDecimals?: boolean;
  }
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${options?.symbol || DEFAULT_CURRENCY.symbol} 0`;
  }

  const symbol = options?.symbol !== undefined ? options.symbol : DEFAULT_CURRENCY.symbol;
  const hasDecimals = options?.includeDecimals ?? (amount % 1 !== 0);

  const formatted = amount.toLocaleString('en-KE', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return symbol ? `${symbol} ${formatted}` : formatted;
}
