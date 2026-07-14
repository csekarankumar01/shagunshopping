import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const mailConfigured = () => !!process.env.RESEND_API_KEY;

const SHOP = () => process.env.SHOP_NAME || 'ShagunShopping';
const ADDRESS = '1, Saraswati Vihar, Rohta Road, Meerut — 250001';
const PHONES = '+91 99270 28982 · +91 87912 10021';
const EMAIL = 'shagunshopping.meerut@gmail.com';

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

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
    <div style="text-align:center;font-size:12px;color:#7d6a72;line-height:1.7;padding-top:20px;">
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
    
    // Resend requires 'onboarding@resend.dev' if you don't have a verified custom domain.
    // Note: onboarding@resend.dev can ONLY send emails to your own registered email address.
    const fromAddress = process.env.MAIL_FROM || 'ShagunShopping <onboarding@resend.dev>';
    
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
         <li>Free shipping on orders above ${inr(process.env.FREE_SHIPPING_ABOVE || 999)}</li>
         <li>Pay by UPI, card, netbanking or Cash on Delivery</li>
       </ul>
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
