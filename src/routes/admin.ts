import { Hono } from "hono";
import { listSlugs, loadProposal } from "../lib/proposals";
import { generateShareToken, isExpired } from "../lib/tokens";
import { env } from "../env";
import { renderProposalPage } from "../views/proposal";
import { escHtml } from "../views/layout";
import { layout } from "../views/layout";

const admin = new Hono();

// Auth middleware
admin.use("/admin/*", async (c, next) => {
  // Login page is always public (otherwise redirect loops on itself)
  if (c.req.path === "/admin/login") return next();

  // In dev, allow without token
  if (env.NODE_ENV === "development" && !env.ADMIN_TOKEN) {
    return next();
  }

  const cookie = c.req.header("cookie") ?? "";
  const tokenCookie = cookie.match(/admin_token=([^;]+)/)?.[1] ?? "";
  const queryToken = c.req.query("token") ?? "";

  if (
    (env.ADMIN_TOKEN && tokenCookie === env.ADMIN_TOKEN) ||
    (env.ADMIN_TOKEN && queryToken === env.ADMIN_TOKEN)
  ) {
    // Set cookie if came via query
    if (queryToken && !tokenCookie) {
      c.header(
        "Set-Cookie",
        `admin_token=${env.ADMIN_TOKEN}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
      );
    }
    return next();
  }

  // Redirect to login
  return c.redirect("/admin/login");
});

admin.get("/admin/login", (c) => {
  const body = `
<div style="max-width:400px;margin:80px auto;padding:40px 32px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <h1 style="font-size:22px;margin-bottom:24px;font-family:system-ui,sans-serif">Admin Login</h1>
  <form method="GET" action="/admin">
    <input name="token" type="password" placeholder="Admin token" required
      style="width:100%;padding:10px 14px;border:1px solid #e4e4e7;border-radius:6px;font-size:15px;margin-bottom:12px;font-family:system-ui,sans-serif">
    <button type="submit"
      style="width:100%;background:#0f0f0f;color:#fff;border:none;padding:12px;border-radius:6px;font-size:15px;cursor:pointer;font-family:system-ui,sans-serif">
      Enter
    </button>
  </form>
</div>`;
  return c.html(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Admin Login</title></head><body style="background:#fafafa;font-family:system-ui,sans-serif;">${body}</body></html>`
  );
});

admin.get("/admin", async (c) => {
  const slugs = listSlugs();

  const rows = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const p = await loadProposal(slug);
        const fm = p.frontmatter;
        const expired = isExpired(fm.expires_at);
        const token = await generateShareToken(slug, fm.expires_at);
        const link = `${env.PUBLIC_BASE_URL}/p/${slug}?t=${token}`;
        const statusTag = expired
          ? `<span class="tag tag-expired">Expired</span>`
          : `<span class="tag tag-active">Active</span>`;
        return `<tr>
          <td>${escHtml(slug)}</td>
          <td>${escHtml(fm.client.name)}</td>
          <td>${escHtml(fm.title)}</td>
          <td>${escHtml(fm.expires_at)}</td>
          <td>${statusTag}</td>
          <td>
            <button class="copy-link" onclick="copyLink('${escHtml(link)}')">Copy Link</button>
            <a href="/admin/preview/${escHtml(slug)}" style="margin-left:8px;font-size:13px">Preview</a>
          </td>
        </tr>`;
      } catch {
        return `<tr><td>${escHtml(slug)}</td><td colspan="5" style="color:#888">Parse error</td></tr>`;
      }
    })
  );

  const body = `
<div class="admin-page">
  <h1 class="admin-title">Proposals</h1>
  ${
    rows.length === 0
      ? `<p style="color:#666">No proposals found. Add .md files to the <code>proposals/</code> directory.</p>`
      : `<table class="admin-table">
          <thead><tr><th>Slug</th><th>Client</th><th>Title</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>`
  }
</div>
<script>
function copyLink(url) {
  navigator.clipboard.writeText(url).then(function() {
    alert('Link copied to clipboard!\\n\\n' + url);
  });
}
</script>`;

  return c.html(layout("Proposals — Admin", body));
});

admin.get("/admin/preview/:slug", async (c) => {
  const { slug } = c.req.param();
  let proposal;
  try {
    proposal = await loadProposal(slug);
  } catch (e: any) {
    return c.text(`Error: ${e.message}`, 404);
  }
  const fm = proposal.frontmatter;
  const token = await generateShareToken(slug, fm.expires_at);
  const html = renderProposalPage(proposal, token);
  return c.html(html);
});

export default admin;
