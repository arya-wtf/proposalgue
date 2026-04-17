import type { PricingBlock } from "../../lib/types";
import { computeFlatTotal, formatCurrency } from "../../lib/pricing";
import { escHtml } from "../layout";

export function renderPricingTable(block: PricingBlock): string {
  const { currency, tax_rate, line_items } = block;
  const { subtotal, tax, total } = computeFlatTotal(line_items, tax_rate);

  const rows = line_items
    .map(
      (li) =>
        `<tr><td>${escHtml(li.label)}</td><td>${li.quantity}×</td><td class="amount">${formatCurrency(li.rate, currency)}</td><td class="amount">${formatCurrency(li.quantity * li.rate, currency)}</td></tr>`
    )
    .join("");

  return `
<section class="pricing-table" id="pricing-table">
  <table class="flat-pricing">
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="subtotal-row"><td colspan="3">Subtotal</td><td class="amount">${formatCurrency(subtotal, currency)}</td></tr>
      <tr class="tax-row"><td colspan="3">Tax (${Math.round(tax_rate * 100)}%)</td><td class="amount">${formatCurrency(tax, currency)}</td></tr>
      <tr class="total-row"><td colspan="3"><strong>Total</strong></td><td class="amount"><strong>${formatCurrency(total, currency)}</strong></td></tr>
    </tfoot>
  </table>
</section>`;
}
