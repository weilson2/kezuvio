/** Whole-order percentage discount in integer sen; half-sen ties round up. */
export function quoteCommerce(subtotalSen: number, code: string) {
  const discountSen =
    code === "EVOLVE10" ? Math.floor((subtotalSen * 10 + 50) / 100) : 0;
  return { discountSen, totalSen: subtotalSen - discountSen };
}

/** Convert a plain RM decimal without floating-point rounding or exponent syntax. */
export function parsePriceSen(value: string): number {
  if (!/^\d{1,5}(?:\.\d{1,2})?$/.test(value))
    throw new Error("Enter a price with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const sen = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (sen < 1 || sen > 1000000)
    throw new Error("Price must be between RM0.01 and RM10,000.00.");
  return sen;
}
