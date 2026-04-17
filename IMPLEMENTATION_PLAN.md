# Proposal App — Implementation Plan

Stack: **Bun + TypeScript + Hono**, deployed on **Vercel**, no database, no file storage.
Proposals live as `.md` files committed to the repo. Every update = new commit + redeploy.

---

## 1. User Journey

```
Author (you)                                       Client
────────────                                       ──────
1. Write / edit proposals/{slug}.md with Claude Code
2. git commit + push to GitHub
3. Vercel auto-deploys
4. Share link: {BASE}/p/{slug}?t={token} ─────────→ 5. Opens link
                                                     6. Reads proposal
                                                     7. Picks pricing option
                                                     8. Draws + types signature
                                                     9. Submits
10. Email lands in hello@elux.space ←──────────────┘
    with signed PDF attached +
    link back to the proposal URL
11. You save the PDF locally (manual archive)
```

Client also receives an email with their copy of the signed PDF.

---

## 2. Tech Choices

| Concern | Choice | Why |
|---|---|---|
| Runtime | **Bun** locally, **Vercel Node** in prod | Bun is dev-friendly, Vercel runs Node functions. Hono works on both. |
| HTTP framework | **Hono** + `@hono/vercel` adapter | Tiny, typed, runs on any runtime |
| Storage | **None.** `.md` files in `/proposals/` committed to repo | Vercel FS is read-only; repo = content store |
| State between requests | **None.** Fully stateless | Simplest. Every sign is an independent email event. |
| Admin auth | `ADMIN_TOKEN` env var (optional — admin UI is just for local preview) | Git IS the admin |
| Markdown | `gray-matter` + `marked` + `js-yaml` | Frontmatter + fenced YAML blocks |
| Signature capture | `signature_pad` (browser) → PNG + SVG | Touch + mouse |
| PDF | **`puppeteer-core` + `@sparticuz/chromium`** | Vercel serverless-compatible (~50 MB) |
| Email | **Resend API** from `hello@elux.space` | Verified domain, attaches PDF |
| Share-link tokens | **HMAC-SHA256(slug, SECRET)** | Deterministic, no DB needed |
| Hashing / audit | `crypto.subtle` (Web Crypto) | sha256 of signed payload → goes into PDF |

---

## 3. Repo Layout

```
proposal/
├── package.json
├── tsconfig.json
├── vercel.json                 # runtime = nodejs20.x, max duration for /sign route
├── .env.local                  # dev only
├── .env.example                # committed
├── proposals/                  # THE CONTENT STORE
│   ├── client-slug-project.md
│   └── another-client.md
├── api/                        # Vercel serverless entry points
│   └── [[...route]].ts         # single catch-all → Hono app
├── src/
│   ├── app.ts                  # Hono app definition (exported)
│   ├── env.ts                  # typed env loader
│   ├── lib/
│   │   ├── types.ts
│   │   ├── parse-md.ts         # frontmatter + fenced blocks → ParsedProposal
│   │   ├── pricing.ts          # computeOptionTotal, computeFlatTotal
│   │   ├── proposals.ts        # loadProposal(slug) → reads proposals/{slug}.md from disk
│   │   ├── tokens.ts           # HMAC-based share token + verify
│   │   ├── hash.ts             # sha256 helpers
│   │   ├── pdf.ts              # renderPdf(html) via puppeteer-core + sparticuz chromium
│   │   ├── render.ts           # renders HTML string for PDF (no HTTP round-trip)
│   │   └── email.ts            # Resend wrapper — sendClientEmail, sendAuthorEmail
│   ├── routes/
│   │   ├── public.ts           # GET /p/:slug, GET /p/:slug/signed
│   │   ├── sign.ts             # POST /api/proposals/:slug/sign
│   │   └── admin.ts            # GET /admin, GET /admin/preview/:slug — local / gated
│   └── views/
│       ├── layout.tsx
│       ├── proposal.tsx        # client-facing view
│       ├── signed.tsx          # thank-you page
│       ├── pdf.tsx             # print-only template for Puppeteer
│       └── components/
│           ├── PricingOptions.tsx
│           ├── PricingTable.tsx
│           └── SignatureModal.tsx   # server-rendered shell, hydrated by viewer.js
└── public/
    ├── signature-pad.min.js    # vendored
    ├── viewer.js               # selection state + sign submit
    └── styles.css
```

No `data/` directory. No uploads. No DB.

---

## 4. The `proposals/{slug}.md` Contract

The file IS the proposal. Frontmatter drives everything:

```yaml
---
slug: "client-slug-project"
title: "Project Proposal — Client Name"
client:
  name: "Client Company"
  contact: "Primary Contact"
  email: "contact@client.com"
author:
  name: "Arya Pradana"
  company: "Elux Space"
  email: "hello@elux.space"
currency: "USD"
expires_at: "2026-05-01"   # absolute date — simpler than expires_in_days when deploys are independent
---
```

