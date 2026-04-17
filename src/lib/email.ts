import { env } from "../env";
import type { ParsedProposal, SignatureData } from "./types";
import { computeOptionTotal, formatCurrency } from "./pricing";

async function sendEmail(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: string }[];
}): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log("[email] No RESEND_API_KEY — skipping send, logging instead:");
    console.log(`  To: ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    return;
  }

  const body: any = {
    from: payload.from,
    to: [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  };

  if (payload.attachments?.length) {
    body.attachments = payload.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
}

export async function sendClientSignedEmail(
  proposal: ParsedProposal,
  sig: SignatureData,
  pdfBuffer: Buffer
): Promise<void> {
  const fm = proposal.frontmatter;
  const pricingBlock = proposal.blocks.find((b) => b.type === "pricing_options");
  const taxRate =
    pricingBlock?.type === "pricing_options" ? pricingBlock.tax_rate : 0;
  const currency =
    pricingBlock?.type === "pricing_options"
      ? pricingBlock.currency
      : fm.currency;

  const optionLine =
    sig.selectedOptionSnapshot
      ? (() => {
          const { total } = computeOptionTotal(sig.selectedOptionSnapshot, taxRate);
          return `You selected: <strong>${sig.selectedOptionSnapshot.name}</strong> — ${formatCurrency(total, currency)}`;
        })()
      : "";

  const html = `
<p>Hi ${fm.client.contact},</p>
<p>Thanks for signing the proposal for <strong>${fm.title}</strong>.</p>
${optionLine ? `<p>${optionLine}</p>` : ""}
<p>A signed PDF copy is attached to this email.</p>
<p><strong>Next steps:</strong></p>
<ol>
  <li>We'll send you the contract and Invoice #1 (50% deposit) within 24 hours.</li>
  <li>Once the deposit clears, we'll book the kickoff call.</li>
</ol>
<p>Questions? Reply to this email.</p>
<p>— ${fm.author.name}, ${fm.author.company}</p>`;

  const optionText =
    sig.selectedOptionSnapshot
      ? (() => {
          const { total } = computeOptionTotal(sig.selectedOptionSnapshot, taxRate);
          return `You selected: ${sig.selectedOptionSnapshot.name} — ${formatCurrency(total, currency)}\n\n`;
        })()
      : "";

  const text = `Hi ${fm.client.contact},\n\nThanks for signing the proposal for "${fm.title}".\n\n${optionText}A signed PDF copy is attached.\n\nNext steps:\n1. We'll send you the contract and Invoice #1 within 24 hours.\n2. Once the deposit clears, we'll book the kickoff call.\n\nQuestions? Reply to this email.\n\n— ${fm.author.name}, ${fm.author.company}`;

  await sendEmail({
    from: `${fm.author.name} <${env.AUTHOR_EMAIL}>`,
    to: fm.client.email,
    subject: `Signed — ${fm.title}`,
    html,
    text,
    attachments: [
      {
        filename: `${fm.slug}-signed.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });
}

export async function sendAuthorSignedNotification(
  proposal: ParsedProposal,
  sig: SignatureData,
  pdfBuffer: Buffer
): Promise<void> {
  const fm = proposal.frontmatter;
  const pricingBlock = proposal.blocks.find((b) => b.type === "pricing_options");
  const taxRate =
    pricingBlock?.type === "pricing_options" ? pricingBlock.tax_rate : 0;
  const currency =
    pricingBlock?.type === "pricing_options"
      ? pricingBlock.currency
      : fm.currency;

  const optionLine =
    sig.selectedOptionSnapshot
      ? (() => {
          const { total } = computeOptionTotal(sig.selectedOptionSnapshot, taxRate);
          return `Selected option: ${sig.selectedOptionSnapshot.name} — ${formatCurrency(total, currency)}`;
        })()
      : "No pricing option (flat pricing)";

  const text = `${fm.client.contact} (${fm.client.email}) just signed the proposal for "${fm.title}".

${optionLine}
Signed at: ${sig.signedAt}
IP: ${sig.ip}
User-agent: ${sig.userAgent}

Next action: send contract + invoice within 24h.

Document hash: ${proposal.markdownHash}
Audit hash: ${sig.auditHash}`;

  const html = `
<p><strong>${fm.client.contact}</strong> (${fm.client.email}) just signed the proposal for <strong>${fm.title}</strong>.</p>
<p>${optionLine}<br>
Signed at: ${sig.signedAt}<br>
IP: ${sig.ip}<br>
UA: ${sig.userAgent}</p>
<p><strong>Next action:</strong> send contract + invoice within 24h.</p>
<p><small>Doc hash: ${proposal.markdownHash}<br>Audit hash: ${sig.auditHash}</small></p>`;

  const optionName = sig.selectedOptionSnapshot?.name ?? "flat pricing";

  await sendEmail({
    from: `Proposal App <${env.AUTHOR_EMAIL}>`,
    to: env.AUTHOR_EMAIL,
    subject: `✅ Proposal signed — ${fm.client.name} picked ${optionName}`,
    html,
    text,
    attachments: [
      {
        filename: `${fm.slug}-signed.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });
}
