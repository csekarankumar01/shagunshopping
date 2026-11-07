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
    summary: 'How to protect against humidity and UV damage while maintaining natural hydration all day.',
    category: 'Skincare',
    readingTimeMinutes: 4,
    author: 'Shagun Editorial Team',
    coverImageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
    categoryLink: '/shop?category=Skincare',
    content: "Indian weather presents unique challenges for skincare: intense UV indices, tropical humidity, and urban pollution. Follow this 5-step morning protocol recommended by our in-house dermatologists:\n\n1. Gentle Sulphate-Free Cleanser: Wash away overnight sebum without stripping natural ceramides.\n2. Hydrating Rose & Botanical Mist: Replenish essential moisture and prep skin for serums.\n3. 10% Vitamin C + Ferulic Acid Serum: Shields against oxidation, pollution, and brightens pigmentation.\n4. Oil-Free Gel Moisturiser: Lock in hydration with hyaluronic acid and cica without feeling sticky.\n5. Broad-Spectrum SPF 50+ PA++++: Non-negotiable sun protection that prevents tanning and premature ageing.",
  },
  {
    id: 2,
    title: 'Ayurvedic Hair Oiling: The Ancient Secret for Strong Roots',
    slug: 'ayurvedic-hair-oiling-secrets',
    summary: 'Why weekly scalp massage with cold-pressed rosemary and bhringraj stimulates thicker, glossier hair.',
    category: 'Haircare',
    readingTimeMinutes: 5,
    author: 'Dr. Ananya Sharma, Ayurvedic Expert',
    coverImageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
    categoryLink: '/shop?category=Haircare',
    content: "Known as Shiro Abhyanga, traditional hair oiling is much more than deep conditioning—it is a therapy that relaxes the nervous system and promotes cellular nourishment to hair follicles.\n\nKey Botanicals:\n• Bhringraj: Revered in Ayurveda as the king of hair for arresting premature greying and hair thinning.\n• Cold-Pressed Rosemary Oil: Clinically shown to rival minoxidil for stimulating micro-circulation and root density.\n• Sweet Almond & Amla: Packed with natural Vitamin E and tannins that smooth frizz and seal hair cuticles.\n\nRitual: Warm 2-3 tablespoons of oil. Massage scalp with circular fingertips for 10 minutes. Leave on for 45 minutes before rinsing with a sulphate-free cleanser.",
  },
  {
    id: 3,
    title: 'The Festive Glow Guide: Pre-Party Skin Prep in 30 Minutes',
    slug: 'festive-glow-skin-prep',
    summary: 'Quick exfoliation and Kumkumadi facial oil pressing techniques to unlock all-night radiant skin.',
    category: 'Wellness',
    readingTimeMinutes: 3,
    author: 'Kavita Mehta, Beauty Editor',
    coverImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    categoryLink: '/shop?category=Skincare',
    content: "When you have 30 minutes before a wedding or festive celebration, follow this express skin awakening ritual:\n\n1. 5-Minute Mild Enzyme Polish: Buff away dead skin cells to create an ultra-smooth canvas for makeup.\n2. Ice Roller Awakening: Glide chilled stainless steel over cheekbones and jawline to drain fluid and reduce puffiness.\n3. Kumkumadi Glow Drops: Press 3 drops of pure saffron oil onto high points of cheekbones.\n4. Hyaluronic Plump Cream: Lock in dewy glass-skin bounce that stays luminous all night long.",
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
      author: item.attributes?.author || item.author || 'Shagun Editorial Team',
      coverImageUrl: item.attributes?.coverImageUrl || item.coverImageUrl,
      categoryLink: item.attributes?.categoryLink || item.categoryLink || '/shop?category=Skincare',
      content: item.attributes?.content || item.content || item.attributes?.summary || item.summary,
    }));
  } catch {
    return DEFAULT_ARTICLES;
  }
};

