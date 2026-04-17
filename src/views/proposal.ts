import { marked } from "marked";
import { layout, escHtml } from "./layout";
import { renderPricingOptions } from "./components/pricing-options";
import { renderPricingTable } from "./components/pricing-table";
import type { ParsedProposal, ParsedBlock } from "../lib/types";

marked.setOptions({ gfm: true, breaks: false });

function renderBlocks(
  blocks: ParsedBlock[],
  opts: { isPdf?: boolean; selectedOptionId?: string | null; showOnlySelected?: boolean } = {}
): string {
  return blocks
    .map((block) => {
      if (block.type === "markdown") {
        return `<div class="prose">${marked.parse(block.content)}</div>`;
      }
      if (block.type === "pricing_options") {
        return renderPricingOptions(block, opts);
      }
      if (block.type === "pricing") {
        return renderPricingTable(block);
      }
      if (block.type === "signature") {
        if (opts.isPdf) return ""; // signature rendered separately in PDF view
        return `<div id="signature-section" class="signature-section">
  <button id="sign-btn" class="btn-sign" onclick="openSignModal()">
    Sign this proposal
  </button>
  <p class="sign-hint" id="sign-hint" style="display:none">Please select a pricing option above before signing.</p>
</div>`;
      }
      return "";
    })
    .join("\n");
}

export function renderProposalPage(
  proposal: ParsedProposal,
  shareToken: string,
  isPdf = false,
  selectedOptionIdForPdf: string | null = null
): string {
  const { frontmatter: fm, blocks } = proposal;

  // Find if there's a pricing_options block for JS init
  const pricingOptionsBlock = blocks.find((b) => b.type === "pricing_options");
  const hasOptions = !!pricingOptionsBlock;
  const recommendedId =
    pricingOptionsBlock?.type === "pricing_options"
      ? (pricingOptionsBlock.options.find((o) => o.recommended)?.id ?? null)
      : null;

  const content = renderBlocks(blocks, {
    isPdf,
    selectedOptionId: isPdf ? selectedOptionIdForPdf : recommendedId,
    showOnlySelected: isPdf && !!selectedOptionIdForPdf,
  });

  const header = `
<header class="proposal-header">
  <div class="header-meta">
    <span class="author-company">${escHtml(fm.author.company)}</span>
    <span class="proposal-title">${escHtml(fm.title)}</span>
  </div>
  <div class="header-expires">Valid until ${escHtml(fm.expires_at)}</div>
</header>`;

  const modal = isPdf
    ? ""
    : `
<div id="sign-modal" class="modal-overlay" style="display:none" role="dialog" aria-modal="true">
  <div class="modal">
    <button class="modal-close" onclick="closeSignModal()" aria-label="Close">×</button>
    <h2 class="modal-title">Sign Proposal</h2>
    <p class="modal-selected-summary" id="modal-summary"></p>

    <div class="sig-tabs">
      <button class="sig-tab active" id="tab-draw" onclick="switchTab('draw')">Draw</button>
      <button class="sig-tab" id="tab-type" onclick="switchTab('type')">Type</button>
    </div>

    <div id="panel-draw">
      <canvas id="sig-canvas" width="560" height="180"></canvas>
      <button class="btn-clear" onclick="clearSignature()">Clear</button>
    </div>
    <div id="panel-type" style="display:none">
      <input id="typed-sig" type="text" placeholder="Type your full name" class="typed-sig-input" oninput="updateTypedSig()" />
      <canvas id="sig-canvas-type" width="560" height="180" style="display:none"></canvas>
    </div>

    <div class="form-group">
      <label for="typed-name">Full legal name</label>
      <input type="text" id="typed-name" placeholder="${fm.client.contact ? escHtml(fm.client.contact) : "Your full legal name"}" />
    </div>

    <div id="modal-error" class="modal-error" style="display:none"></div>

    <button class="btn-submit" id="submit-btn" onclick="submitSignature()">
      Submit Signature
    </button>
  </div>
</div>`;

  const scripts = isPdf
    ? ""
    : `
<script>
  window.__PROPOSAL__ = {
    slug: "${escHtml(fm.slug)}",
    token: "${escHtml(shareToken)}",
    hasOptions: ${hasOptions},
    recommendedId: ${recommendedId ? `"${escHtml(recommendedId)}"` : "null"}
  };
</script>
<script src="/signature_pad.min.js"></script>
<script src="/viewer.js"></script>`;

  const body = `
${header}
<main class="proposal-main">
  ${content}
</main>
${modal}`;

  return layout(fm.title, body, {
    isPdf,
    extraHead: scripts
      ? `<script src="/signature_pad.min.js" defer></script>
         <script src="/viewer.js" defer></script>
         <script>
           window.__PROPOSAL__ = {
             slug: "${escHtml(fm.slug)}",
             token: "${escHtml(shareToken)}",
             hasOptions: ${hasOptions},
             recommendedId: ${recommendedId ? `"${escHtml(recommendedId)}"` : "null"}
           };
         </script>`
      : "",
  });
}

export function renderSignedPage(proposal: ParsedProposal): string {
  const { frontmatter: fm } = proposal;
  const body = `
<div class="signed-page">
  <div class="signed-card">
    <div class="signed-icon">✓</div>
    <h1>Proposal Signed</h1>
    <p>Thank you, <strong>${escHtml(fm.client.contact)}</strong>.</p>
    <p>A copy of your signed proposal has been sent to <strong>${escHtml(fm.client.email)}</strong>.</p>
    <p class="signed-next">
      <strong>What happens next:</strong><br>
      ${escHtml(fm.author.name)} from ${escHtml(fm.author.company)} will send you the contract and first invoice within 24 hours.
    </p>
  </div>
</div>`;
  return layout(`Signed — ${fm.title}`, body);
}
