import { Hono } from "hono";
import { loadProposal, listSlugs } from "../lib/proposals";
import {
  generateShareToken,
  verifyShareToken,
  isExpired,
} from "../lib/tokens";
import { renderProposalPage, renderSignedPage } from "../views/proposal";

const pub = new Hono();

pub.get("/p/:slug", async (c) => {
  const { slug } = c.req.param();
  const token = c.req.query("t") ?? "";

  let proposal;
  try {
    proposal = await loadProposal(slug);
  } catch (e: any) {
    return c.html(errorPage("Not Found", e.message), 404);
  }

  const { frontmatter: fm } = proposal;

  // Expired?
  if (isExpired(fm.expires_at)) {
    return c.html(
      errorPage(
        "Proposal Expired",
        `This proposal expired on ${fm.expires_at}. Please contact ${fm.author.name} for a new one.`
      ),
      410
    );
  }

  // Verify token
  const valid = await verifyShareToken(slug, fm.expires_at, token);
  if (!valid) {
    return c.html(errorPage("Invalid Link", "This link is invalid or has expired."), 403);
  }

  const html = renderProposalPage(proposal, token);
  return c.html(html);
});

pub.get("/p/:slug/signed", async (c) => {
  const { slug } = c.req.param();
  let proposal;
  try {
    proposal = await loadProposal(slug);
  } catch {
    return c.html(errorPage("Not Found", "Proposal not found."), 404);
  }
  return c.html(renderSignedPage(proposal));
});

function errorPage(title: string, message: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title>
  <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fafafa;}
  .box{background:#fff;border-radius:12px;padding:48px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
  h1{font-size:22px;margin-bottom:12px;}p{color:#52525b;}</style>
  </head><body><div class="box"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

export default pub;
