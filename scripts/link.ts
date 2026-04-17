#!/usr/bin/env bun
/**
 * Generate a shareable link for a proposal.
 * Usage: bun scripts/link.ts <slug>
 */
import { loadProposal } from "../src/lib/proposals";
import { generateShareToken } from "../src/lib/tokens";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: bun scripts/link.ts <slug>");
  process.exit(1);
}

const baseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";

try {
  const proposal = await loadProposal(slug);
  const fm = proposal.frontmatter;
  const token = await generateShareToken(slug, fm.expires_at);
  const link = `${baseUrl}/p/${slug}?t=${token}`;
  console.log(`\nProposal: ${fm.title}`);
  console.log(`Client:   ${fm.client.contact} <${fm.client.email}>`);
  console.log(`Expires:  ${fm.expires_at}`);
  console.log(`\nShare link:\n${link}\n`);
} catch (e: any) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
