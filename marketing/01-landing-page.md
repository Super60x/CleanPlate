# Landing Page — Detailed Plan

## Tech Stack
- **Astro + Tailwind CSS v4** → Cloudflare Pages (free)
- Location: `landing/` subdirectory
- Dev server: `npx astro dev --port 4321`
- Build: `npx astro build` → `landing/dist/`

## Page Sections (built)
1. Sticky nav (logo + links + CTA)
2. Hero — "Eat Clean, Anywhere" + phone mockup + store badges + waitlist form + trust badges
3. Problem — 3 pain points with icons
4. How It Works — 3-step: Snap → Analyze → Eat Smart (fixed-height phone mockups h-[380px])
5. Features — 4 cards + dietary preference tags
6. Testimonials — double auto-scrolling carousel, 10 personas (Keto, Fitness, Vegan, Allergies, Diabetic, etc.)
7. Screenshots — horizontal scroll, phone frames
8. CTA after screenshots — store badges
9. Pricing — $9.99/month + $69.99/year, "Save 42%", free trial box
10. FAQ — 6 accordion questions (SEO-targeted)
11. Final CTA — green banner + store badges + "7-Day Free Trial"
12. Footer — social links, legal links, copyright

## SEO
- **Target keywords:** "healthy restaurant menu scanner", "clean eating restaurant app", "restaurant nutrition app"
- **Title:** `Clean Plate AI — Scan Any Restaurant Menu for Health Scores`
- **JSON-LD:** MobileApplication schema
- **OG image:** 1200x630 (TODO — phone mockup on green gradient)

## Remaining Tasks

### OG Image
- 1200x630 PNG
- Phone mockup (screen3.png) centered on green gradient (#22C55E → #16A34A)
- Clean Plate logo + tagline "Eat Clean, Anywhere"
- Tools: Canva or code-generated with sharp/canvas

### Deploy to Cloudflare Pages
1. Register `cleanplateai.com` (Namecheap or Cloudflare Registrar)
2. Create Cloudflare Pages project → connect GitHub repo
3. Build command: `cd landing && npm run build`
4. Output directory: `landing/dist`
5. Add custom domain in Cloudflare Pages settings
6. Add Cloudflare Web Analytics (free, no cookie banner)

### Connect Buttondown
1. Create Buttondown account (free up to 100 subscribers)
2. Get API key
3. Replace localStorage in `index.astro` waitlist script with:
   ```js
   fetch('https://api.buttondown.email/v1/subscribers', {
     method: 'POST',
     headers: { Authorization: 'Token YOUR_KEY', 'Content-Type': 'application/json' },
     body: JSON.stringify({ email })
   })
   ```

### Legal Pages
- Build `/privacy` and `/terms` as separate Astro pages
- Required for both App Store and Play Store compliance
- Template: standard SaaS privacy policy + terms

## Key Files
- `landing/src/pages/index.astro` — full landing page
- `landing/src/styles/global.css` — brand colors via `@theme`, Poppins font
- `landing/public/images/` — logo SVG, screenshots, store badges
- Store links: edit `appStoreUrl` / `playStoreUrl` vars in frontmatter when approved
