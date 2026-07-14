# ShagunShopping — The Complete Project Handbook

*Everything about this project in one document: what it is, how every piece works, why it's built this way, the business behind it, and the interview answers. Read it twice, then trace each flow in the code once. If you can explain Part 3 without looking, no interviewer can shake you.*

---

# Part 1 — The story (your opening 60 seconds)

> "My father runs a multi-brand cosmetic shop in Meerut — 25 years old, everything genuine and below MRP, but only walk-in customers. In my final year I put that business online end-to-end: catalog, OTP-verified accounts with CAPTCHA, Razorpay plus Cash on Delivery with payment webhooks, automated emails at every stage, GST invoices, courier tracking, and an admin panel my father uses to pack and ship orders. The interesting problems weren't CRUD — they were trust and money: cryptographically verifying payments, making an order impossible to double-pay or oversell, and pricing shipping so COD refusals don't eat the margin. It's live at shagunshopping.com and takes real orders."

Every sentence is true and demonstrable. That's the entire trick to interview confidence.

# Part 2 — Architecture

```
 Customer/Admin browser
        │ HTTPS
   ┌────┴─────────┬──────────────────┐
   ▼              ▼                  ▼
 Vercel        Render            Razorpay
 React SPA     Express API   ◄──► Checkout popup
 (static CDN)  Node 18+           + payment.captured WEBHOOK ──► /api/payment/webhook
                │    │
        Mongoose│    │HTTPS APIs
                ▼    ▼
        MongoDB     Resend (email) · Cloudinary (images) · Turnstile (captcha)
        Atlas
```

**Separate origins by design** (Vercel + Render). This forced two real engineering events worth telling: (1) a CORS allow-list, and (2) the migration from httpOnly cookies to Bearer tokens after Safari's third-party-cookie blocking silently logged users out at checkout on iPhones — diagnosed on a real device, fixed, redeployed.

**Every integration degrades gracefully.** No Resend key → OTPs print to the console. No Turnstile keys → captcha hides, server skips verification. No webhook secret → endpoint answers 503. No Cloudinary → images save to local disk. This means `npm run dev` works with zero external accounts — say this in interviews, it signals production thinking.

# Part 3 — The flows (know these cold)

### 3.1 Signup (with bot protection)
Register form → Turnstile widget issues a token → POST /auth/register {details, captchaToken} → server middleware verifies the token with Cloudflare (fail-closed) → user saved `emailVerified:false` → 6-digit OTP generated, **sha256-hashed** into `otpHash`, 10-min expiry, 5-attempt cap → Resend emails it → user enters it → hash compare → `emailVerified:true`, JWT issued, welcome email (fire-and-forget). Login on an unverified account re-sends an OTP instead of erroring.

### 3.2 Forgot password (reuses the OTP machinery)
POST /auth/forgot-password {email, captchaToken} → **responds identically whether the email exists or not** (no account enumeration) → if it exists, a reset OTP is emailed → POST /auth/reset-password {email, otp, newPassword} → same hash/expiry/attempt checks → password updated (bcrypt pre-save hook), `emailVerified` set true (they proved inbox control), password-changed alert emailed. ~90% of the code was already there from signup OTP — that reuse is itself an interview point.

