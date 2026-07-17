import { Resend } from 'resend';

const mailConfigured = () => !!process.env.RESEND_API_KEY;
const resend = mailConfigured() ? new Resend(process.env.RESEND_API_KEY) : null;

const SHOP = () => process.env.SHOP_NAME || 'ShagunShopping';
const ADDRESS = '1, Saraswati Vihar, Rohta Road, Meerut — 250001';
const PHONES = '+91 99270 28982 · +91 87912 10021';
const EMAIL = 'shagunshopping.meerut@gmail.com';

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const INSTAGRAM_URL = 'https://www.instagram.com/shagunshoppingcenter/';
const REVIEW_URL = 'https://g.page/r/CUI8lS1afKfQEBM/review';
const FREE_SHIP_PREPAID = () => Number(process.env.FREE_SHIPPING_ABOVE_PREPAID || 1199);
const FREE_SHIP_COD = () => Number(process.env.FREE_SHIPPING_ABOVE || 1499);

/** Shared email shell: simple, inline-styled HTML that renders everywhere. */
const shell = (title, bodyHtml) => `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#fbf7f6;font-family:Arial,Helvetica,sans-serif;color:#26191f;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;padding-bottom:20px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:28px;font-weight:bold;">${SHOP()}</span>
      <div style="font-size:11px;letter-spacing:3px;color:#8a2d52;margin-top:4px;">GENUINE BEAUTY, BELOW MRP</div>
    </div>
    <div style="background:#ffffff;border:1px solid #ebdcd9;border-radius:16px;padding:28px;">
      <h1 style="font-size:20px;margin:0 0 14px;">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="text-align:center;padding-top:18px;">
      <a href="${INSTAGRAM_URL}" style="display:inline-block;background:#8a2d52;color:#ffffff;text-decoration:none;font-size:12px;font-weight:bold;padding:9px 18px;border-radius:999px;margin:0 4px;">Follow us on Instagram</a>
      <a href="${REVIEW_URL}" style="display:inline-block;background:#ffffff;color:#8a2d52;border:1px solid #8a2d52;text-decoration:none;font-size:12px;font-weight:bold;padding:8px 18px;border-radius:999px;margin:0 4px;">★ Rate us on Google</a>
      <div style="font-size:11px;color:#7d6a72;margin-top:8px;">New arrivals &amp; offers on Instagram · Your review helps our small family shop grow</div>
    </div>
    <div style="text-align:center;font-size:12px;color:#7d6a72;line-height:1.7;padding-top:14px;">
      ${SHOP()} · ${ADDRESS}<br/>
      ${PHONES} · ${EMAIL}<br/>
      All sales are final — for any inconvenience with your order, call or email us and we'll sort it out.
    </div>
  </div>
</body>
</html>`;

/** Fire-and-forget sender; never throws into request flow. */
export const sendMail = async ({ to, subject, html }) => {
  try {
    if (!mailConfigured()) {
      console.log(`[mail:dev] To: ${to} | Subject: ${subject}`);
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`[mail:dev] ${text.slice(0, 300)}...`);
      return;
    }
    
    const fromAddress = process.env.MAIL_FROM || 'ShagunShopping <support@shagunshopping.com>';
    
    const { error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });
    
    if (error) {
      console.error('Email send failed:', error.message);
    }
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

/* ---------------- Templates ---------------- */

