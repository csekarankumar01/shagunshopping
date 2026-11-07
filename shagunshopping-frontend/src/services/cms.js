import axios from 'axios';

const CMS_URL = import.meta.env.VITE_CMS_URL || 'http://localhost:1337';

// Default static fallback banners if Strapi CMS is unreachable or cold
export const DEFAULT_BANNERS = [
  {
    id: 1,
    title: 'Festive Glow Collection',
    subtitle: 'Pure Ayurvedic botanicals curated for radiant skin',
    badge: 'NEW ARRIVALS',
    link: '/shop?category=Skincare',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 2,
    title: 'Luxury Haircare Elixirs',
    subtitle: 'Nourish from root to tip with cold-pressed natural oils',
    badge: 'BESTSELLERS',
    link: '/shop?category=Haircare',
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=1600&auto=format&fit=crop&q=80',
    isActive: true,
  },
];

export const DEFAULT_ARTICLES = [
  {
    id: 1,
    title: 'The 5-Step Morning Skincare Ritual for Indian Weather',
    slug: 'morning-skincare-ritual',
    summary: 'How to protect against humidity and UV damage while maintaining natural hydration.',
    category: 'Skincare',
    readingTimeMinutes: 4,
    author: 'Shagun Editorial Team',
    coverImageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
  },
];

/**
 * Fetches promotional hero banners from Strapi Headless CMS.
 * Gracefully returns curated fallbacks if the CMS is offline.
 */
export const getPromotionalBanners = async () => {
  try {
    const res = await axios.get(`${CMS_URL}/api/banners?filters[isActive][$eq]=true&sort=displayOrder:asc`, {
      timeout: 3000,
    });
    const items = res.data?.data || [];
    if (!items.length) return DEFAULT_BANNERS;

    return items.map((item) => ({
      id: item.id,
      title: item.attributes?.title || item.title,
      subtitle: item.attributes?.subtitle || item.subtitle,
      badge: item.attributes?.badge || item.badge,
      link: item.attributes?.link || item.link || '/shop',
      imageUrl: item.attributes?.imageUrl || item.imageUrl,
      isActive: true,
    }));
  } catch {
    // CMS is optional: return fallbacks with zero user impact
    return DEFAULT_BANNERS;
  }
};

/**
 * Fetches beauty and skincare editorial articles from Strapi CMS.
 */
export const getEditorialArticles = async () => {
  try {
    const res = await axios.get(`${CMS_URL}/api/articles?sort=createdAt:desc`, {
      timeout: 3000,
    });
    const items = res.data?.data || [];
    if (!items.length) return DEFAULT_ARTICLES;

    return items.map((item) => ({
      id: item.id,
      title: item.attributes?.title || item.title,
      slug: item.attributes?.slug || item.slug,
      summary: item.attributes?.summary || item.summary,
      category: item.attributes?.category || item.category,
      readingTimeMinutes: item.attributes?.readingTimeMinutes || item.readingTimeMinutes || 3,
      author: item.attributes?.author || item.author || 'Shagun Editorial',
      coverImageUrl: item.attributes?.coverImageUrl || item.coverImageUrl,
    }));
  } catch {
    return DEFAULT_ARTICLES;
  }
};