### 3.3 Placing an order — the money path
Client sends **product ids + quantities + address + payment method. Never a price.** Server fetches products from the DB, validates stock and `isActive`, and computes every rupee in `pricing.js`: prepaid free-ship ≥ ₹1,199, COD free-ship ≥ ₹1,499, else ₹49 shipping; COD adds no extra fee (waived — it's one env variable away if ever needed) and is refused above ₹2,500 subtotal.

**COD:** atomic stock decrement → order created `processing` → confirmation + owner alert emails.
**Online:** order saved `pending_payment` + Razorpay order created → popup → two independent paths can now confirm it:
- **Browser verify:** client POSTs the three Razorpay ids → server checks ownership, order match, then recomputes `HMAC_SHA256(order_id|payment_id, KEY_SECRET)` and compares **timing-safe** → finalize.
- **Webhook:** Razorpay's server POSTs `payment.captured` to `/api/payment/webhook` → raw-body HMAC verified against `WEBHOOK_SECRET` → order looked up by razorpay_order_id → finalize.

### 3.4 finalizePaidOrder — the idempotency core (your best 2 minutes in any interview)
Both paths call one function whose first line is an **atomic claim**:

```js
Order.findOneAndUpdate(
  { _id, status: 'pending_payment', isPaid: false },
  { $set: { isPaid: true, paidAt: now, status: 'processing', ...paymentIds } },
  { new: true }
)
```

Only the caller for whom the filter still matches wins; every other caller (webhook racing the browser, a double-click, a network retry) gets `null` and simply returns the already-finalized order. **The status transition itself is the idempotency key — no locks, no flags, just MongoDB's document-level atomicity.** The winner then decrements stock with `{ stock: { $gte: qty } }` guards; if any line fails (paid but stock vanished in the gap — rare), the order **stays paid** and the owner gets an "ACTION NEEDED" oversell email. Never fail silently when money has moved.

### 3.5 Why the webhook needs the raw body
The webhook signature is an HMAC of the **raw request bytes**. Express's JSON parser consumes and re-serializes the body, which breaks the signature. So the webhook route is mounted with `express.raw()` **before** `express.json()` in app.js. Knowing middleware order matters here = senior-sounding answer.

### 3.6 Stock without race conditions
Every decrement is `updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` in a bulkWrite. Two buyers race for the last unit → exactly one filter matches → one clean success, one clean "stock changed" error. The filter IS the lock.

### 3.7 Fulfilment + tracking
Owner gets the new-order email → packs → in admin sets status to Shipped → a prompt asks for an optional courier tracking URL → customer's "shipped" email carries a **Track your parcel** button and the same link shows on their order page. Delivered/cancelled statuses email automatically; a cancelled **paid** order shows a red "Refund due" chip in admin and flags REFUND NEEDED in the owner email.

### 3.8 Invoices
`/orders/:id/invoice` renders print-CSS HTML → browser's Save-as-PDF (works on phones, zero server PDF dependencies). Indian prices are MRP-inclusive of GST, so the tax break-up is **derived from** the total (`total / 1.18`), CGST+SGST within UP, IGST otherwise, and appears once `SHOP_GSTIN` is configured.

### 3.9 Images
Admin-only multer upload, MIME whitelist (jpg/png/webp), 3 MB cap, server-generated filenames, SVG rejected (script vector). With `CLOUDINARY_URL` set the file streams to Cloudinary (survives redeploys, CDN); without it, local disk for dev.

### 3.10 Bulk product onboarding (the 100-product answer)
`server/import-template.csv` (one row per product) + optional `import-photos/<slug>/` folders → `npm run import -- --dry-run` validates everything and prints slugs → `npm run import` upserts by slug (re-running is safe; existing photos are never wiped by a blank cell). Descriptions at scale: draft them with AI from the product name + box text, then fact-check against the physical product — an afternoon, not a month.

# Part 4 — Data models

**User** — email (unique), bcrypt password (`select:false`, pre-save hook), role, `emailVerified`, hashed OTP fields (all `select:false`), `addresses[]` subdocs with `isDefault`, `preferredPayment`.
**Product** — name, unique slug, brand, category, `mrp` vs `price` (the below-MRP promise is enforced: price > mrp fails validation and the importer), stock, images[], description/ingredients/howToUse, featured, isActive.
**Order** — user ref; `orderItems[]` as **snapshots** of name/brand/price at purchase time; embedded `shippingAddress` copy; itemsPrice/shippingPrice/codFee/totalPrice; isPaid/paidAt; paymentResult (Razorpay ids + signature); status enum `pending_payment → processing → shipped → delivered | cancelled`; `trackingUrl`.

The denormalization is deliberate: an invoice from March must show March's price and the address it actually shipped to. **Orders are immutable history; products are mutable present.**

# Part 5 — Security posture (rattle these off)

Server-authoritative pricing · timing-safe HMAC compares (payment verify AND webhook) · idempotent payment finalization via atomic status transition · ownership checks on every order route · bcrypt(10) + `select:false` · hashed OTPs with TTL + attempt caps · CAPTCHA on the two email-sending endpoints (register, forgot-password), fail-closed · express-mongo-sanitize against NoSQL injection · helmet + CORS allow-list + `trust proxy` · rate limits on /auth and /api · 100kb JSON body limit · upload MIME whitelist, size cap, server-named files, no SVG · admin login alert emails with IP · password-changed alerts · generic forgot-password responses (no enumeration) · secrets only in env vars · security headers on the frontend (nosniff, referrer-policy, frame-options).

# Part 6 — The business model (what makes this project different)

**The moat:** 25 years of "genuine, below MRP" trust + a walk-in customer base with near-zero acquisition cost (counter QR + WhatsApp) + Meerut same-day delivery. No national D2C brand can copy any of these.

**COD economics (know this table):** ~15–30% of Indian COD parcels get refused (RTO) — two-way freight, zero revenue. The pricing fights it structurally: the COD fee is currently waived as a conversion choice (the courier's cash-handling charge is absorbed in margin — and because it's env-configured, turning it back on is a dashboard change, not a deploy); prepaid's cheaper free-shipping threshold (₹1,199 vs ₹1,499) still nudges customers to the ~0% RTO method; the ₹2,500 COD cap blocks the most expensive refusals. Per ₹800 order: prepaid contributes ≈ ₹129; COD ≈ ₹105 once a refusal provision is averaged in (the waived fee comes straight out of COD margin) — which is exactly why the architecture still pushes prepaid.

**Growth levers in order of ROI:** convert the counter (QR + WhatsApp, ₹0 CAC) → AOV via free-shipping thresholds and future bundles → prepaid share → RTO control → only then paid ads (geo-locked Meerut +50km, boost the best-performing Instagram Reel first).

# Part 7 — Interview Q&A bank

### Payments & correctness (your strongest ground now)
**"How do you know a payment is real?"** — I never trust the browser callback. The server recomputes HMAC-SHA256 of `order_id|payment_id` with the key secret and compares timing-safe. Separately, Razorpay's server calls my webhook with its own HMAC of the raw body against a different secret. Either path can confirm; neither can be spoofed.

**"What if the customer pays and closes the tab?"** — Exactly why the webhook exists. Razorpay tells my server directly on `payment.captured`; the order confirms without the browser. Before I built it, that scenario left money captured and an order stuck unpaid — I found it in my own audit and fixed it.

**"What if verify and the webhook fire at the same time?"** — Both call one finalizer whose first operation is an atomic `findOneAndUpdate` filtered on `status:'pending_payment'`. One caller matches and wins; the other gets null and reads back the finished order. The status transition is the idempotency key — no distributed locks needed at this scale.

**"Why does the webhook route sit before your JSON middleware?"** — Its signature is an HMAC of the raw bytes; the JSON parser would consume them. `express.raw()` is mounted for that path first. (This also keeps sanitize/limiters off a server-to-server route.)

**"Could you double-decrement stock?"** — Not anymore: stock only decrements inside the atomic claim's winner, and each line item is guarded with `stock: { $gte: qty }`. If stock ran out between order and payment, the order stays paid and the owner gets an oversell alert to resolve by sourcing, substituting, or refunding — money movements never fail silently.

### Auth & abuse
**"Why CAPTCHA on register and forgot-password but not login?"** — Those two endpoints send emails, so bots cost me money (and SMS-style pumping exists for email too); login is already rate-limited and sends nothing. Friction where it pays, none where it doesn't.

**"How is the CAPTCHA safe to skip in dev?"** — It's configuration-gated on both sides: no site key → widget renders nothing; no secret → server middleware passes. In production both are set and verification fails closed on network errors.

**"Walk me through forgot-password security."** — Identical response whether the email exists (no enumeration), hashed OTP with 10-minute TTL and 5-attempt cap, reset marks the email verified since inbox control was proven, and a password-changed alert goes out. It reuses the signup OTP machinery — one hardened code path instead of two half-tested ones.

**"Why Bearer tokens instead of httpOnly cookies?"** — Cookies are more XSS-resistant, but Safari's third-party-cookie blocking broke sessions across vercel.app ↔ onrender.com — real users logged out at checkout on iPhones. Bearer tokens fixed it; an `api.shagunshopping.com` subdomain would make same-site cookies viable again and it's on the roadmap. I can defend both sides of that trade-off.

### MongoDB & modeling
**"Why snapshot order items?"** — Invoices are immutable history; prices change. I keep the product ref for linking but never trust it for money.
**"How do you prevent overselling?"** — Filtered atomic update per line; the filter is the lock; document-level atomicity guarantees one winner.
**"Transactions?"** — Single-document atomicity covers every money-critical write here. I'd reach for multi-document transactions with multi-warehouse inventory; knowing when *not* to use them is the answer.

### Ops & scale
**"What breaks first at 100×?"** — Render free-tier cold starts (fix: always-on), then ops before code: at ~20 orders/day packing is the bottleneck, which is why the admin flow and courier automation matter more than query tuning. Then Shiprocket API, then Atlas tier.
**"How would you add tests?"** — supertest + in-memory Mongo on the money paths first: pricing matrix (thresholds, COD fee/cap), signature verification (valid, tampered, replayed), the idempotent finalizer under concurrent calls, and the stock guard. Pricing bugs are money bugs; they get CI before anything else.
**"Monitoring?"** — UptimeRobot on /api/health and Sentry free tier are the first hour of work; owner alert emails already cover the business events.

### Behavioral
**"Hardest bug?"** — Safari checkout logouts. Devtools showed the cookie never sent cross-site; confirmed ITP; migrated to Bearer tokens; verified on a real iPhone. I tell it in 30 seconds because I actually lived it.
**"A design decision you reversed?"** — The monochrome redesign: shipped it, hated it against real product imagery, reverted to the rose token system. Because every component reads design tokens, the revert was a token-file change, not a rewrite — that's why the tokens exist.
**"Did you use AI?"** — Heavily, as a pair-programmer — the same way I'll use it on your team. My job was everything it can't do: the COD economics, the Safari debugging on-device, the payment-race audit and its fixes, deployment, and operating it for a real business. Pick any file in this repo and I'll walk you through why it's shaped the way it is.

# Part 8 — Numbers to memorize

bcrypt 10 rounds · OTP: 6 digits, 10 min, 5 attempts · JWT 30d · ₹1,199 prepaid / ₹1,499 COD thresholds · ₹49 ship / COD fee waived (env COD_FEE) / ₹2,500 cap · GST 18% inclusive (÷1.18), CGST+SGST intra-UP else IGST · Razorpay ~2% · webhook event: payment.captured · statuses: pending_payment→processing→shipped→delivered|cancelled · upload cap 3 MB · JSON limit 100kb · Render cold start ~30s · stack: React 18, Vite, Tailwind v4, Node 18+, Mongoose 8.

# Part 9 — The 3-minute live demo script

1. Open shagunshopping.com **on your phone** — "this is production."
2. Product → cart → checkout → flip COD/online, watch totals change — "the server recomputes all of this; the client never sends a price."
3. Admin tab → the order just landed → mark Shipped, paste a tracking link → show the email arriving with the Track button.
4. Open the invoice → Save as PDF.
5. One closing line: "Vercel, Render, Atlas; push to main deploys both; payments confirm by webhook even if the buyer's tab dies."

Rehearse until boring. Have screenshots + a 90-second recording as backup. Never demo anything you haven't run twice that morning.
