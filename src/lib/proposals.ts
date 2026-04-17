import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parseProposal } from "./parse-md";
import type { ParsedProposal } from "./types";

// proposals/ dir at project root — __dirname is src/lib/, so go up two levels
const PROPOSALS_DIR = join(__dirname, "..", "..", "proposals");

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
