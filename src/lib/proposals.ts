import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parseProposal } from "./parse-md";
import type { ParsedProposal } from "./types";

// proposals/ sits at the project root. Use process.cwd() so it works both in
// dev (cwd = project root) and on Vercel (cwd = /var/task, bundled layout
// flattens __dirname to /var/task/api which makes relative paths unreliable).
const PROPOSALS_DIR = process.env.PROPOSALS_DIR || join(process.cwd(), "proposals");

export async function loadProposal(slug: string): Promise<ParsedProposal> {
  // Sanitize slug to prevent path traversal
  if (!/^[\w-]+$/.test(slug)) throw new Error("Invalid slug");
  const filePath = join(PROPOSALS_DIR, `${slug}.md`);
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`Proposal not found: ${slug}`);
  }
  return parseProposal(raw);
}

export function listSlugs(): string[] {
  try {
    return readdirSync(PROPOSALS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}
