import { Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Truck, RotateCcw, FileText, Phone } from 'lucide-react';
import {
  SHOP_NAME,
  SHOP_CONTACT,
  SHOP_YEARS,
  FREE_SHIPPING_ABOVE,
  FREE_SHIPPING_ABOVE_PREPAID,
  SHIPPING_FEE,
  COD_FEE,
  COD_MAX,
} from '../lib/config';

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const Section = ({ icon: Icon, title, children }) => (
  <section className="card p-6 sm:p-8">
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush">
        <Icon size={17} className="text-mulberry" />
      </span>
      <h2 className="font-display text-xl font-bold">{title}</h2>
    </div>
    <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>
  </section>
);

const Policies = () => (
  <div className="container-page py-12">
    <p className="eyebrow">Store policies</p>
    <h1 className="font-display mt-2 max-w-2xl text-4xl font-semibold sm:text-5xl">
      Clear, fair and written for humans.
    </h1>
    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
      {SHOP_NAME} has served customers from our Meerut counter for {SHOP_YEARS} years. These are the
      same straightforward terms we've always worked by — now written down for our online store.
    </p>

    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <Section icon={ShieldCheck} title="100% genuine, always below MRP">
        <p>
          Every product is sourced directly from authorised brand distributors — never from grey-market
          resellers. Products ship factory-sealed, and our selling price is always at or below the MRP
          printed on the pack. All prices are inclusive of all taxes.
        </p>
        <p>
          If you'd ever like proof of sourcing for a product, call us — we're happy to show distributor
          billing. That transparency is how a shop survives {SHOP_YEARS} years.
        </p>
      </Section>

      <Section icon={CreditCard} title="Payments">
        <p>
          <strong className="text-ink">Pay online</strong> via UPI, debit/credit cards, netbanking and
          wallets, processed securely by Razorpay. We never see or store your card or UPI details.
        </p>
        <p>
          <strong className="text-ink">Cash on Delivery</strong> is available on orders up to{' '}
          {inr(COD_MAX)}
          {COD_FEE > 0 ? <> with a {inr(COD_FEE)} COD handling fee</> : <> — no extra COD charges, you pay just the order total</>}
          . Please keep the exact amount ready —
          our delivery partners collect payment at your door.
        </p>
      </Section>

      <Section icon={Truck} title="Shipping & delivery">
        <p>
          Orders are packed at our Meerut store and dispatched within 1–2 working days. Delivery
          typically takes 2–7 days depending on your location. Orders within Meerut city usually
          arrive the same or next day.
        </p>
        <p>
          Shipping is <strong className="text-ink">free above {inr(FREE_SHIPPING_ABOVE_PREPAID)} on
          prepaid orders</strong> and above {inr(FREE_SHIPPING_ABOVE)} on Cash on Delivery. Below
          those, a flat {inr(SHIPPING_FEE)} shipping fee applies — shown clearly at checkout before
          you pay, never after.
        </p>
      </Section>

      <Section icon={RotateCcw} title="Cancellations, refunds & returns">
        <p>
          You can cancel an order from <Link to="/orders" className="font-bold text-mulberry">My Orders</Link>{' '}
          any time before it ships. For prepaid orders, refunds are issued to the original payment
          method within 5–7 working days of cancellation.
        </p>
        <p>
          Because cosmetics are personal-care products, <strong className="text-ink">all sales are
          final</strong> once delivered — we cannot restock opened or returned beauty products, and we
          believe you'd want it no other way for products you put on your skin.
        </p>
        <p>
          That said: if anything about your order is wrong or damaged, contact us within 48 hours of
          delivery and a real person will make it right — that's a {SHOP_YEARS}-year-old promise.
        </p>
      </Section>

      <Section icon={FileText} title="Invoices">
        <p>
          A printable invoice is available for every order — open any order under{' '}
          <Link to="/orders" className="font-bold text-mulberry">My Orders</Link> and tap{' '}
          <strong className="text-ink">Invoice</strong> to view, print or save it as a PDF. Invoices
          show MRP, your price, savings, shipping and payment details.
        </p>
      </Section>

      <Section icon={Phone} title="Talk to us">
        <p>
          {SHOP_CONTACT.address}
        </p>
        <p>
          {SHOP_CONTACT.phones.map((ph, i) => (
            <span key={ph}>
              <a href={`tel:${ph.replace(/\s/g, '')}`} className="font-bold text-mulberry">{ph}</a>
              {i < SHOP_CONTACT.phones.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
        <p>
          <a href={`https://wa.me/${SHOP_CONTACT.whatsapp}`} target="_blank" rel="noreferrer" className="font-bold text-sage">
            WhatsApp us
          </a>{' '}
          ·{' '}
          <a href={`mailto:${SHOP_CONTACT.email}`} className="font-bold text-mulberry">
            {SHOP_CONTACT.email}
          </a>
        </p>
      </Section>
    </div>
  </div>
);

export default Policies;