Rules:
- `slug` must match the filename (`client-slug-project.md`).
- `expires_at` is an ISO date. Server rejects `/p/:slug` after this date with 410.
- `pricing_options` / `pricing` / `signature` fenced blocks inside the body work exactly as in your sample. No changes to the content format.

Adding a proposal = create `proposals/{slug}.md`, commit, push. Vercel redeploys. Link is live.
Updating = edit the same file, commit, push. (Warning: if already signed, edits are silent — there's no server-side "freeze". See §8.)

---

## 5. Share-Link Tokens (no DB needed)

Since we have no database, the share token is **derived** from the slug and a server secret:

```ts
token = base64url(HMAC_SHA256(SHARE_SECRET, `${slug}:${expires_at}`))
```

- Deterministic: same slug always yields the same token (until `expires_at` changes).
- Not guessable without `SHARE_SECRET`.
- Can be pre-computed locally with a small CLI:

```bash
bun scripts/link.ts client-slug-project
# → https://proposal.elux.space/p/client-slug-project?t=abc123...
```

You copy the URL, paste into the email you send the client.

Server-side, `/p/:slug` verifies `?t=` against the expected HMAC. Invalid or expired → 410.

---

## 6. Routes

### Public

| Method | Path | Behavior |
|---|---|---|
| GET | `/p/:slug` | Load `proposals/:slug.md`. Verify `?t=` token + expiry. Render proposal view. |
| GET | `/p/:slug/signed` | Static thank-you page. Client hits this after POST succeeds. |

### API

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/proposals/:slug/sign` | Core flow — see §7. |

### Admin (optional, for local preview)

| Method | Path | Behavior |
|---|---|---|
| GET | `/admin?token=...` | List all `.md` files under `proposals/`. Gated by `ADMIN_TOKEN`. |
| GET | `/admin/preview/:slug?token=...` | Render proposal without requiring share token. Useful before committing. |

On prod this is protected; in dev, no token needed if `NODE_ENV=development`.

No upload route. No approve route. Git is the workflow.

---

## 7. Sign Flow (the only stateful moment — and it's transient)

`POST /api/proposals/:slug/sign`

Request body:
```ts
{
  signature_png: string;    // data URL
  signature_svg: string;    // raw SVG string
  typed_name: string;
  selected_option_id: string | null;
  share_token: string;      // echoed from URL
}
```

Server steps:
1. Load `proposals/:slug.md` from disk.
2. Verify `share_token` via HMAC. Verify `expires_at` not passed.
3. Parse markdown → `ParsedProposal`.
4. If a `pricing_options` block exists:
   - `selected_option_id` required → 400 otherwise
   - Look up option; 400 if missing
   - Compute total, snapshot the option object
5. Build canonical signed payload (JSON):
   ```json
   {
     "slug": "...",
     "markdown_sha256": "...",
     "typed_name": "...",
     "selected_option_id": "...",
     "selected_option_total": 12345.67,
     "signed_at": "2026-04-17T03:15:00Z",
     "ip": "...",
     "user_agent": "..."
   }
   ```
   `audit_hash = sha256(canonical_json)`
6. Render the signed PDF in-memory (see §8) embedding: the proposal content, selected option only, signature image, typed name, signed_at, full audit payload, and the audit hash.
7. Send two emails via Resend with the PDF attached:
   - **To client** (`client.email`) — subject `Signed — {title}`, body includes selected option + total
   - **To author** (`hello@elux.space` or env `AUTHOR_EMAIL`) — subject `✅ Proposal signed — {client.name} picked {option.name}`, body includes audit details + link back to `{BASE}/p/{slug}?t=...`
8. Return `{ ok: true, redirect: "/p/:slug/signed" }`.

No database writes. No file writes. The PDF lives only in memory during the request, then exists only in the two emails.

**Tradeoffs of being fully stateless:**
- ❌ Client could sign twice (refresh + resubmit). You'd get duplicate emails. Mitigation: show a "please do not refresh" message and a clear success state; don't add complexity.
- ❌ If email delivery fails after sign, the record is lost. Mitigation: Resend has retries + delivery logs; in the rare fail case, client re-signs.
- ✅ No drift between DB and reality; no migration headaches; no backups.
- ✅ Matches your archive-from-email workflow exactly.

---

## 8. PDF Rendering (serverless-safe)

`lib/pdf.ts`:

```ts
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function renderPdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdf;
}
```

The HTML is produced by `src/views/pdf.tsx` — a server-rendered JSX template that takes:
- Parsed proposal
- The selected pricing option (or flat pricing)
- The signature block (PNG data URL, typed name, signed_at, audit hash)

Key points:
- `setContent(html)` → NO HTTP round-trip to `/p/:slug?pdf=1`. PDF rendering is self-contained.
- CSS is inlined in the template (no external stylesheet fetch in serverless).
- `vercel.json` needs `maxDuration: 60` on the sign route — Chromium cold-start is 3–8 s.
- Memory: 1024 MB recommended for that route. Also configured in `vercel.json`.

---

## 9. Re-deploy Semantics (you asked this specifically)

**Scenario: client hasn't signed yet, you edit `.md`, commit, redeploy.**
→ New content serves immediately. Old URL still works (share token is the same as long as slug + expires_at match). ✅

**Scenario: client already signed (you got the email + PDF), then you edit `.md` later.**
→ No server-side block. The `.md` changes and if anyone visits the link, they see the new version.
→ **This is fine because:** the authoritative record of what was signed is the **PDF in your inbox**. The audit hash inside that PDF is computed from the exact markdown at sign time — if you ever need to prove what they agreed to, you open the email and compare `markdown_sha256` in the PDF against any later version.
→ Practical rule: after receiving a signed PDF, don't edit that proposal's `.md`. Create a new proposal if terms change.

**Scenario: you want to rotate a share link (e.g. a prospect leaked it).**
→ Change `expires_at` in the `.md` (or add a `rev: 2` field into the HMAC input). New deploy → old token invalid, new token generated.

---

## 10. Environment Variables (Vercel dashboard)

| Key | Purpose |
|---|---|
| `PUBLIC_BASE_URL` | e.g. `https://proposal-xxx.vercel.app`. Used in email bodies + token generation. Update when you attach a custom domain. |
| `SHARE_SECRET` | Random 32-byte hex. Used by HMAC for share tokens. Never rotate casually. |
| `RESEND_API_KEY` | From resend.com |
| `AUTHOR_EMAIL` | `hello@elux.space` — destination for the "signed" notification |
| `ADMIN_TOKEN` | Optional, gates `/admin` on prod |

