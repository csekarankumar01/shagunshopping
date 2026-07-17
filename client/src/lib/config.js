// ------- Edit this file to make the store yours -------

export const SHOP_NAME = 'ShagunShopping';
export const SHOP_TAGLINE = 'Genuine beauty, below MRP.';
export const SHOP_ESTD = 2000; // 26 successful years and counting
export const SHOP_YEARS = new Date().getFullYear() - SHOP_ESTD;

export const SHOP_CONTACT = {
  address: '1, Saraswati Vihar, Rohta Road, Meerut — 250001',
  phones: ['+91 99270 28982', '+91 87912 10021'],
  whatsapp: '919927028982', // digits only, with country code
  email: 'shagunshopping.meerut@gmail.com',
};

// The brands stocked at the counter (used for the marquee + fallback filters)
export const BRANDS = [
  'Lotus Herbals',
  'FixDERMA',
  'Pilgrim',
  'Mitvana',
  'Dot & Key',
  'Moxie',
  'Mitchell',
  'Nivok',
  'Swiss Beauty',
  'Insight',
  'Deconstruct',
  'Dr. Su',
  'Ras Luxury',
  'Oriflame',
  'Komeo Wellness',
  'Jovees',
  'Aysun Herbal',
  'Sanfe',
];

// Display-only mirror of the server rules (server/.env is the source of truth)
export const FREE_SHIPPING_ABOVE = 1499;          // COD free-shipping threshold
export const FREE_SHIPPING_ABOVE_PREPAID = 1199;  // prepaid free-shipping threshold
export const COD_FEE = 0;                          // COD fee waived — customers pay shipping only
export const COD_MAX = 2500;                       // COD unavailable above this subtotal

// Fill this in once GST registration is done — invoices then show a tax break-up.
export const SHOP_GSTIN = '';
export const SHIPPING_FEE = 49;

// Category swatches: cosmetic-texture gradients used when a product has no photo
export const CATEGORY_META = {
  Skincare: { image: '/categories/skincare.png', gradient: 'linear-gradient(135deg,#F8DFD6 0%,#EDB9A8 60%,#E4A093 100%)' },
  Haircare: { image: '/categories/haircare.png', gradient: 'linear-gradient(135deg,#EBEFE3 0%,#C7D2B2 60%,#AFBF97 100%)' },
  Makeup: { image: '/categories/makeup.png', gradient: 'linear-gradient(135deg,#F3CBDB 0%,#D68BAC 55%,#B9648C 100%)' },
  'Body Care': { image: '/categories/bodycare.png', gradient: 'linear-gradient(135deg,#F4E7D7 0%,#E0C4A2 60%,#D0AB84 100%)' },
  Fragrance: { image: '/categories/fragrance.png', gradient: 'linear-gradient(135deg,#ECE2F2 0%,#CDB6DE 60%,#B99FD1 100%)' },
  Wellness: { image: '/categories/wellness.png', gradient: 'linear-gradient(135deg,#E2EEE5 0%,#B7D2BF 60%,#9CC0A7 100%)' },
};

export const CATEGORIES = Object.keys(CATEGORY_META);
