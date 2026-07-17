import { Link } from 'react-router-dom';
import { SHOP_NAME, SHOP_CONTACT, SHOP_YEARS } from '../lib/config';

const Footer = () => (
  <footer className="mt-20 border-t border-line bg-white">
    <div className="container-page grid gap-10 py-12 sm:grid-cols-3">
      <div>
        <p className="font-display text-2xl font-bold italic">{SHOP_NAME}</p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
          {SHOP_YEARS} years of genuine beauty from our Meerut counter — every
          product sourced from authorised distributors and sold below MRP.
        </p>
      </div>
      <div>
        <p className="eyebrow mb-3">Explore</p>
        <ul className="space-y-2 text-sm">
          <li><Link to="/shop" className="hover:text-mulberry">All products</Link></li>
          <li><Link to="/shop?category=Skincare" className="hover:text-mulberry">Skincare</Link></li>
          <li><Link to="/shop?category=Makeup" className="hover:text-mulberry">Makeup</Link></li>
          <li><Link to="/about" className="hover:text-mulberry">Our story</Link></li>
          <li><Link to="/policies" className="hover:text-mulberry">Store policies</Link></li>
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-3">Reach us</p>
        <ul className="space-y-2 text-sm text-muted">
          <li>{SHOP_CONTACT.address}</li>
          {SHOP_CONTACT.phones.map((ph) => (
            <li key={ph}>
              <a href={`tel:${ph.replace(/\s/g, '')}`} className="hover:text-mulberry">{ph}</a>
            </li>
          ))}
          <li>
            <a
              href={`https://wa.me/${SHOP_CONTACT.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sage hover:text-mulberry"
            >
              Chat on WhatsApp
            </a>
          </li>
          <li>
            <a href={`mailto:${SHOP_CONTACT.email}`} className="hover:text-mulberry">{SHOP_CONTACT.email}</a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-line py-4">
      <div className="container-page flex flex-col items-center justify-between gap-4 text-center text-xs text-muted sm:flex-row sm:text-left">
        <p>
          © {new Date().getFullYear()} {SHOP_NAME}. All products are 100% genuine. All sales are
          final — see our <Link to="/policies" className="font-semibold text-mulberry">store policies</Link>.
        </p>
        <p className="shrink-0">
          Developed by <span className="font-medium text-ink">Karan Kumar</span> •{' '}
          <a href="mailto:cse.karankumar01@gmail.com" className="transition-colors hover:text-mulberry">
            cse.karankumar01@gmail.com
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
