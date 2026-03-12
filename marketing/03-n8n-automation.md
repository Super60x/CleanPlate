# N8N Automation — Detailed Plan

> You film once. Machines distribute everywhere.

---

## Setup
- **Option A:** Self-hosted on VPS (Hetzner ~4 EUR/mo)
- **Option B:** N8N Cloud free tier (limited executions)
- **Connections needed:** TikTok API, Instagram Graph API, Buttondown API, Claude API, Google Sheets

---

## Flow 1: Cross-Post Machine

**Trigger:** New video uploaded to TikTok (or raw file dropped in Google Drive)
**Actions:**
1. Download video / detect new file in Drive
2. Remove TikTok watermark (or use raw file)
3. Post to Instagram Reels via Graph API
4. Post to YouTube Shorts via YouTube Data API
5. Generate caption variants per platform (Claude API)
6. Log to Google Sheet (content calendar tracker)

**Result:** Film once → appears everywhere within 1 hour.

---

## Flow 2: Content Calendar + Reminders

**Trigger:** Daily at 8 AM (cron)
**Actions:**
1. Read Google Sheet "Content Calendar" (columns: date, pillar, hook, status)
2. Find today's planned content
3. Send Telegram/email reminder: "Today's video: [hook]. Pillar: Menu Expose"
4. After posting, update sheet status to "posted"

**Result:** Never forget what to post. Stay on cadence without thinking.

**Google Sheet structure:**
| Date | Pillar | Hook | Script Notes | Status |
|------|--------|------|-------------|--------|
| 03/05 | Menu Expose | "McDonald's DIRTY SECRET" | Film at McDonald's, scan full menu | pending |
| 03/06 | Build in Public | "Day 7 of building an AI app" | Show code + demo | pending |

---

## Flow 3: Waitlist → Launch Funnel

**Trigger:** New Buttondown subscriber (webhook)
**Actions:**
1. Send welcome email: "You're on the list! Clean Plate launches soon."
2. Tag subscriber in Buttondown
3. On launch day: Trigger bulk email with download links

**Result:** Automated email nurture with zero manual work.

---

## Flow 4: Review Monitor + Response Drafts

**Trigger:** Every 6 hours (cron)
**Actions:**
1. Check App Store Connect API / Google Play Developer API for new reviews
2. If new review found → Claude API drafts a response
3. Send draft to you via Telegram/email for approval
4. One-click approve → posts response

**Result:** Never miss a review. Respond within hours (App Store algorithm rewards fast responses).

---

## Flow 5: SEO Blog Autopilot

**Trigger:** Weekly (every Monday)
**Actions:**
1. Pick next chain restaurant from Google Sheet list
2. Claude API generates article: "Healthiest Dishes at [Chain Restaurant] in 2026"
3. Format as markdown → commit to landing page repo blog section
4. Cloudflare Pages auto-deploys
5. Share link on social (via Flow 1)

**Result:** Weekly SEO content with zero writing. Targets long-tail keywords like "healthiest food at Chipotle."

**Chain restaurant list (seed):**
McDonald's, Chipotle, Olive Garden, Chili's, Panera Bread, Subway, Sweetgreen, Shake Shack, Five Guys, Cheesecake Factory, P.F. Chang's, Wingstop, Raising Cane's, In-N-Out, Taco Bell, Wendy's, Panda Express, Buffalo Wild Wings, Cracker Barrel, IHOP
