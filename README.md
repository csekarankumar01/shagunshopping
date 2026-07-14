# ShagunShopping — Multi-Brand Cosmetic Store (MERN)

A complete, production-ready e-commerce website for a multi-brand cosmetic shop in India. Customers browse 43 bestsellers across 18 brands (Lotus, Fixderma, Pilgrim, Dot & Key, Swiss Beauty, Deconstruct and more), verify their email with an OTP, pay online through **Razorpay** (UPI / cards / netbanking) or choose **Cash on Delivery**, get order-confirmation emails and track their orders. The shop owner gets an admin panel to manage products (with photo uploads from any device), stock and orders.

**Stack:** MongoDB · Express · React (Vite) · Node.js · Tailwind CSS v4 · Razorpay

---

## What's inside

```
cosmetic-shop/
├── package.json          # Root scripts (run client + server together)
├── server/               # Express + MongoDB API
│   ├── .env.example      # Copy to .env and fill in
│   └── src/
│       ├── server.js     # Entry point
│       ├── app.js        # Express app, security middleware, routes
│       ├── config/db.js
│       ├── models/       # User, Product, Order
│       ├── controllers/  # auth, products, orders, payment
│       ├── routes/       # /api/auth /api/products /api/orders /api/payment
│       ├── middleware/   # JWT auth, admin guard, validation, errors
│       ├── utils/        # tokens, server-side pricing
│       └── seed/seed.js  # Admin user + 18 sample products
└── client/               # React storefront + admin panel
    └── src/
        ├── lib/config.js # ← Shop name, contact details, brand list
        ├── context/      # Auth, Cart, Toasts
        ├── components/   # Navbar, product cards, price display...
        └── pages/        # Home, Shop, Product, Cart, Checkout,
                          # Orders, Login/Register, admin/*
```

### Features

**Storefront**
- Editorial beauty design (Bodoni Moda + Manrope), fully responsive
- 43 seeded bestsellers with in-depth details (description, key ingredients, how to use, size) and original product artwork for every item
- Search, brand & category filters, sorting, pagination
- Every price shown against MRP with "you save" messaging
- Cart persists in the browser; free shipping above ₹999 (configurable)
- Checkout with Indian address validation (10-digit phone, 6-digit PIN)
- Razorpay (UPI, cards, netbanking, wallets) **and** Cash on Delivery
- Email OTP verification at signup (and at login for unverified accounts)
- Welcome email on joining + order-confirmation email on every confirmed order
- Customer accounts, order history, order cancellation, product reviews
- About page (25 years of business) and Store Policies page (no-return policy with contact-us resolution)

**Admin panel** (`/admin`, admin login required)
- Dashboard: revenue, orders to pack, low-stock alerts, recent orders
- Add / edit / hide products, edit prices, details & photos, mark items as featured
- Upload product photos straight from a phone or computer (JPG/PNG/WebP, 3 MB) — or paste an image URL
- Order management with status updates (processing → shipped → delivered)

**Security (already wired in)**
- All prices are computed **on the server from the database** — the client only sends product IDs and quantities, so nobody can tamper with amounts
- Razorpay payment signatures verified server-side (HMAC SHA256)
- Stock is decremented atomically, so two customers can't buy the last unit
- Passwords hashed with bcrypt; JWT in httpOnly cookies (not readable by JS)
- Rate limiting, Helmet security headers, NoSQL-injection sanitisation, input validation on every route

---

## 1 · Run it locally

**Prerequisites:** Node.js 18+ and a MongoDB database (free tier of [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) works great — create a cluster, add a database user, allow your IP, copy the connection string).

```bash
# 1. Install everything (root, server, client)
npm run install-all

# 2. Configure the server
cd server
cp .env.example .env
#    → open .env and set MONGO_URI, JWT_SECRET, admin credentials
cd ..

# 3. Seed the database (creates admin + 18 sample products)
npm run seed

# 4. Start both apps
npm run dev
```

- Storefront: **http://localhost:5173**
- API: **http://localhost:5000/api/health**
- Admin panel: log in with the admin email/password from your `.env`, then visit **/admin**

> The seed script wipes and re-inserts **products** each time it runs (users and orders are kept), so it's safe to re-run while testing.

### Environment variables (`server/.env`)

| Variable | What it is |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string (e.g. `openssl rand -hex 32`) |
| `CLIENT_URL` | Frontend URL, `http://localhost:5173` in dev |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | From the Razorpay dashboard (test keys first) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account — **change the password!** |
| `SHOP_NAME` | Shown in the Razorpay payment window |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Email delivery (OTP codes, welcome & order emails). Leave empty in dev — emails print to the server console instead |
| `FREE_SHIPPING_ABOVE` / `SHIPPING_FEE` | Shipping rules in ₹ |

