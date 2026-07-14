import { Link } from 'react-router-dom';
import { BadgeCheck, Store, HeartHandshake, Phone } from 'lucide-react';
import { SHOP_NAME, SHOP_CONTACT, SHOP_YEARS, SHOP_ESTD, BRANDS } from '../lib/config';

const About = () => (
  <div className="container-page max-w-3xl py-12">
    <p className="eyebrow">Our story</p>
    <h1 className="font-display mt-2 text-5xl font-semibold leading-tight">
      {SHOP_YEARS} successful years, <em className="text-mulberry">one promise.</em>
    </h1>

    <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted">
      <p>
        {SHOP_NAME} began in {SHOP_ESTD} as a small beauty counter on Rohta Road,
        Meerut. {SHOP_YEARS} years later, we're still a family-run shop — the kind
        where regulars are greeted by name, where we remember which cream suited
        your skin, and where three generations of the same families keep coming
        back. This website simply brings that counter to your doorstep.
      </p>
      <p>
        In {SHOP_YEARS} years we've built something that can't be shortcut:
        direct relationships with the authorised distributors of{' '}
        15+ brands. Every tube, jar and bottle we sell comes through
        official channels with proper invoices — that's how we guarantee 100%
        genuine products, and it's also how we can price everything below MRP.
        No middlemen, no grey-market stock, no compromises.
      </p>
      <p>
        We're not a faceless marketplace. If something about your order isn't
        right, you call us and a real person — usually family — picks up and
        sorts it out. That's how we've done business since {SHOP_ESTD}, and
        going online doesn't change it.
      </p>
    </div>

    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {[
        { icon: Store, title: `Est. ${SHOP_ESTD}`, text: `${SHOP_YEARS} years of serving Meerut from our counter on Rohta Road.` },
        { icon: BadgeCheck, title: '100% genuine', text: 'Sourced only from authorised brand distributors, with invoices to prove it.' },
        { icon: HeartHandshake, title: 'Family-run', text: 'A real shop with real people who answer the phone and stand by every sale.' },
      ].map(({ icon: Icon, title, text }) => (
        <div key={title} className="card p-5">
          <Icon size={22} className="text-mulberry" />
          <p className="mt-3 text-sm font-bold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
        </div>
      ))}
    </div>

    <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
      <div>
        <p className="font-bold">Visit us or say hello</p>
        <p className="mt-1 text-sm text-muted">{SHOP_CONTACT.address}</p>
        <p className="mt-1 text-sm text-muted">
          {SHOP_CONTACT.phones.join(' · ')} · {SHOP_CONTACT.email}
        </p>
      </div>
      <a href={`tel:${SHOP_CONTACT.phones[0].replace(/\s/g, '')}`} className="btn-primary btn-sm">
        <Phone size={14} /> Call the shop
      </a>
    </div>

    <p className="mt-8 text-sm text-muted">
      Ready to shop? <Link to="/shop" className="font-bold text-mulberry">Browse the full catalogue →</Link>
    </p>
  </div>
);

export default About;