export const sendOtpEmail = (to, name, otp) =>
  sendMail({
    to,
    subject: `${otp} is your ${SHOP()} verification code`,
    html: shell(
      'Verify your email',
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">Hi ${name},</p>
       <p style="font-size:14px;line-height:1.7;color:#4a3a42;">Use this one-time code to verify your email address:</p>
       <div style="text-align:center;margin:22px 0;">
         <span style="display:inline-block;background:#f3dad3;color:#6b2140;font-size:32px;font-weight:bold;letter-spacing:10px;padding:14px 26px;border-radius:12px;">${otp}</span>
       </div>
       <p style="font-size:13px;line-height:1.7;color:#7d6a72;">The code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>`
    ),
  });

export const sendWelcomeEmail = (to, name) =>
  sendMail({
    to,
    subject: `Welcome to ${SHOP()}, ${name}!`,
    html: shell(
      `Welcome to the family, ${name}!`,
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">Your email is verified and your account is ready.</p>
       <p style="font-size:14px;line-height:1.7;color:#4a3a42;">For 25 years our counter in Meerut has sold 100% genuine skincare, haircare and makeup from authorised distributors — always below MRP. Now it's all just a tap away:</p>
       <ul style="font-size:14px;line-height:1.9;color:#4a3a42;padding-left:18px;">
         <li>18 trusted brands, every product genuine &amp; sealed</li>
         <li>Every price below MRP — see your savings on each item</li>
         <li>Free shipping above ${inr(FREE_SHIP_PREPAID())} when you pay online, or above ${inr(FREE_SHIP_COD())} on Cash on Delivery</li>
         <li>Pay by UPI (GPay / PhonePe / Paytm), card, netbanking or Cash on Delivery</li>
       </ul>
       <div style="text-align:center;margin:20px 0 6px;">
         <a href="${INSTAGRAM_URL}" style="display:inline-block;background:#8a2d52;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;padding:11px 24px;border-radius:999px;">Follow @shagunshoppingcenter</a>
       </div>
       <p style="font-size:12.5px;line-height:1.7;color:#7d6a72;text-align:center;margin:0 0 4px;">Offers, new arrivals and genuine-vs-fake tips — first on Instagram.</p>
       <p style="font-size:12.5px;line-height:1.7;color:#7d6a72;text-align:center;margin:0;">Shopped with us before at the Meerut counter? <a href="${REVIEW_URL}" style="color:#8a2d52;font-weight:bold;">Leave us a Google review</a> — it means the world to a 25-year-old family shop.</p>
       <p style="font-size:14px;line-height:1.7;color:#4a3a42;">Happy shopping!<br/>— The ${SHOP()} family</p>`
    ),
  });

