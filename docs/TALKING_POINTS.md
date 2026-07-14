# ShagunShopping — Resume & Interview Talking Points

*The project guide teaches you the code. This file teaches you the story.*

## 1. Resume bullets (pick 3–4, keep them truthful and quantified)

- Built and operate **shagunshopping.com**, a live MERN e-commerce platform for a 25-year-old retail cosmetics business — real orders, real payments, real fulfilment.
- Integrated **Razorpay** (UPI/cards/netbanking) with server-side HMAC-SHA256 payment verification and server-authoritative pricing; designed COD economics (dynamic thresholds, COD fee, order cap) to control RTO losses.
- Implemented **email OTP verification** and a full transactional email lifecycle (Resend API): order confirmations, shipping status updates, and instant owner alerts.
- Designed atomic inventory management (filtered MongoDB bulkWrite) preventing oversells under concurrent checkout.
- Shipped customer accounts (saved addresses auto-filling checkout), GST-ready printable invoicing, and an admin panel with photo uploads and order management.
- Deployed and maintain the full stack: Vercel (React/Vite), Render (Node/Express), MongoDB Atlas, custom domain + DNS, environment-based configuration.

Fill in real numbers as they accrue (orders/month, AOV, prepaid %, uptime). One true number beats ten adjectives.

## 2. The 60-second story (rehearse until it's boring to you)

> "My father runs a multi-brand cosmetic shop in Meerut — 25 years old, everything below MRP, but only walk-in customers. In my final year I put that shop online end-to-end: catalog, OTP-verified accounts, Razorpay plus Cash on Delivery, automated emails at every order stage, invoices, and an admin panel he actually uses to pack and ship orders. The interesting problems weren't CRUD — they were trust and economics: verifying payments cryptographically on the server, making sure two people can't buy the last unit, and pricing shipping so COD's refusal risk doesn't eat the margin. It's live at shagunshopping.com and takes real orders."

Every sentence there is true and defensible. That's the whole trick.

## 3. The live-demo script (3 minutes, have it muscle-memorized)

1. Open the site on your phone in front of them — "this is production."
2. Add a product to cart → checkout → flip COD/online and let them watch the totals change → "the server recomputes all of this; the client never sends a price."
3. Show the admin dashboard on a second tab → the order that just landed → mark it Shipped → show the automated email arriving.
4. Open the invoice → Save as PDF.
5. Close with one sentence of ops: "Vercel, Render, Atlas; push to main deploys both."

If wifi dies, have screenshots + one recorded 90-second video as backup. Never demo anything you haven't done twice that morning.

## 4. Talking about AI assistance — read this part carefully

You will likely be asked "did you use AI to build this?" In 2026 the interviewers asking this use Copilot and Claude themselves. There are two ways to lose this question and one way to win it.

**Lose #1:** claim you hand-wrote everything → they probe one file deep, the story wobbles, and now *everything* you've said is suspect. Integrity is the one thing a fresher can't rebuild in an interview.
**Lose #2:** shrug "AI made it" → you've told them you're replaceable by the tool.

**Win:** own the workflow like a senior engineer would.

> "I used AI heavily as a pair-programmer — the same way I'll use it on your team. My job was everything the AI can't do: deciding the COD fee and thresholds from RTO economics, debugging the Safari cookie issue on a real device, verifying the Razorpay flow with real money, choosing what to build next, deploying it, and operating it for a real business. I can walk you through any file in this repo and explain why it's shaped the way it is."

Then let them pick a file. That's why PROJECT_GUIDE.md exists — after studying it, that offer is safe, and making the offer is itself the flex. The defensible claim on your resume is "built and operate," which is simply true: the product decisions, the business, the deployment, the debugging on real devices, the operations — that's you, and none of it can be generated.

## 5. "What would you do next?" — ranked roadmap with reasons

1. **Razorpay webhooks** — close the paid-but-tab-closed gap; idempotent handler (payment truth shouldn't depend on the buyer's browser surviving).
2. **Cloudinary migration** — uploads currently die on redeploy (ephemeral disk); also gets CDN delivery.
3. **Shiprocket API** — auto-sync orders, tracking webhooks drive the status emails instead of manual clicks.
4. **Coupons & bundles** — retention lever + AOV lever; bundles blend thin and fat margins past the free-shipping threshold.
5. **Tests + CI** — supertest on pricing/auth/payment paths, GitHub Actions gate on push; pricing bugs are money bugs.
6. **Analytics** — track AOV, prepaid share, RTO%, conversion; the five numbers that decide ad spend.
7. **api.shagunshopping.com** subdomain — makes cookie auth viable again (same-site), plus cleaner CSP.
8. **Performance** — image lazy-loading audit, route-level code splitting, Lighthouse budget.

Saying "here's my ranked backlog and why" in an interview is worth more than any single feature.

## 6. Curveballs and honest answers

- **"Revenue?"** — If early: "It launched recently; the shop's walk-in base is being converted via QR at the counter and WhatsApp — I track orders, AOV and prepaid share weekly." Never invent numbers; interviewers smell fake metrics instantly.
- **"Why not Next.js?"** — "A separate SPA + API kept the payment/webhook surface as a plain Express app I fully control; SSR adds real value for SEO on product pages, and it's on my list — I'd add it when organic search becomes a channel."
- **"Why not microservices?"** — "One deployable for one shop is the right size; I'd rather show I know *when not to* distribute."
- **"What are you least proud of?"** — Pick a real one: "No automated tests yet — manual test scripts before each deploy. It's the first thing I'd fix with a week."
- **"Who designed the UI?"** — "Iterated it myself through several versions" (true — monochrome phase, category experiments, the current rose-glow system) "with AI doing the heavy lifting on CSS; the design *decisions* — what stayed, what got reverted — were mine."

## 7. One-page cheat: numbers to memorize

JWT expiry & bcrypt rounds (10) · OTP: 6 digits, 10 min, 5 attempts · shipping: ₹1199 prepaid / ₹1499 COD / ₹49 fee / COD fee waived / ₹2500 cap · GST 18% inclusive, CGST+SGST intra-UP else IGST · Razorpay fee ~2% · Render cold start ~30s · 43 products, 18 brands · stack versions (React 18, Node 18+, Tailwind v4, Mongoose 8).
