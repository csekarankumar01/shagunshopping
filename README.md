# ShagunShopping 🛍️

Live at **[shagunshopping.com](https://shagunshopping.com)**

A multi-brand cosmetic shop in Meerut for 25+ years. This is that shop, online — a fully production-ready MERN e-commerce store I built single-handedly.

**Note:** While the codebase is fully production-ready, I am not taking live orders right now. The Razorpay integration is currently running in test mode.

## What it does

- Catalog of genuine products across 18 brands (Lotus, Dot & Key, Pilgrim, Swiss Beauty, Deconstruct...), everything priced below MRP
- Email OTP verification at signup (Resend API) + **Cloudflare Turnstile CAPTCHA** against bots, JWT bearer sessions, full **forgot-password** flow reusing the OTP machinery
- Razorpay (UPI / cards / netbanking) **with server-to-server payment webhooks** (currently in test mode) — a paid order confirms even if the customer closes the tab — plus Cash on Delivery with server-verified totals
- **Idempotent payment finalization**: an atomic status transition guarantees an order is marked paid and stock decremented exactly once, no matter how verify/webhook/retries race
- COD economics built in: no COD fee — both payment methods pay shipping only; prepaid unlocks free shipping earlier (₹1,199 vs ₹1,499); COD capped at ₹2,500 (RTO protection)
- Automated email lifecycle: OTP → welcome → order confirmation → shipped (with **courier tracking link**) → delivered, plus instant owner alerts, refund flags on cancelled paid orders, admin-login alerts, and password-change notices
- Printable GST-ready invoices (browser print-to-PDF, zero server PDF deps)
- Customer accounts: profile, saved addresses auto-filling checkout, preferred payment
- Admin panel: revenue dashboard, low-stock alerts, product CRUD with photo upload (**Cloudinary** when configured, local disk in dev), order status + tracking management
- **Bulk product importer**: fill a CSV, drop photo folders, `npm run import` — built for onboarding 100+ products from the physical shop without 100 admin sessions

## Stack

React 18 + Vite + Tailwind v4 · Node/Express · MongoDB Atlas (Mongoose) · Razorpay · Resend · Cloudinary · Cloudflare Turnstile · JWT + bcrypt

Deployed: frontend on Vercel, API on Render, DB on Atlas. Domain via Namecheap.

## Running locally

```bash
npm run install-all                                    # backend + frontend deps
cp backend-shagunshopping/.env.example backend-shagunshopping/.env   # fill in values
npm run seed                                           # sample products + admin account
npm run dev                                            # API :5001, storefront :5173
```

Leave `RESEND_API_KEY` empty locally — emails (including OTPs) print to the server console. Leave the Turnstile keys empty — the CAPTCHA hides itself and the server skips verification. Leave `RAZORPAY_WEBHOOK_SECRET` empty — the webhook answers 503 until configured. Every integration degrades gracefully so dev needs zero accounts.

## Bulk-importing the real catalog

```bash
cd backend-shagunshopping
# 1. fill import-template.csv (Excel works; keep the header row)
# 2. photos: import-photos/<product-slug>/1.jpg ... or paste URLs in the imageUrls column
npm run import -- --dry-run   # validates + prints each slug, DB untouched
npm run import                # upserts by slug — re-running is safe
```

## Things I'd point at in the code

- `backend-shagunshopping/src/controllers/paymentController.js` — the idempotent `finalizePaidOrder` (atomic claim via `findOneAndUpdate` on status) shared by browser verify and the Razorpay webhook; raw-body HMAC verification for the webhook
- `backend-shagunshopping/src/utils/pricing.js` — every rupee computed server-side; the frontend never sends a price
- `backend-shagunshopping/src/controllers/orderController.js` — filtered atomic stock decrements (`stock: { $gte: qty }`) so two buyers can't take the last unit
- `backend-shagunshopping/src/utils/mailer.js` — the whole email lifecycle with a console fallback for dev
- `backend-shagunshopping/src/seed/import-products.js` — the bulk importer
- `docs/` — system design, the full project handbook, and interview prep notes

## Honest limitations / roadmap

Shiprocket courier integration is not yet built, but I plan to add it soon. For now, tracking is manual (paste the tracking link when marking shipped). Coupons and bundles are designed but not built. Test coverage is manual; supertest on the pricing and payment paths is the first thing I'd add with a free week.

Built with a lot of chai and late-night debugging of CORS and cookie policies. Building this complete, production-ready system single-handedly has been an incredible learning experience.
