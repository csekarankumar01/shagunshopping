import { BRANDS } from '../lib/config';
import { Link } from 'react-router-dom';

/**
 * The multi-brand counter, made visual: one continuous ticker of every brand
 * the shop stocks. Pauses on hover; each name filters the shop.
 */
const BrandMarquee = () => {
  const row = [...BRANDS, ...BRANDS]; // duplicated for a seamless loop
  return (
    <section aria-label="Brands we stock" className="marquee-mask overflow-hidden border-y border-line bg-white py-4">
      <div className="animate-marquee flex w-max items-center">
        {row.map((brand, i) => (
          <Link
            key={`${brand}-${i}`}
            to={`/shop?brand=${encodeURIComponent(brand)}`}
            className="font-display mx-6 whitespace-nowrap text-lg italic text-ink/70 transition-colors hover:text-mulberry"
          >
            {brand}
            <span aria-hidden="true" className="ml-12 inline-block h-1.5 w-1.5 rounded-full bg-blush align-middle" />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BrandMarquee;
