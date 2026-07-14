# ShagunShopping — System Design

*How the pieces fit together, and why they're shaped this way.*

## 1. Architecture at a glance

```
                        ┌──────────────────────────┐
                        │   Customer / Admin        │
                        │   (browser, mobile)       │
                        └─────────┬────────────────┘
                                  │ HTTPS
              ┌───────────────────┼───────────────────────┐
              ▼                   ▼                       ▼
   ┌────────────────┐   ┌─────────────────┐    ┌──────────────────┐
   │  Vercel (CDN)  │   │  Render          │    │ Razorpay Checkout│
   │  React SPA     │──▶│  Express API     │◀──▶│ (payment popup)  │
   │  static build  │   │  Node 18+        │    └──────────────────┘
   └────────────────┘   └───┬────────┬─────┘
                            │        │
                   Mongoose │        │ REST
                            ▼        ▼
                 ┌──────────────┐  ┌──────────────┐
                 │ MongoDB Atlas│  │ Resend (email)│
                 │ users/products│ │ OTP, orders,  │
                 │ /orders      │  │ owner alerts  │
                 └──────────────┘  └──────────────┘
```

Frontend and API are **deliberately on separate origins** (Vercel + Render). That forced two real engineering decisions: CORS configuration, and the move from httpOnly cookies to Bearer tokens (Safari blocks third-party cookies across domains — users were being logged out at checkout on iPhones).

## 2. Data models (Mongoose)

**User** — name, email (unique), password (bcrypt, `select: false`), phone, role (`customer|admin`), `emailVerified`, OTP fields (`otpHash` sha256, `otpExpires`, `otpAttempts` — all `select: false`), `addresses[]` (embedded subdocs with `isDefault`), `preferredPayment`.

**Product** — name, slug, brand, category, mrp, price, stock, images[], featured, description, ingredients, howToUse, size, isActive.

**Order** — user ref, `orderItems[]` (**snapshot** of name/brand/price/mrp/qty at purchase time — prices change, history must not), shippingAddress (embedded copy, same reason), paymentMethod, `itemsPrice / shippingPrice / codFee / totalPrice`, isPaid, paymentResult (Razorpay ids), status (`pending|processing|shipped|delivered|cancelled`).

Two denormalization choices worth defending in an interview: order items and addresses are **copied**, not referenced. An invoice from March must show March's price and the address it actually shipped to, even if the product or the user's saved address changes later.

## 3. Key flows

### 3.1 Signup with email OTP
```
POST /auth/register → create user (emailVerified:false)
  → generate 6-digit OTP → store sha256(otp) + 10-min expiry → email via Resend
client → /verify-email screen
POST /auth/verify-otp → compare hashes, check expiry + attempt counter (max 5)
  → set emailVerified → issue JWT → welcome email (fire-and-forget)
```
Login on an unverified account re-triggers the OTP instead of failing — abandoned signups can always recover. OTPs are stored **hashed**: a DB leak shouldn't hand out live login codes.

### 3.2 Placing an order (the money path)
```
client sends: [{product, qty}], shippingAddress, paymentMethod   ← no prices!
server: fetch products → validate stock → COMPUTE totals from DB prices
        (pricing.js: threshold by payment method, COD cap; COD fee waived)
COD:      atomic stock decrement → create order(processing)
          → confirmation email + owner alert
Razorpay: create order(pending) + Razorpay order → client opens popup
          → POST /payment/verify with razorpay_signature
          → server recomputes HMAC-SHA256(order_id|payment_id, key_secret)
          → match? mark paid, decrement stock, emails. No match? reject.
```
The two sentences I'd say slowly in an interview: **the client never sends a price**, and **payment success is proven by an HMAC signature verified on my server**, not by the popup's callback saying "success."

### 3.3 Stock without race conditions
Decrement uses a filtered update per item — `{ _id, stock: { $gte: qty } }` with `$inc: -qty` in a `bulkWrite`. If two buyers race for the last unit, MongoDB's document-level atomicity means exactly one filter matches. If any item fails, the order isn't created and the buyer gets "stock changed while ordering."

### 3.4 Email lifecycle
Every send is **fire-and-forget** (`.catch` → log). An email provider outage must never block or fail an order. Events: OTP, welcome, order confirmation (COD create / payment verify), owner new-order alert, status updates (shipped/delivered/cancelled), owner cancellation alert (flags REFUND NEEDED if paid).

## 4. Pricing & COD economics (business logic as code)

| Rule | Value | Why |
|---|---|---|
| Free shipping (prepaid) | ₹1,199 | reward the payment method with ~0% RTO |
| Free shipping (COD) | ₹1,499 | COD costs courier fee + refusal risk |
| Flat shipping below | ₹49 | honest partial cost recovery |
| COD fee | ₹0 (waived; env-configurable) | courier cash charge absorbed in margin |
| COD cap | ₹2,500 | big refused parcels hurt most |

All env-configurable; the client mirrors them for display but the server recomputes on every order.

## 5. Security posture

- Passwords: bcrypt (salt 10). JWT Bearer tokens; middleware `protect` → `admin` chain.
- Razorpay: HMAC verification server-side; secret never leaves the server.
- OTP: hashed at rest, 10-min TTL, 5-attempt cap, resend rate-limited with the auth limiter.
- Validation: express-validator on every write route; Mongoose schema validation as the second net.
- Uploads: admin-only, MIME whitelist (jpg/png/webp), 3 MB cap, filenames regenerated server-side (never trust client filenames), SVG deliberately excluded (XSS vector).
- Helmet, CORS allow-list, rate limiting on auth routes.
- Secrets in env vars only; `.env` git-ignored.

## 6. Deployment & ops

- **Vercel**: static build + SPA rewrites (`vercel.json`), auto-deploy on push.
- **Render**: Node API, auto-deploy on push, env vars in dashboard. Free tier sleeps → first request cold-starts (~30s); the paid always-on tier is the first scaling spend.
- **Atlas M0** free cluster; indexes on product slug + text search fields.
- Known trade-off: uploaded images on ephemeral disk → Cloudinary migration planned.

## 7. Scaling path (in the order things would actually break)

1. Render always-on instance (cold starts lose customers) — ₹~600/mo
2. Cloudinary for images (survive redeploys, CDN delivery)
3. Razorpay **webhooks** (payment truth even if the buyer's tab dies)
4. Shiprocket API integration (order sync + tracking webhooks → auto status emails)
5. Atlas M10 + read concern tuning when order volume demands it
6. Redis for sessions/rate-limit state if horizontal API scaling ever happens

## 8. Failure modes I've thought about

| Failure | Behaviour today |
|---|---|
| Resend down | Orders unaffected; emails logged as failed |
| Razorpay popup closed mid-pay | Order stays `pending` unpaid; visible in My Orders (webhooks will close this gap) |
| Two buyers, one unit | Filtered atomic update — one wins, one gets a clean error |
| Render cold start | First hit slow; health endpoint + UptimeRobot ping mitigate |
| Client tampers with totals | Irrelevant — server recomputes from DB prices |
