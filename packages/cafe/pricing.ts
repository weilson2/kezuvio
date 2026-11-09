/** Integer-sen whole-order discount, rounded half up. Inputs are validated by the domain. */
export function quotePayment(subtotalSen: number, discountPct: number) {
  const discountSen = Math.floor((subtotalSen * discountPct + 50) / 100);
  return { discountSen, totalSen: subtotalSen - discountSen };
}
