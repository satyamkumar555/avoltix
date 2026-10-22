// All money is stored as integer paise. Never store floats.
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}
/** Discount percentage from MRP and selling price (both paise). Returns 0 if prices are invalid. */
export function discountPercent(mrp: number, price: number): number {
  if (!Number.isInteger(mrp) || !Number.isInteger(price) || mrp <= 0 || price <= 0 || price >= mrp) return 0;
  return Math.floor(((mrp - price) / mrp) * 100);
}
