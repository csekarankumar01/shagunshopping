# ShagunShopping 🛍️

Live at **[shagunshopping.com](https://shagunshopping.com)**

My father has run a multi-brand cosmetic shop in Meerut for 25+ years. This is that shop, online — a full MERN e-commerce store I built and now operate in my final year of B.Tech (CSE, AIML). It takes real orders, real payments, and sends real parcels.

## What it does

- Catalog of 40+ genuine products across 18 brands (Lotus, Dot & Key, Pilgrim, Swiss Beauty, Deconstruct...), everything priced below MRP
- Email OTP verification at signup (Resend API), JWT bearer-token sessions
- Razorpay for UPI/cards/netbanking + Cash on Delivery with server-verified totals
- COD economics built in: ₹40 COD fee, prepaid gets a lower free-shipping threshold, COD capped at ₹2,500 (RTO protection — learned this the hard way reading about Indian D2C return rates)
- Automated email lifecycle: OTP → welcome → order confirmation → shipped → delivered, plus instant owner alerts for every new order and cancellation
- Printable GST-ready invoices for every order (browser print-to-PDF, no server-side PDF deps)
- Customer accounts: profile, saved addresses that auto-fill checkout, preferred payment
- Admin panel: dashboard with revenue + low-stock alerts, product CRUD with photo upload from any device, order status management
- Same/next-day delivery messaging for Meerut PIN codes

## Stack

React 18 + Vite + Tailwind v4 · Node/Express · MongoDB Atlas (Mongoose) · Razorpay · Resend · JWT + bcrypt

Deployed: frontend on Vercel, API on Render, DB on Atlas. Domain via Namecheap.

## Running locally

```bash
npm run install-all          # installs server + client deps
cp server/.env.example server/.env   # then fill in the values
npm run seed                 # 43 products + admin account
npm run dev                  # API :5001, storefront :5173
```

Leave `RESEND_API_KEY` empty locally — emails (including OTPs) print to the server console instead, which makes testing signup painless.

## Things I'd point at in the code

- `server/src/utils/pricing.js` — every rupee is computed server-side; the client never decides a price
- `server/src/controllers/paymentController.js` — Razorpay HMAC-SHA256 signature verification before an order is marked paid
- `server/src/controllers/orderController.js` — atomic stock decrement with a filtered `bulkWrite` so two people can't buy the last unit
- `server/src/utils/mailer.js` — the whole email lifecycle with a console fallback for dev
- `docs/` — system design, a full project guide, and my interview prep notes

## Honest limitations / roadmap

Uploaded product photos live on the API server's disk (ephemeral on Render free tier) — moving to Cloudinary is next. Razorpay webhooks aren't wired yet, so a customer closing the tab mid-payment needs the verify call to succeed. Coupons and bundles are designed but not built. Test coverage is manual right now — supertest for the pricing and auth paths is on the list.

Built with a lot of chai, AI pair-programming, and late-night debugging of CORS. The best part wasn't the code — it was watching the first real order come in.
