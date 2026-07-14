# ShagunShopping — Project Guide & Interview Prep

*Read this twice, then open the files it names and trace each flow once by hand. If you can narrate section 2 without looking, you can survive any interview round on this project.*

---

## 1. Codebase map — what lives where

```
server/src/
  app.js              Express app: helmet, CORS allow-list, rate limits, routes, static /uploads
  server.js           connects Mongo, starts the app
  config/db.js        Mongoose connection
  models/             User.js · Product.js · Order.js  (schemas + bcrypt hook on User)
  controllers/        authController (register/OTP/login/profile/addresses)
                      productController (catalog CRUD, admin list)
                      orderController (create COD+Razorpay, cancel, status, stats)
                      paymentController (Razorpay order + HMAC verify)
  routes/             one file per resource; express-validator rules live here
  middleware/         auth.js (protect/admin via Bearer JWT) · validate.js · error.js
  utils/              pricing.js (ALL money math) · mailer.js (Resend + templates) · token.js
  seed/               catalog.js (43 products) · seed.js (products + admin)

client/src/
  lib/                config.js (shop identity, thresholds — display mirrors)
                      api.js (axios instance, attaches Bearer token) · format.js (inr, dates, status meta)
  context/            AuthContext · CartContext (localStorage) · ToastContext
  components/         Navbar · BottomNav · ProductCard · BrandMarquee · Footer · guards...
  pages/              Home · Shop · ProductDetail · Cart · Checkout · Orders · OrderDetail
                      Invoice · Account · VerifyEmail · Login · Register · About · Policies
  pages/admin/        Dashboard · AdminProducts · ProductForm (photo upload) · AdminOrders
```

Rule of thumb for "where would X be?": money → `pricing.js`; anything sent to a human → `mailer.js`; anything a request must pass before a controller → `middleware/`; anything the browser displays about the shop itself → `lib/config.js`.

## 2. The six flows you must be able to narrate

**① Signup:** Register → user saved `emailVerified:false` → 6-digit OTP generated, **sha256-hashed** into `otpHash` with 10-min expiry → Resend emails it → user types it on `/verify-email` → server hash-compares, enforces expiry + max 5 attempts → flips `emailVerified`, issues JWT, sends welcome email. Login on an unverified account re-sends an OTP instead of erroring.

**② Login/session:** bcrypt compare → JWT signed with `JWT_SECRET` → client stores it, axios attaches `Authorization: Bearer <token>` → `protect` middleware verifies and loads `req.user`; `admin` middleware checks role. (We migrated from httpOnly cookies because Safari kills third-party cookies across vercel.app ↔ onrender.com — real bug, real fix.)

**③ COD order:** client sends items+address+method (never prices) → server fetches products, checks `isActive` + stock → `computeTotals(items,'cod')` applies the ₹1,499 threshold (COD fee waived), rejects if subtotal > ₹2,500 cap → **atomic stock decrement** (`bulkWrite` with `stock: {$gte: qty}` filters) → order `processing` → two emails fire-and-forget: customer confirmation + owner alert.

**④ Online order:** same start, totals with prepaid threshold → order saved `pending` + Razorpay order created → popup → on success client POSTs the three Razorpay ids to `/payment/verify` → server recomputes `HMAC_SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)` and compares to the signature → only then: mark paid, decrement stock, emails.

**⑤ Fulfilment:** owner opens /admin → marks Shipped/Delivered/Cancelled → customer automatically emailed per status; customer cancellation restores stock and alerts the owner (flagged REFUND NEEDED if paid).

**⑥ Invoice:** `/orders/:id/invoice` renders print-CSS HTML → browser's Save-as-PDF. GST break-up is *derived from* the MRP-inclusive total (`total/1.18`), CGST+SGST within UP else IGST, and only appears once `SHOP_GSTIN` is set.

## 3. Interview Q&A bank

### JavaScript / Node
**Q: Why Node for an e-commerce backend?**
I/O-bound workload — DB reads, payment API calls, email sends. Node's event loop handles many concurrent cheap requests well, and one language across the stack meant I could move fast solo. For CPU-heavy work I'd reach elsewhere; nothing here is CPU-heavy.

**Q: What does "fire-and-forget" mean in your email code and why?**
I call the send without `await` and attach `.catch` for logging. An order must never fail because Resend is slow or down — email is a side-effect, not part of the transaction.

**Q: Where do you use async/await error handling?**
Every controller wraps in try/catch and forwards to a central error middleware (`next(err)`), so error responses are consistent and no stack traces leak in production.

### React
**Q: How is state managed?**
Three contexts: Auth (user + token helpers), Cart (persisted to localStorage under a versioned key), Toast. Server data is fetched per page. For this scale, context beats Redux — I can justify that trade-off: fewer moving parts, and no cross-page server-cache needs yet; I'd reach for React Query when the admin grows.

