# Proposal App

Send proposals as `.md` files, have clients sign them, get notified by email with a PDF.
Built with Bun + TypeScript + Hono. Deployed on Vercel. No database.

## Setup

```bash
bun install
cp .env.example .env.local   # fill in RESEND_API_KEY, SHARE_SECRET, etc.
```

## Dev

```bash
bun dev
# → http://localhost:3000/admin
```

## Add a proposal

Drop a `.md` file into `proposals/` following the frontmatter format in `proposals/client-slug-project.md`.
Then commit + push — Vercel redeploys automatically.

## Generate a share link

```bash
PUBLIC_BASE_URL=https://your-app.vercel.app bun link client-slug-project
# prints the shareable URL — copy and send to client
```

## Deploy

1. Push to GitHub
2. Import repo in Vercel
3. Set environment variables (see `.env.example`)
4. Deploy

Update `PUBLIC_BASE_URL` in Vercel env vars when you connect a custom domain.
