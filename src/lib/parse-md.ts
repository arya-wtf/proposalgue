import matter from "gray-matter";
import { load as yamlLoad } from "js-yaml";
import { sha256 } from "./hash";
import type {
  ParsedBlock,
  ParsedProposal,
  PricingBlock,
  PricingOptionsBlock,
  SignatureBlock,
  ProposalFrontmatter,
} from "./types";

// Extract fenced code blocks with a specific info string
function extractFencedBlocks(
  body: string
): Array<{ type: string; content: string; fullMatch: string }> {
  const blocks: Array<{ type: string; content: string; fullMatch: string }> =
    [];
  const regex = /^```(\w+)\n([\s\S]*?)^```/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    blocks.push({
      type: match[1] ?? "",
      content: match[2] ?? "",
      fullMatch: match[0] ?? "",
    });
  }
  return blocks;
}

function parsePricingBlock(content: string): PricingBlock {
  const data = yamlLoad(content) as any;
  if (!data.currency) throw new Error("pricing block missing currency");
  if (!Array.isArray(data.line_items) || data.line_items.length === 0)
    throw new Error("pricing block missing line_items");
  return {
    type: "pricing",
    currency: data.currency,
    tax_rate: data.tax_rate ?? 0,
    line_items: data.line_items.map((li: any) => ({
      label: li.label,
      quantity: Number(li.quantity),
      rate: Number(li.rate),
      taxable: li.taxable !== false,
    })),
  };
}

function parsePricingOptionsBlock(content: string): PricingOptionsBlock {
  const data = yamlLoad(content) as any;
  if (!data.currency) throw new Error("pricing_options block missing currency");
  if (!Array.isArray(data.options))
    throw new Error("pricing_options block missing options array");
  if (data.options.length < 2 || data.options.length > 5)
    throw new Error(
      `pricing_options must have 2–5 options, got ${data.options.length}`
    );

  const ids = new Set<string>();
  let recommendedCount = 0;

  const options = data.options.map((opt: any, i: number) => {
    if (!opt.id) throw new Error(`Option at index ${i} missing id`);
    if (!opt.name) throw new Error(`Option "${opt.id}" missing name`);
    if (ids.has(opt.id))
      throw new Error(`Duplicate option id "${opt.id}"`);
    ids.add(opt.id);
    if (!Array.isArray(opt.line_items) || opt.line_items.length === 0)
      throw new Error(`Option "${opt.id}" missing line_items`);
    if (opt.recommended) recommendedCount++;
    return {
      id: opt.id,
      name: opt.name,
      tagline: opt.tagline,
      recommended: opt.recommended ?? false,
      line_items: opt.line_items.map((li: any) => ({
        label: li.label,
        quantity: Number(li.quantity),
        rate: Number(li.rate),
        taxable: li.taxable !== false,
      })),
      includes: opt.includes ?? [],
      excludes: opt.excludes ?? [],
      best_for: opt.best_for,
    };
  });

  if (recommendedCount > 1)
    throw new Error("pricing_options: at most one option can have recommended: true");

  return {
    type: "pricing_options",
    currency: data.currency,
    tax_rate: data.tax_rate ?? 0,
    options,
  };
}

function parseSignatureBlock(content: string): SignatureBlock {
  const data = yamlLoad(content) as any;
  return {
    type: "signature",
    required: data.required ?? true,
    select_pricing_option: data.select_pricing_option ?? false,
    signers: (data.signers ?? []).map((s: any) => ({
      role: s.role,
      name_placeholder: s.name_placeholder ?? "Your full name",
    })),
  };
}

export async function parseProposal(raw: string): Promise<ParsedProposal> {
  const { data: fm, content: body } = matter(raw);

  // Support expires_in_days → compute expires_at from today
  if (!fm.expires_at && fm.expires_in_days) {
    const d = new Date();
    d.setDate(d.getDate() + Number(fm.expires_in_days));
    fm.expires_at = d.toISOString().slice(0, 10);
  }

  // Validate frontmatter
  const requiredFields = ["slug", "title", "currency", "expires_at"];
  for (const f of requiredFields) {
    if (!fm[f]) throw new Error(`Frontmatter missing required field: ${f}`);
  }
  if (!fm.client?.email)
    throw new Error("Frontmatter missing client.email");
  if (!fm.author?.email)
    throw new Error("Frontmatter missing author.email");

  const frontmatter = fm as ProposalFrontmatter;
  const fencedBlocks = extractFencedBlocks(body);

  // Build blocks by splitting on fenced blocks, maintaining order
  const blocks: ParsedBlock[] = [];
  let remaining = body;

  for (const fb of fencedBlocks) {
    const idx = remaining.indexOf(fb.fullMatch);
    if (idx > 0) {
      const mdContent = remaining.slice(0, idx).trim();
      if (mdContent) blocks.push({ type: "markdown", content: mdContent });
    }
    if (fb.type === "pricing_options") {
      blocks.push(parsePricingOptionsBlock(fb.content));
    } else if (fb.type === "pricing") {
      blocks.push(parsePricingBlock(fb.content));
    } else if (fb.type === "signature") {
      blocks.push(parseSignatureBlock(fb.content));
    } else {
      // Unknown fenced block — pass through as markdown
      blocks.push({ type: "markdown", content: fb.fullMatch });
    }
    remaining = remaining.slice(idx + fb.fullMatch.length);
  }

  if (remaining.trim()) {
    blocks.push({ type: "markdown", content: remaining.trim() });
  }

  const markdownHash = await sha256(raw);

  return { frontmatter, blocks, rawMarkdown: raw, markdownHash };
}
