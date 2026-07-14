import { Phone, Mail, Truck, PackageX, ShieldCheck } from 'lucide-react';
import { SHOP_NAME, SHOP_CONTACT, FREE_SHIPPING_ABOVE, SHIPPING_FEE } from '../lib/config';

const Section = ({ icon: Icon, title, children }) => (
  <section className="card p-6">
    <div className="flex items-center gap-3">
      <Icon size={20} className="text-mulberry" />
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
  </section>
);

const Policies = () => (
  <div className="container-page max-w-3xl py-12">
    <p className="eyebrow">The fine print, kept simple</p>
    <h1 className="font-display mt-2 text-5xl font-semibold leading-tight">Store policies</h1>

    <div className="mt-8 space-y-5">
      <Section icon={PackageX} title="Returns & exchanges">
        <p>
          <strong className="text-ink">All sales are final.</strong> {SHOP_NAME} does not
          accept returns or exchanges. Cosmetic and personal-care products are
          hygiene-sensitive, so once an order is delivered it cannot be sent back —
          this is how we keep every product on our shelves fresh, sealed and genuine.
        </p>
        <p>
          <strong className="text-ink">Faced any inconvenience with your order?</strong>{' '}
          Talk to us directly — call or WhatsApp{' '}
          <a href={`tel:${SHOP_CONTACT.phones[0].replace(/\s/g, '')}`} className="font-bold text-mulberry">{SHOP_CONTACT.phones[0]}</a>{' '}
          or{' '}
          <a href={`tel:${SHOP_CONTACT.phones[1].replace(/\s/g, '')}`} className="font-bold text-mulberry">{SHOP_CONTACT.phones[1]}</a>,
          or email{' '}
          <a href={`mailto:${SHOP_CONTACT.email}`} className="font-bold text-mulberry">{SHOP_CONTACT.email}</a>.
          A member of our family answers personally and we will do our best to
          resolve any genuine problem with your order.
        </p>
      </Section>

      <Section icon={Truck} title="Shipping & delivery">
        <p>
          Orders are packed at our Meerut counter and dispatched within 1–2
          working days. Delivery typically takes 2–7 days depending on your
          location.
        </p>
        <p>
          Shipping is <strong className="text-ink">free on orders above ₹{FREE_SHIPPING_ABOVE}</strong>;
          below that, a flat ₹{SHIPPING_FEE} shipping fee applies. Cash on
          Delivery is available across India.
        </p>
      </Section>

      <Section icon={ShieldCheck} title="Payments & authenticity">
        <p>
          Online payments (UPI, cards, netbanking, wallets) are processed
          securely by Razorpay — we never see or store your card details. Every
          amount is verified on our server before an order is confirmed.
        </p>
        <p>
          Every product is sourced from authorised brand distributors with
          proper invoices, and is sold sealed. That is our {`${SHOP_YEARS}-year`} guarantee
          of authenticity.
        </p>
      </Section>

      <Section icon={Phone} title="Contact us">
        <p>{SHOP_NAME}, {SHOP_CONTACT.address}</p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href={`tel:${SHOP_CONTACT.phones[0].replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-bold text-mulberry"><Phone size={14} /> {SHOP_CONTACT.phones[0]}</a>
          <a href={`tel:${SHOP_CONTACT.phones[1].replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-bold text-mulberry"><Phone size={14} /> {SHOP_CONTACT.phones[1]}</a>
          <a href={`mailto:${SHOP_CONTACT.email}`} className="inline-flex items-center gap-1.5 font-bold text-mulberry"><Mail size={14} /> {SHOP_CONTACT.email}</a>
        </p>
      </Section>
    </div>
  </div>
);

export default Policies;
