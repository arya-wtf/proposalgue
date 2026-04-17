---
slug: "client-slug-project"
title: "Project Proposal — Client Name"
client:
  name: "Client Company"
  contact: "Primary Contact Name"
  email: "contact@client.com"
author:
  name: "Arya Pradana"
  company: "Elux Space"
  email: "arya@elux.space"
team:
  - name: "Arya Pradana"
    role: "Founder / Strategy Lead"
  - name: "Lintang"
    role: "Project Manager"
  - name: "Rasya"
    role: "UI Designer"
currency: "USD"
expires_in_days: 14
---

# 1. Hey [Contact Name]

Thanks for [the call last Thursday / your note on [date] / the intro from [person]]. It was genuinely useful to hear how you're thinking about [topic] — and I took notes.

This proposal lays out how we'd approach [project], what it would cost across a few different options, and what happens after you pick one. Read it at whatever pace works. If anything's off or unclear, reply to the email this came with and we'll revise before you sign.

# 2. Where You Are Right Now

Here's what we heard on the call, in our words so you can correct us if we got any of this wrong:

- **[Situation 1]** — one or two sentences describing the current state. Be specific. Numbers if you have them.
- **[Situation 2]** — same. Observational, not judgmental. You're showing you listened, not selling yet.
- **[Situation 3]** — same.

The through-line: [one-sentence synthesis of the real problem underneath the surface-level asks].

This is the part most proposals skip. We include it because if we got this wrong, the rest of the proposal is wrong too — and we'd rather find out now than after you've signed.

# 3. How We Can Help

Three concrete ways Elux Space fits what you need:

1. **[Capability 1]** — one sentence on what we'd do and why it maps to your situation above. Tie it back to point 1 or 2 in section 2.
2. **[Capability 2]** — same pattern.
3. **[Capability 3]** — same pattern.

What we're NOT going to pretend to do: [honest exclusion — e.g. "we're not a brand strategy firm, so if you need a full rebrand we'd recommend partnering with a studio we trust"]. Saying what you don't do is trust currency. Use it.

# 4. Project Summary

At a glance:

- **What it is:** [1–2 sentence plain-English description of the deliverable]
- **Why now:** [the urgency or opportunity — why this quarter, not next]
- **What success looks like:** [1–2 concrete outcomes, measurable if possible — "conversion rate from 1.2% to 2.5%+" or "ship new onboarding to production by [date]"]
- **Who's involved on our side:** Arya (strategy), Lintang (PM), Rasya (design)
- **Who we need from your side:** [e.g. "one decision-maker available for 30 min/week, plus access to analytics by Day 3"]

# 5. Scope — What We'll Actually Do

Broken into phases so each is independently reviewable. If any phase feels wrong as you read it, flag it before signing.

## Phase 1 — Discovery & Audit

- Kickoff workshop (90 min) to align on goals, constraints, and success metrics
- Audit of [current thing: site, product, funnel — be specific]
- [N] user interviews from your existing list
- Competitor analysis across [3 specific competitors]
- Analytics review (past 90 days of [GA4 / Mixpanel / Amplitude])

## Phase 2 — Design

- Information architecture + user flows
- Wireframes for [specific pages or flows]
- High-fidelity UI in Figma with a lightweight design system
- Two rounds of revision per deliverable

## Phase 3 — Build & Launch

- Implementation in [Webflow / React / Framer — be specific]
- CMS setup for [content type]
- Analytics hooks (GA4 + [other tools if applicable])
- QA across Safari, Chrome, Firefox, mobile iOS, mobile Android
- Launch checklist + handoff documentation

## What's NOT Included

Being explicit here so there are no surprises later:

- Copywriting beyond UX microcopy — if you need long-form marketing copy, we can quote that separately
- Photography, illustration, or custom iconography — we'll use royalty-free stock or your existing assets
- Post-launch maintenance beyond the window included in your chosen option (see Section 7)
- SEO strategy or paid media — not our lane; happy to recommend partners

## Assumptions

The timeline and pricing below assume:

- You can provide feedback within 48 business hours of each deliverable
- You'll provide brand assets (logo, fonts, existing design files) by Day 3
- Stakeholder decisions are made by one designated person on your side
- No major scope changes mid-phase (we handle changes via written addendum; see Section 9)

If any of these break, we adjust the timeline day-for-day and discuss any cost implications transparently before continuing.

# 6. Deliverables

Exactly what you get, when you get it, and in what format.

