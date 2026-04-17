import { marked } from "marked";
import { renderPricingOptions } from "./components/pricing-options";
import { renderPricingTable } from "./components/pricing-table";
import { escHtml } from "./layout";
import type { ParsedProposal, SignatureData, ParsedBlock } from "../lib/types";
import { formatCurrency } from "../lib/pricing";
import { computeOptionTotal } from "../lib/pricing";

marked.setOptions({ gfm: true, breaks: false });

export function renderPdfHtml(
  proposal: ParsedProposal,
  sig: SignatureData
): string {
  const { frontmatter: fm, blocks } = proposal;

  const bodyBlocks = blocks
    .map((block) => {
      if (block.type === "markdown") {
        return `<div class="prose">${marked.parse(block.content)}</div>`;
      }
      if (block.type === "pricing_options") {
        return renderPricingOptions(block, {
          isPdf: true,
          selectedOptionId: sig.selectedOptionId,
          showOnlySelected: !!sig.selectedOptionId,
        });
      }
      if (block.type === "pricing") {
        return renderPricingTable(block);
      }
      return "";
    })
    .join("\n");

  const selectedSummary =
    sig.selectedOptionSnapshot && sig.selectedOptionId
      ? (() => {
          const pricingBlock = blocks.find((b) => b.type === "pricing_options");
          const taxRate =
            pricingBlock?.type === "pricing_options"
              ? pricingBlock.tax_rate
              : 0;
          const currency =
            pricingBlock?.type === "pricing_options"
              ? pricingBlock.currency
              : fm.currency;
          const { total } = computeOptionTotal(
            sig.selectedOptionSnapshot,
            taxRate
          );
          return `
<div class="pdf-selected-summary">
  Selected option: <strong>${escHtml(sig.selectedOptionSnapshot.name)}</strong> —
  <strong>${formatCurrency(total, currency)}</strong>
</div>`;
        })()
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escHtml(fm.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6; }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 48px; }
    h1 { font-size: 22pt; margin-bottom: 4px; }
    h2 { font-size: 15pt; margin: 32px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 12pt; margin: 20px 0 6px; }
    p { margin-bottom: 12px; }
    ul, ol { margin: 8px 0 12px 24px; }
    li { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
    th { background: #f5f5f5; padding: 8px; text-align: left; border: 1px solid #ddd; }
    td { padding: 7px 8px; border: 1px solid #e5e5e5; vertical-align: top; }
    .amount { text-align: right; }
    .total-row td { font-weight: bold; background: #f9f9f9; }
    .subtotal-row td, .tax-row td { color: #555; font-size: 10pt; }
    .option-card { border: 1px solid #ddd; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
    .option-card.selected { border-color: #1a1a1a; border-width: 2px; }
    .option-name { font-size: 14pt; margin-bottom: 4px; }
    .option-tagline { color: #666; font-size: 10pt; margin-bottom: 12px; }
    .option-total { font-size: 20pt; font-weight: bold; margin: 12px 0; }
    .feature-list { list-style: none; margin: 12px 0; padding: 0; }
    .include { color: #1a7a1a; margin-bottom: 4px; }
    .exclude { color: #888; margin-bottom: 4px; }
    .best-for { font-style: italic; color: #555; margin-top: 12px; font-size: 10pt; }
    .selected-note { background: #f9f9f9; border-left: 3px solid #1a1a1a; padding: 8px 12px; margin-bottom: 16px; font-size: 10pt; }
    .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 32px; }
    .header-title { font-size: 22pt; font-weight: bold; }
    .header-meta { font-size: 10pt; color: #555; margin-top: 8px; }
    .sig-block { margin-top: 48px; padding-top: 24px; border-top: 2px solid #1a1a1a; page-break-inside: avoid; }
    .sig-block h2 { border: none; font-size: 13pt; margin-bottom: 16px; }
    .sig-image { max-height: 80px; max-width: 300px; display: block; margin-bottom: 8px; }
    .sig-name { font-size: 12pt; font-weight: bold; border-top: 1px solid #aaa; padding-top: 4px; margin-top: 4px; }
    .sig-meta { font-size: 9pt; color: #666; margin-top: 16px; line-height: 1.8; font-family: monospace; }
    .pdf-selected-summary { background: #f0f0f0; padding: 10px 16px; border-radius: 4px; margin-bottom: 24px; font-size: 11pt; }
    blockquote { border-left: 3px solid #ccc; padding-left: 16px; color: #555; margin: 16px 0; }
    .prose blockquote { margin-left: 0; }
    code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-size: 9pt; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-title">${escHtml(fm.title)}</div>
    <div class="header-meta">
      From: ${escHtml(fm.author.name)}, ${escHtml(fm.author.company)} &nbsp;|&nbsp;
      To: ${escHtml(fm.client.contact)}, ${escHtml(fm.client.name)} &nbsp;|&nbsp;
      Expires: ${escHtml(fm.expires_at)}
    </div>
  </div>

  ${selectedSummary}
  ${bodyBlocks}

  <div class="sig-block">
    <h2>Signature</h2>
    ${sig.signaturePng ? `<img class="sig-image" src="${sig.signaturePng}" alt="Signature" />` : ""}
    <div class="sig-name">${escHtml(sig.typedName)}</div>
    <div class="sig-meta">
      Signed at: ${escHtml(sig.signedAt)}<br>
      IP address: ${escHtml(sig.ip)}<br>
      Document hash (SHA-256): ${escHtml(proposal.markdownHash)}<br>
      Audit hash: ${escHtml(sig.auditHash)}
    </div>
  </div>
</div>
</body>
</html>`;
}