**Q: How does the cart survive refresh but stay honest?**
Items + qty live in localStorage; **prices don't decide anything** — display totals mirror config, and the server recomputes on order. So a stale cached price can never create a mispriced order.

**Q: Why Vite?**
Instant HMR during dev and a lean production build; Tailwind v4 integrates as a first-class plugin. Migration cost from CRA-era tooling is basically zero for a new project.

### MongoDB
**Q: Why embed order items instead of referencing products?**
Historical integrity. Prices and names change; an invoice must reflect purchase time. Classic snapshot-vs-reference trade-off — I reference the product id too, for linking, but never trust it for money.

**Q: How do you prevent overselling the last unit?**
Filtered atomic update: `updateOne({_id, stock:{$gte:qty}}, {$inc:{stock:-qty}})` inside a bulkWrite. Document-level atomicity guarantees only one concurrent buyer matches the filter. If any line fails, the whole order is rejected. With multi-warehouse complexity I'd consider transactions; for one document per product this is simpler and correct.

**Q: Indexes?**
Unique index on user email and product slug; text index for search. First thing I'd profile as the catalog grows.

### Security
**Q: Walk me through password + OTP storage.**
Passwords: bcrypt with salt rounds 10 in a pre-save hook, `select:false` so they never leave queries by accident. OTPs: sha256-hashed with a 10-minute expiry and a 5-attempt counter — a database leak exposes neither passwords nor usable login codes.

**Q: How do you know a Razorpay payment is real?**
I don't trust the client callback. The server recomputes the HMAC-SHA256 of `order_id|payment_id` with my secret key and compares it to Razorpay's signature. Wrong or missing signature → order stays unpaid. The secret never ships to the browser.

**Q: What was the cookies → Bearer token migration and its trade-off?**
httpOnly cookies are more XSS-resistant, but Safari's third-party-cookie blocking broke sessions between my Vercel frontend and Render API — users got logged out at checkout on iPhones. Bearer tokens in the Authorization header fixed it. Trade-off accepted and mitigable: a custom API subdomain (api.shagunshopping.com) would make cookies same-site again; it's on the roadmap.

**Q: File upload risks?**
MIME whitelist (jpg/png/webp), 3 MB cap, server-generated filenames, admin-only route, and SVG explicitly rejected because SVG can carry scripts.

### System design
**Q: What breaks first at 100× traffic?**
In order: Render free-tier cold starts (fix: always-on instance), image disk (Cloudinary), missing payment webhooks (add), then DB tier. The honest answer is that ops breaks before code: at ~20 orders/day, packing becomes the bottleneck — which is why the admin flow and courier integration matter more than micro-optimizing queries.

**Q: Why is pricing server-side such a big deal?**
Anyone can edit client JavaScript. If totals came from the browser, a customer could buy a ₹2,500 serum for ₹1. The client's numbers are UI; the server's numbers are the contract.

**Q: Design the missing piece: payment webhooks.**
Razorpay POSTs `payment.captured` to my endpoint; I verify the webhook signature, look up the order by razorpay_order_id, mark paid idempotently (check `isPaid` first), decrement stock if not already done. Solves the closed-tab-after-paying gap. Idempotency matters because webhooks retry.

### Business/decision questions (your strongest ground)
**Q: Why a COD fee and dual thresholds?**
Indian D2C reality: 15–30% of COD parcels get refused (RTO), and each refusal costs two-way freight. A cheaper free-shipping threshold for prepaid (the COD fee is currently waived) shifts customers to the payment method with near-zero RTO — pricing architecture as risk management. I can show the unit-economics table.

**Q: Why no returns?**
Cosmetics can't be restocked once opened — hygiene and authenticity. Policy is all-sales-final with a 48-hour make-it-right promise handled personally. That's also exactly how the physical counter worked for 25 years.

**Q: Biggest bug you shipped?**
Safari checkout logouts (the cookie issue). Diagnosed via browser devtools showing the cookie never being sent cross-site, confirmed it was ITP behaviour, migrated auth to Bearer tokens, redeployed, verified on a real iPhone.

## 4. Ten rapid-fire one-liners to have ready
1. JWT = signed claims, verified statelessly with a server secret — logout is client-side token deletion.
2. bcrypt is slow **on purpose** — that slowness is brute-force resistance.
3. CORS is browser-enforced; my API allow-lists the storefront origins.
4. Helmet sets security headers (CSP-ish protections, sniffing off, etc.).
5. Rate limiting on /auth blunts credential stuffing and OTP spraying.
6. `select:false` keeps secrets out of queries unless explicitly asked for.
7. Mongoose pre-save hook = password hashing happens in exactly one place.
8. Fire-and-forget emails: side-effects must not fail transactions.
9. Snapshot order items = invoices are immutable history.
10. Env vars per environment: local .env vs Render dashboard; secrets never in git.