| Phase | Deliverable | Format |
|---|---|---|
| 1 | Kickoff workshop recording + notes | Video + Notion doc |
| 1 | Discovery findings report | Notion doc / PDF |
| 1 | User interview synthesis | Notion doc + raw recordings |
| 2 | Wireframes | Figma file |
| 2 | High-fidelity UI designs | Figma file with components |
| 2 | Design system tokens | Figma variables + documented in Notion |
| 3 | Live site / feature in production | [Webflow / deployed URL / GitHub repo] |
| 3 | Analytics dashboard | [GA4 / Looker Studio] |
| 3 | Handoff documentation | Notion doc + 60-min walkthrough call |

**IP transfer:** All final deliverables are yours on final payment. Source files (Figma, code) available on request. We retain the right to showcase the work in our portfolio unless you specifically request otherwise.

# 7. Pricing — Choose an Option

Below are the options for this project. They're not upsells — they're genuinely different scopes. Pick the one that matches what you actually need. You'll select your option when you sign at the bottom of this page, and we'll send the contract + invoice for the option you chose within 24 hours.

If none of these fit and you want a custom mix, reply to the proposal email and we'll rework it.

```pricing_options
currency: "USD"
tax_rate: 0.11
options:
  - id: "option_a"
    name: "Landing Page Only"
    tagline: "Launch a focused landing page, fast."
    recommended: false
    line_items:
      - label: "Design — landing page (3 sections)"
        quantity: 1
        rate: 1500
      - label: "Build — Webflow implementation"
        quantity: 1
        rate: 1500
    includes:
      - "Single landing page, up to 3 sections"
      - "Mobile responsive"
      - "One round of revisions"
      - "Basic analytics (GA4)"
    excludes:
      - "Mobile app design"
      - "Product/dashboard UI"
      - "User interviews or discovery phase"
    best_for: "Teams validating a single offer or campaign quickly."

  - id: "option_b"
    name: "Landing Page + Mobile App"
    tagline: "Public-facing site plus the app experience behind it."
    recommended: true
    line_items:
      - label: "Design — landing page"
        quantity: 1
        rate: 1500
      - label: "Design — mobile app (up to 12 screens)"
        quantity: 1
        rate: 3500
      - label: "Build — Webflow landing page"
        quantity: 1
        rate: 1500
    includes:
      - "Landing page design + build"
      - "Mobile app UI design (up to 12 screens, iOS + Android)"
      - "Design system tokens in Figma"
      - "Two rounds of revisions per deliverable"
      - "30 days of bug fixes post-launch"
    excludes:
      - "Mobile app development"
      - "Backend / API work"
    best_for: "Teams that have dev in-house but need design + landing built."

  - id: "option_c"
    name: "Landing Page + Mobile App + Development"
    tagline: "End-to-end — design, landing, app built and shipped."
    recommended: false
    line_items:
      - label: "Design — landing page"
        quantity: 1
        rate: 1500
      - label: "Design — mobile app"
        quantity: 1
        rate: 3500
      - label: "Build — Webflow landing page"
        quantity: 1
        rate: 1500
      - label: "Build — mobile app (React Native)"
        quantity: 1
        rate: 8000
    includes:
      - "Everything in Landing Page + Mobile App"
      - "React Native app development"
      - "App Store + Play Store submission"
      - "60 days of post-launch support"
    excludes:
      - "Backend infrastructure beyond basic auth + data layer"
      - "Ongoing retainer after 60-day support window"
    best_for: "Teams without in-house dev who want one team for everything."
```

**A note on the tax:** The rate shown above is Indonesian PPN (11%). If your business is registered outside Indonesia and we can issue an invoice under a different arrangement (reverse charge VAT, export of services), the tax line may be zero — we'll confirm on the invoice.

# 8. Payment Options (How You Pay)

Pay whichever way is easiest for you. All of these work:

- **Bank transfer (IDR)** — Indonesian clients. Fastest. Details on invoice.
- **Wise** — international clients. Low FX fees. We'll send a payment link per invoice.
- **Stripe (card or ACH)** — adds a 3.4% + $0.50 processing fee to the invoice (standard Stripe rates).
- **PayPal** — adds a 4.4% processing fee. Works but we'd rather not; Wise is cheaper for both of us.
- **USDC / USDT (Polygon or Base)** — if you're crypto-native. No fees on our end. Wallet address on invoice.

All invoices are issued in the currency you pick, via whatever payment option you pick.

# 9. Payment Terms (When You Pay)