export const sendOrderConfirmationEmail = (to, name, order) => {
  const rows = order.orderItems
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#4a3a42;border-bottom:1px solid #f0e5e2;">${it.name}<br/><span style="color:#7d6a72;font-size:12px;">${it.brand} · Qty ${it.qty}</span></td>
        <td style="padding:8px 0;font-size:13px;color:#26191f;border-bottom:1px solid #f0e5e2;text-align:right;font-weight:bold;">${inr(it.price * it.qty)}</td>
      </tr>`
    )
    .join('');
  const a = order.shippingAddress;
  const shortId = `#${order._id.toString().slice(-6).toUpperCase()}`;
  return sendMail({
    to,
    subject: `Order ${shortId} confirmed — ${SHOP()}`,
    html: shell(
      `Thank you, ${name}! Order ${shortId} is confirmed`,
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">
         ${order.paymentMethod === 'cod' ? 'You chose Cash on Delivery — keep the amount ready when your order arrives.' : 'Your payment was received and verified successfully.'}
         We're packing your order at our Meerut counter and it will be dispatched within 1–2 working days.
       </p>
       <table style="width:100%;border-collapse:collapse;margin:14px 0;">${rows}
         <tr><td style="padding:8px 0;font-size:13px;color:#7d6a72;">Items</td><td style="padding:8px 0;font-size:13px;text-align:right;">${inr(order.itemsPrice)}</td></tr>
         <tr><td style="padding:2px 0;font-size:13px;color:#7d6a72;">Shipping</td><td style="padding:2px 0;font-size:13px;text-align:right;">${order.shippingPrice === 0 ? 'Free' : inr(order.shippingPrice)}</td></tr>
         ${order.codFee ? `<tr><td style="padding:2px 0;font-size:13px;color:#7d6a72;">COD fee</td><td style="padding:2px 0;font-size:13px;text-align:right;">${inr(order.codFee)}</td></tr>` : ''}
         <tr><td style="padding:10px 0;font-size:15px;font-weight:bold;">Total</td><td style="padding:10px 0;font-size:15px;text-align:right;font-weight:bold;color:#8a2d52;">${inr(order.totalPrice)}</td></tr>
       </table>
       <div style="background:#fbf7f6;border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.7;color:#4a3a42;">
         <strong>Delivering to</strong><br/>
         ${a.fullName}<br/>${a.line1}${a.line2 ? ', ' + a.line2 : ''}<br/>${a.city}, ${a.state} — ${a.pincode}<br/>${a.phone}
       </div>
       <p style="font-size:13px;line-height:1.7;color:#7d6a72;margin-top:14px;">Track it anytime under <strong>My Orders</strong> on the website. Questions? Call ${PHONES}.</p>`
    ),
  });
};

/* ---------------- Owner & status-update emails ---------------- */

const OWNER = () => process.env.OWNER_EMAIL || EMAIL;
const ADMIN_ORDERS_URL = () =>
  `${process.env.CLIENT_URL || 'https://shagunshopping.com'}/admin/orders`;

const itemRows = (order) =>
  order.orderItems
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#4a3a42;border-bottom:1px solid #f0e5e2;">${it.name}<br/><span style="color:#7d6a72;font-size:12px;">${it.brand} · Qty ${it.qty}</span></td>
        <td style="padding:8px 0;font-size:13px;color:#26191f;border-bottom:1px solid #f0e5e2;text-align:right;font-weight:bold;">${inr(it.price * it.qty)}</td>
      </tr>`
    )
    .join('');

const addressBlock = (a) => `
  <div style="background:#fbf7f6;border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.7;color:#4a3a42;">
    <strong>Deliver to</strong><br/>
    ${a.fullName}<br/>${a.line1}${a.line2 ? ', ' + a.line2 : ''}<br/>${a.city}, ${a.state} — ${a.pincode}<br/>${a.phone}
  </div>`;

const shortRef = (order) => `#${order._id.toString().slice(-6).toUpperCase()}`;

/** New-order alert to the shop owner with payment mode/status and a manage link. */
export const sendOwnerNewOrderEmail = (order, customer) => {
  const ref = shortRef(order);
  const payment =
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery — collect on delivery'
      : `Paid online (Razorpay)${order.paymentResult?.razorpayPaymentId ? ` · Payment ID ${order.paymentResult.razorpayPaymentId}` : ''}`;
  return sendMail({
    to: OWNER(),
    subject: `New order ${ref} — ${inr(order.totalPrice)} (${order.paymentMethod === 'cod' ? 'COD' : 'PAID'})`,
    html: shell(
      `New order ${ref} just came in!`,
      `<table style="width:100%;border-collapse:collapse;font-size:13px;color:#4a3a42;">
         <tr><td style="padding:4px 0;color:#7d6a72;">Customer</td><td style="padding:4px 0;text-align:right;font-weight:bold;">${customer?.name || order.shippingAddress.fullName}</td></tr>
         <tr><td style="padding:4px 0;color:#7d6a72;">Email</td><td style="padding:4px 0;text-align:right;">${customer?.email || '—'}</td></tr>
         <tr><td style="padding:4px 0;color:#7d6a72;">Phone</td><td style="padding:4px 0;text-align:right;">${order.shippingAddress.phone}</td></tr>
         <tr><td style="padding:4px 0;color:#7d6a72;">Payment</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:${order.isPaid ? '#52705c' : '#ad8a2d'};">${payment}</td></tr>
       </table>
       <table style="width:100%;border-collapse:collapse;margin:14px 0;">${itemRows(order)}
         <tr><td style="padding:10px 0;font-size:15px;font-weight:bold;">Total</td><td style="padding:10px 0;font-size:15px;text-align:right;font-weight:bold;color:#8a2d52;">${inr(order.totalPrice)}</td></tr>
       </table>
       ${addressBlock(order.shippingAddress)}
       <div style="text-align:center;margin-top:20px;">
         <a href="${ADMIN_ORDERS_URL()}" style="display:inline-block;background:#8a2d52;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:999px;">Manage this order</a>
       </div>
       <p style="font-size:12px;line-height:1.7;color:#7d6a72;margin-top:14px;text-align:center;">Pack it, then mark it <strong>Shipped</strong> in the admin panel — the customer is emailed automatically at every step.</p>`
    ),
  });
};

/** Status-change email to the customer (shipped / delivered / cancelled). */
export const sendOrderStatusEmail = (to, name, order) => {
  const ref = shortRef(order);
  const copy = {
    shipped: {
      subject: `Order ${ref} is on its way!`,
      title: `Good news, ${name} — your order is on its way!`,
      body: `Your order ${ref} has been packed at our Meerut counter and handed to the courier. It usually arrives within 2–7 days.${order.paymentMethod === 'cod' && !order.isPaid ? ` Please keep ${inr(order.totalPrice)} ready — payment is collected on delivery.` : ''}`,
    },
    delivered: {
      subject: `Order ${ref} delivered — enjoy!`,
      title: `Delivered! Enjoy your products, ${name}`,
      body: `Your order ${ref} has been delivered. Every product is 100% genuine, sourced from authorised distributors. If anything about your order isn't right, call us on ${PHONES} and we'll sort it out personally.`,
    },
    cancelled: {
      subject: `Order ${ref} has been cancelled`,
      title: `Your order ${ref} was cancelled`,
      body: `This order has been cancelled${order.isPaid ? ' and your refund will be processed to the original payment method within 5–7 working days' : ''}. If this wasn't expected or you have any questions, call us on ${PHONES} or reply to this email.`,
    },
  }[order.status];
  if (!copy) return Promise.resolve();
  return sendMail({
    to,
    subject: copy.subject,
    html: shell(
      copy.title,
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">${copy.body}</p>
       <table style="width:100%;border-collapse:collapse;margin:14px 0;">${itemRows(order)}
         <tr><td style="padding:10px 0;font-size:15px;font-weight:bold;">Total</td><td style="padding:10px 0;font-size:15px;text-align:right;font-weight:bold;color:#8a2d52;">${inr(order.totalPrice)}</td></tr>
       </table>
       ${order.status === 'shipped' && order.trackingUrl ? `<div style="text-align:center;margin:18px 0;"><a href="${order.trackingUrl}" style="display:inline-block;background:#8a2d52;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:999px;">Track your parcel</a></div>` : ''}
       ${order.status === 'shipped' ? addressBlock(order.shippingAddress) : ''}`
    ),
  });
};

/** Alert to the owner when a customer cancels their own order. */
export const sendOwnerCancelledEmail = (order, customer) => {
  const ref = shortRef(order);
  return sendMail({
    to: OWNER(),
    subject: `Order ${ref} cancelled by customer${order.isPaid ? ' — REFUND NEEDED' : ''}`,
    html: shell(
      `Order ${ref} was cancelled by the customer`,
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">
         ${customer?.name || order.shippingAddress.fullName} (${customer?.email || order.shippingAddress.phone}) cancelled order ${ref} worth ${inr(order.totalPrice)}.
         ${order.isPaid ? '<strong style="color:#8a2d52;">This order was already paid online — issue the refund from the Razorpay dashboard.</strong>' : 'No payment was collected, so nothing further is needed.'}
         Stock has been restored automatically.
       </p>
       <div style="text-align:center;margin-top:16px;">
         <a href="${ADMIN_ORDERS_URL()}" style="display:inline-block;background:#8a2d52;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:999px;">Open admin panel</a>
       </div>`
    ),
  });
};


/* ---------------- Security & ops emails ---------------- */

export const sendPasswordResetEmail = (to, name, otp) =>
  sendMail({
    to,
    subject: `${otp} is your ${SHOP()} password reset code`,
    html: shell(
      'Reset your password',
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">Hi ${name},</p>
       <p style="font-size:14px;line-height:1.7;color:#4a3a42;">Use this one-time code to reset your password:</p>
       <div style="text-align:center;margin:22px 0;">
         <span style="display:inline-block;background:#f3dad3;color:#6b2140;font-size:32px;font-weight:bold;letter-spacing:10px;padding:14px 26px;border-radius:12px;">${otp}</span>
       </div>
       <p style="font-size:13px;line-height:1.7;color:#7d6a72;">The code expires in 10 minutes. If you didn't request this, you can safely ignore this email — your password stays unchanged.</p>`
    ),
  });

export const sendPasswordChangedEmail = (to, name) =>
  sendMail({
    to,
    subject: `Your ${SHOP()} password was changed`,
    html: shell(
      'Password changed',
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">Hi ${name}, your account password was just changed.</p>
       <p style="font-size:13px;line-height:1.7;color:#7d6a72;">If this was you, no action is needed. If it wasn't, reset your password immediately using "Forgot password" and call us on ${PHONES}.</p>`
    ),
  });

export const sendAdminLoginAlert = (to, name, ip) =>
  sendMail({
    to,
    subject: `Admin login to ${SHOP()} just now`,
    html: shell(
      'Admin login alert',
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">The admin account (${name}) just signed in${ip ? ` from IP <strong>${ip}</strong>` : ''}.</p>
       <p style="font-size:13px;line-height:1.7;color:#7d6a72;">If this wasn't you, change the admin password immediately and rotate JWT_SECRET on the server.</p>`
    ),
  });

export const sendOversellAlert = (order) => {
  const ref = `#${order._id.toString().slice(-6).toUpperCase()}`;
  return sendMail({
    to: process.env.OWNER_EMAIL || EMAIL,
    subject: `ACTION NEEDED: order ${ref} paid but stock was short`,
    html: shell(
      `Order ${ref} needs your attention`,
      `<p style="font-size:14px;line-height:1.7;color:#4a3a42;">
         This order was <strong>paid successfully</strong>, but one or more items ran out of stock between order creation and payment confirmation.
         The order is marked paid — please either source the item, ship a substitute after calling the customer, or issue a refund from the Razorpay dashboard.
       </p>`
    ),
  });
};
