import type { PricingOptionsBlock, PricingOption } from "../../lib/types";
import { computeOptionTotal, formatCurrency } from "../../lib/pricing";
import { escHtml } from "../layout";

export function renderPricingOptions(
  block: PricingOptionsBlock,
  opts: {
    isPdf?: boolean;
    selectedOptionId?: string | null;
    showOnlySelected?: boolean;
  } = {}
): string {
  const { currency, tax_rate, options } = block;

  let displayOptions = options;
  if (opts.showOnlySelected && opts.selectedOptionId) {
    const sel = options.find((o) => o.id === opts.selectedOptionId);
    displayOptions = sel ? [sel] : options;
  }

  const cols =
    displayOptions.length === 2
      ? "pricing-grid-2"
      : displayOptions.length >= 3
      ? "pricing-grid-3"
      : "pricing-grid-1";

  const cards = displayOptions
    .map((opt) => renderOptionCard(opt, currency, tax_rate, opts))
    .join("\n");

  return `
<section class="pricing-options" id="pricing-options">
  ${opts.showOnlySelected && opts.selectedOptionId ? `<p class="selected-note">Selected option at signing: <strong>${escHtml(displayOptions[0]?.name ?? "")}</strong></p>` : ""}
  <div class="pricing-grid ${cols}">
    ${cards}
  </div>
</section>`;
}

function renderOptionCard(
  opt: PricingOption,
  currency: string,
  taxRate: number,
  opts: { isPdf?: boolean; selectedOptionId?: string | null }
): string {
  const { subtotal, tax, total } = computeOptionTotal(opt, taxRate);
  const isSelected = opts.selectedOptionId === opt.id;
  const selClass = isSelected ? "selected" : "";
  const recBadge = opt.recommended
    ? `<span class="badge-recommended">Recommended</span>`
    : "";

  const lineItems = opt.line_items
    .map(
      (li) =>
        `<tr><td>${escHtml(li.label)}</td><td class="amount">${formatCurrency(li.quantity * li.rate, currency)}</td></tr>`
    )
    .join("");

  const includes = (opt.includes ?? [])
    .map((s) => `<li class="include">✓ ${escHtml(s)}</li>`)
    .join("");

  const excludes = (opt.excludes ?? [])
    .map((s) => `<li class="exclude">– ${escHtml(s)}</li>`)
    .join("");

  const bestFor = opt.best_for
    ? `<p class="best-for"><em>${escHtml(opt.best_for)}</em></p>`
    : "";

  const selectAttr = opts.isPdf
    ? ""
    : `data-option-id="${escHtml(opt.id)}" onclick="selectOption('${escHtml(opt.id)}')"`;

  return `
<div class="option-card ${selClass}" ${selectAttr} id="option-${escHtml(opt.id)}">
  ${recBadge}
  ${isSelected && !opts.isPdf ? `<span class="selected-check">✓</span>` : ""}
  <h3 class="option-name">${escHtml(opt.name)}</h3>
  ${opt.tagline ? `<p class="option-tagline">${escHtml(opt.tagline)}</p>` : ""}
  <div class="option-total">${formatCurrency(total, currency)}</div>
  <table class="line-items">
    <tbody>${lineItems}</tbody>
    <tfoot>
      <tr class="subtotal-row"><td>Subtotal</td><td class="amount">${formatCurrency(subtotal, currency)}</td></tr>
      <tr class="tax-row"><td>Tax (${Math.round(taxRate * 100)}%)</td><td class="amount">${formatCurrency(tax, currency)}</td></tr>
      <tr class="total-row"><td><strong>Total</strong></td><td class="amount"><strong>${formatCurrency(total, currency)}</strong></td></tr>
    </tfoot>
  </table>
  ${includes || excludes ? `<ul class="feature-list">${includes}${excludes}</ul>` : ""}
  ${bestFor}
</div>`;
}