- **Deposit:** 50% due within 7 days of signing this proposal. Work begins when the deposit lands.
- **Milestone 2:** 25% due at the start of Phase 2 (design kickoff).
- **Final:** 25% due within 7 days of final delivery. Source files and final handoff happen after final payment clears.
- **Late payment:** Anything more than 14 days overdue pauses work on our end until it's current. Repeated late payment (3+ times) ends the engagement with no refund of already-paid milestones.
- **Scope changes:** Handled via a short written addendum (usually a paragraph in Slack or email) that we both acknowledge before the work starts. Changes are priced at $120/hr or as a flat fee depending on size.
- **Revisions:** Rounds specified per option. Additional rounds billed at $120/hr with a per-round estimate before we start.
- **Refunds:** Deposit is non-refundable once Phase 1 has begun. Mid-engagement, if either side wants to stop, you pay for work completed to date and we hand over everything we've produced.
- **Confidentiality:** Everything you share is confidential. We sign a separate NDA on request, otherwise this proposal doubles as a mutual confidentiality acknowledgment.

# 10. Estimated Timeline

Assuming signature by **[Date]** and deposit received by **[Date + 7 days]**, here's how the calendar looks.

Actual phase durations depend on which option you pick — Landing Page Only is faster than the full end-to-end. Specific dates get locked in our kickoff call.

| Milestone | Target date | Applies to |
|---|---|---|
| Proposal signed + deposit received | [Date] | All options |
| Phase 1 kickoff call | [Date + 3 business days] | All options |
| Discovery & audit delivered | [Date + 10 days] | Options B & C |
| Landing page design approved | [Date + 17 days] | All options |
| Landing page live | [Date + 24 days] | All options |
| Mobile app design approved | [Date + 28 days] | Options B & C |
| Mobile app shipped to stores | [Date + 56 days] | Option C |
| Final handoff | [Date + 45/56 days] | Depends on option |

If your timeline is tighter than this, flag it before signing and we'll discuss whether we can compress safely or if you need to pick a lighter option.

# 11. Case Study — [Past Client Name]

**Situation:** [One sentence on what they came to us with. E.g. "A fintech startup launching in SEA with 6 weeks to a pitch event and no product site."]

**What we did:** [Two sentences, concrete actions. E.g. "We ran a 3-day discovery sprint, designed a landing page + pitch-ready site in Webflow, and integrated their waitlist flow with their CRM. Shipped 4 weeks after kickoff."]

**Outcome:** [One sentence, metric if you have it, qualitative if not. E.g. "They hit the pitch event with a live site, collected 1,200 waitlist signups in the first week, and closed their seed round three months later."]

> "[One-sentence quote from the client with permission. Something specific, not 'they were great to work with.']"
> — [Name, Role, Company]

If this is a first-of-its-kind project for us, skip this section. Don't fabricate a case study — clients notice.

# 12. About Elux Space

We're a small, remote UI/UX and no-code/low-code design agency based in Yogyakarta, Indonesia. We work with SaaS founders, non-tech startups, and product managers who need senior work without a big-agency overhead.

**Why that matters for you:**

- **You work with senior people, not a junior team behind an account manager.** Arya is in every strategy call. Lintang runs delivery directly. No handoffs to people you've never met.
- **We've shipped for [client 1], [client 2], [client 3].** Ask for intro calls with any of them before signing — they've agreed to take 15 minutes to tell you what working with us is actually like.
- **We write things down.** Proposal, contract, scope changes, decisions — all in writing, all shareable. No "I thought we agreed to…" conversations six weeks in.
- **Profit-first, lean, AI-enabled.** We use tools like Claude, Figma AI, and automation to compress cycles. You get the output of a bigger team at the cost of a small one.

**The team on this project:**

| Who | Role | What they do here |
|---|---|---|
| Arya Pradana | Founder / Strategy Lead | Strategy calls, scope decisions, final review before delivery |
| Lintang | Project Manager | Day-to-day delivery, your primary contact for status |
| Rasya | UI Designer | Wireframes, high-fi design, Figma system |

Portfolio + past work: [elux.space / arya.wtf / LinkedIn link]

# 13. Point of Contact Before You Sign

If anything in this proposal is unclear, off, or you want to negotiate a point:

- **Reply to the email this proposal came with** — fastest
- **Email arya@elux.space directly** — also fast
- **Book a 20-min call:** [Calendly or scheduling link]

We'd genuinely rather rewrite a section than have you sign something that doesn't fit.

# 14. Next Steps After You Sign

1. Scroll down → pick your option → draw your signature → type your name → submit.
2. You'll get a PDF copy of this signed proposal in your email within a minute.
3. We'll send the contract for the option you picked within 24 hours, along with Invoice #1 for the 50% deposit.
4. Once the deposit lands, we book the Phase 1 kickoff call for the following week.

This proposal is valid for **14 days** from the date it was sent. After that, pricing and timeline may need to be re-quoted.

```signature
required: true
select_pricing_option: true
signers:
  - role: client
    name_placeholder: "Your full legal name"
```
