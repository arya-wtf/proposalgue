import type { PricingOption, PricingLineItem } from "./types";

export function computeOptionTotal(
  option: PricingOption,
  taxRate: number
): { subtotal: number; tax: number; total: number } {
  const subtotal = option.line_items.reduce(
    (sum, li) => sum + li.quantity * li.rate,
    0
  );
  const taxableAmount = option.line_items
    .filter((li) => li.taxable !== false)
    .reduce((sum, li) => sum + li.quantity * li.rate, 0);
  const tax = Math.round(taxableAmount * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}

export function computeFlatTotal(
  lineItems: PricingLineItem[],
  taxRate: number
): { subtotal: number; tax: number; total: number } {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.rate,
    0
  );
  const taxableAmount = lineItems
    .filter((li) => li.taxable !== false)
    .reduce((sum, li) => sum + li.quantity * li.rate, 0);
  const tax = Math.round(taxableAmount * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
