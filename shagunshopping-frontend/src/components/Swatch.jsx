import { CATEGORY_META } from '../lib/config';

/**
 * Product visual. Shows the photo when one exists; otherwise renders a soft
 * "cosmetic swatch" gradient keyed to the category, with the brand set in the
 * display face -- so an image-less catalog still looks intentional.
 */
const Swatch = ({ product, className = '' }) => {
  const image = product?.images?.[0];
  if (image) {
    return (
      <img
        src={image}
        alt={product.name}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const meta = CATEGORY_META[product?.category] || CATEGORY_META.Skincare;
  return (
    <div
      aria-hidden="true"
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{ background: meta.gradient }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%)',
        }}
      />
      <span className="font-display px-3 text-center text-lg italic leading-tight text-ink/60 sm:text-xl">
        {product?.brand}
      </span>
    </div>
  );
};

export default Swatch;