Locally in `.env.local`; on Vercel in Project → Settings → Environment Variables.

---

## 11. `vercel.json`

```json
{
  "functions": {
    "api/[[...route]].ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

---

## 12. Build & Run

**Local dev:**
```bash
bun install
bun dev          # runs Hono via Bun.serve on :3000
```

**Preview a proposal locally** without generating a token:
```bash
open http://localhost:3000/admin/preview/client-slug-project
```

**Generate a real share link** (for production):
```bash
bun scripts/link.ts client-slug-project
```

**Deploy:** `git push origin main`. Vercel does the rest.

---

## 13. Implementation Order

1. **Scaffold** — `bun init`, Hono app, `@hono/vercel` adapter, `api/[[...route]].ts` entry, dummy `GET /` response, deploy to Vercel to confirm the pipe works.
2. **Parser** — `lib/parse-md.ts` + `lib/pricing.ts` with tests against your `sample-proposal.md`.
3. **Proposal loader** — `lib/proposals.ts` reads from `proposals/` at request time.
4. **Tokens** — `lib/tokens.ts` + `scripts/link.ts` CLI.
5. **Public view** — `/p/:slug` renders markdown + `PricingOptions` + `PricingTable` + signature placeholder. Full mobile CSS.
6. **Admin preview** — `/admin/preview/:slug` (local convenience).
7. **Client-side signature** — `viewer.js` + `signature-pad`, form submit wired to `/api/proposals/:slug/sign`.
8. **Sign API (without PDF/email first)** — validate, log to console, return success. Test end-to-end.
9. **PDF** — `lib/pdf.ts` + `views/pdf.tsx`. Test locally by saving to disk temporarily.
10. **Email** — `lib/email.ts` with Resend, fire two emails with PDF attached.
11. **Signed thank-you page** — `/p/:slug/signed`.
12. **Production deploy** — add env vars, verify `hello@elux.space` in Resend, test full flow with a real proposal.

---

## 14. What We're Explicitly Not Building

- Admin upload UI (git is the CMS)
- Database of any kind
- Persistent file storage
- Duplicate-sign prevention (sign twice → two emails; acceptable)
- Multi-signer flows (single client signer per the sample)
- Webhook/contract/invoice automation
- Analytics
- i18n

---

## 15. Open Items Resolved

1. ✅ Puppeteer: `puppeteer-core` + `@sparticuz/chromium`
2. ✅ Email sender: `hello@elux.space` (you'll verify the domain in Resend)
3. ✅ Hosting: Vercel, default subdomain first, custom domain later via env var swap
4. ✅ Backups: PDF-in-email + your local archive = sufficient

Ready to build on your go.
