export type PriceBreakdown = {
  fives: number;
  threes: number;
  ones: number;
  total: number;
  breakdown: string;
};

const PRICE_FIVE = 7;
const PRICE_THREE = 5;
const PRICE_ONE = 2;

export function computeOptimalPrice(n: number): PriceBreakdown {
  if (!Number.isFinite(n) || n <= 0) {
    return { fives: 0, threes: 0, ones: 0, total: 0, breakdown: "" };
  }

  const fives = Math.floor(n / 5);
  const remainder = n % 5;
  const threes = Math.floor(remainder / 3);
  const ones = remainder % 3;
  const total = fives * PRICE_FIVE + threes * PRICE_THREE + ones * PRICE_ONE;

  const parts: string[] = [];
  if (fives === 1) parts.push("1 pack de 5");
  else if (fives > 1) parts.push(`${fives} packs de 5`);
  if (threes === 1) parts.push("1 pack de 3");
  else if (threes > 1) parts.push(`${threes} packs de 3`);
  if (ones === 1) parts.push("1 ticket");
  else if (ones > 1) parts.push(`${ones} tickets`);

  return { fives, threes, ones, total, breakdown: parts.join(" + ") };
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
}
