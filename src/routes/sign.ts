import { Hono } from "hono";
import { loadProposal } from "../lib/proposals";
import { verifyShareToken, isExpired } from "../lib/tokens";
import { sha256 } from "../lib/hash";
import { computeOptionTotal } from "../lib/pricing";
import { generatePdf } from "../lib/pdf";
import { sendClientSignedEmail, sendAuthorSignedNotification } from "../lib/email";
import type { SignatureData, PricingOption } from "../lib/types";

// Simple in-memory rate limiter: max 5 attempts per IP per minute
const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

const sign = new Hono();

sign.post("/api/proposals/:slug/sign", async (c) => {
  const { slug } = c.req.param();
  const ip =
    c.req.header("x-forwarded-for")?.split(",").at(0)?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown";
  const userAgent = c.req.header("user-agent") ?? "";

  if (!checkRate(ip)) {
    return c.json({ ok: false, error: "Too many requests. Try again in a minute." }, 429);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const { signature_png, signature_svg, typed_name, selected_option_id, share_token } = body;

  if (!typed_name?.trim()) {
    return c.json({ ok: false, error: "typed_name is required." }, 400);
  }
  if (!signature_png) {
    return c.json({ ok: false, error: "signature_png is required." }, 400);
  }

  // Validate PNG size (approx 2 MB base64 = ~2.7 MB string)
  if (typeof signature_png === "string" && signature_png.length > 3_000_000) {
    return c.json({ ok: false, error: "Signature image too large." }, 400);
  }

  let proposal;
  try {
    proposal = await loadProposal(slug);
  } catch {
    return c.json({ ok: false, error: "Proposal not found." }, 404);
  }

  const { frontmatter: fm } = proposal;

  if (isExpired(fm.expires_at)) {
    return c.json({ ok: false, error: "This proposal has expired." }, 410);
  }

  const tokenValid = await verifyShareToken(slug, fm.expires_at, share_token ?? "");
  if (!tokenValid) {
    return c.json({ ok: false, error: "Invalid or expired share token." }, 403);
  }

  // Pricing option handling
  const pricingOptionsBlock = proposal.blocks.find(
    (b) => b.type === "pricing_options"
  );
  let selectedOption: PricingOption | null = null;
  let selectedOptionTotal: number | null = null;

  if (pricingOptionsBlock?.type === "pricing_options") {
    if (!selected_option_id) {
      return c.json({ ok: false, error: "Please select a pricing option." }, 400);
    }
    const found = pricingOptionsBlock.options.find(
      (o) => o.id === selected_option_id
    );
    if (!found) {
      return c.json({ ok: false, error: "Invalid pricing option selected." }, 400);
    }
    selectedOption = found;
    const { total } = computeOptionTotal(found, pricingOptionsBlock.tax_rate);
    selectedOptionTotal = total;
  }

  const signedAt = new Date().toISOString();

  // Build canonical audit payload
  const auditPayload = JSON.stringify({
    slug,
    markdown_sha256: proposal.markdownHash,
    typed_name: typed_name.trim(),
    selected_option_id: selected_option_id ?? null,
    selected_option_total: selectedOptionTotal,
    signed_at: signedAt,
    ip,
    user_agent: userAgent,
  });
  const auditHash = await sha256(auditPayload);

  const sig: SignatureData = {
    id: crypto.randomUUID(),
    typedName: typed_name.trim(),
    signaturePng: signature_png,
    signatureSvg: signature_svg ?? "",
    selectedOptionId: selected_option_id ?? null,
    selectedOptionSnapshot: selectedOption,
    selectedOptionTotal,
    signedAt,
    ip,
    userAgent,
    auditHash,
    auditPayload,
  };

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePdf(proposal, sig);
  } catch (e: any) {
    console.error("[pdf] generation failed:", e.message);
    return c.json(
      { ok: false, error: "PDF generation failed. Please try again." },
      500
    );
  }

  // Send emails (don't let email failure block sign success response)
  const emailErrors: string[] = [];
  try {
    await sendClientSignedEmail(proposal, sig, pdfBuffer);
  } catch (e: any) {
    console.error("[email] client email failed:", e.message);
    emailErrors.push("client");
  }
  try {
    await sendAuthorSignedNotification(proposal, sig, pdfBuffer);
  } catch (e: any) {
    console.error("[email] author email failed:", e.message);
    emailErrors.push("author");
  }

  if (emailErrors.length) {
    console.warn(`[sign] Email failed for: ${emailErrors.join(", ")}. Signature was recorded.`);
  }

  return c.json({
    ok: true,
    redirect: `/p/${slug}/signed`,
  });
});

export default sign;