Shop name, phone/WhatsApp/address shown on the website live in **`client/src/lib/config.js`** — update `SHOP_CONTACT` with your real details.

---

## 2 · Email setup (OTP + order emails)

The store sends three kinds of email: the **OTP verification code** at signup/login, a **welcome email** once verified, and an **order confirmation** whenever an order is confirmed (COD immediately; online payments after verification).

Easiest setup with the shop Gmail (`shagunshopping.meerut@gmail.com`):
1. Turn on **2-Step Verification** for the Google account.
2. Create an **App Password** at https://myaccount.google.com/apppasswords
3. In `server/.env`, set `SMTP_USER` to the Gmail address and `SMTP_PASS` to the 16-character app password.

Gmail's free sending limit (~500 emails/day) is plenty to start. If SMTP is left unconfigured, the server prints every email (including OTP codes) to the console, so you can develop and test without any setup.

> The seeded admin account is pre-verified, so the shop owner can log in even before SMTP is configured.

## 3 · Razorpay setup

1. Create an account at [razorpay.com](https://razorpay.com) and finish KYC (needs PAN, bank account; a GST number strengthens the application).
2. Dashboard → **Settings → API Keys → Generate Test Keys**. Put them in `server/.env`.
3. Place a test order — use Razorpay's [test cards/UPI](https://razorpay.com/docs/payments/payments/test-card-details/). No real money moves in test mode.
4. When you're ready to go live, generate **Live keys**, replace them in the production environment, and complete the website checks Razorpay asks for (they require Contact, Terms, Privacy, Refund/Return and Shipping policy pages on your site).

COD orders skip Razorpay entirely and are marked paid when you set them to *Delivered* in the admin panel.

---

## 4 · Deploy (free-tier friendly)

**Database — MongoDB Atlas** (free M0 cluster). In *Network Access*, allow `0.0.0.0/0` or your host's IPs.

**API — Render / Railway**
- Root directory: `server` · Build: `npm install` · Start: `npm start`
- Environment variables: everything from `.env`, plus `NODE_ENV=production` and `CLIENT_URL=https://your-frontend-domain`
- After the first deploy, run the seed once (Render shell: `npm run seed`)

**Storefront — Vercel**
- Root directory: `client` · Framework: Vite
- Environment variable: `VITE_API_URL=https://your-api-domain` (no trailing slash)

Because the frontend and API sit on different domains, auth cookies are sent with `SameSite=None; Secure` — this is already handled in the code when `NODE_ENV=production`; both sites just need to be HTTPS (Render/Vercel give you that automatically).

Point your custom domain (e.g. `shagunshopping.in`) at Vercel, and optionally an `api.` subdomain at Render.

---

## 5 · Before you take real orders — checklist

- [ ] Change the admin password and `JWT_SECRET` from the defaults
- [ ] Replace placeholder contact details in `client/src/lib/config.js`
- [ ] The About and Store Policies pages are built in (`/about`, `/policies`) — review the wording; add a Privacy & Terms page if Razorpay's review asks for them
- [ ] Switch Razorpay from test keys to live keys
- [ ] Talk to a CA about GST — mandatory once online sales cross the threshold, and marketplaces/payment gateways expect it
- [ ] Source stock only from authorised distributors and keep invoices (protects you against "fake product" disputes, and some brands police heavy online discounting)
- [ ] Set up shipping: Shiprocket or Delhivery Direct let a small shop print labels and get discounted courier rates; they also handle COD cash collection (remitted to your bank weekly)
- [ ] Replace the product artwork with real photos: open a product in the admin panel and tap **Upload** to add photos from your phone. Uploads are stored on the API server's disk — fine on a VPS/persistent disk, but on Render's free tier files vanish on redeploy, so for production either add a persistent disk or switch to Cloudinary (see below)

## Ideas for later

- Razorpay **webhooks** for bulletproof payment confirmation even if the customer closes the tab mid-payment
- Swap disk uploads for **Cloudinary** so photos survive redeploys on free hosting
- GST-compliant PDF invoices emailed on each order
- WhatsApp order notifications (customers in India love this)
- Coupon codes and a wishlist

---

Built with the MERN stack. Questions about the code? Every controller and page is commented — start with `server/src/app.js` and `client/src/App.jsx` and follow the imports.
