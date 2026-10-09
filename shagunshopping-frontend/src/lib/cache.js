/**
 * Client-Side SWR (Stale-While-Revalidate) Cache Engine
 * Loads products and catalog instantly in a fraction of a second (< 10ms)
 * and silently updates in the background.
 */
import api from './api';

// In-memory cache for 0ms lookups during active session
const memoryCache = new Map();

// LocalStorage prefix
const CACHE_PREFIX = 'ss_cache_';
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Curated live initial snapshot so first-time visitors see products instantly
export const INITIAL_FEATURED_PRODUCTS = [
  {
    _id: '6a5c7e9868f4cc25efa12b4a',
    name: 'Mon Chéri Cherry-Collagen Whipped Clay Mask',
    brand: 'Foxtale',
    category: 'Skincare',
    size: '75 g',
    mrp: 649,
    price: 551,
    stock: 12,
    images: ['https://cdn.shopify.com/s/files/1/0609/6096/4855/files/WEBSITE-36.jpg?v=1783514892&width=2048&quality=60'],
    featured: true,
    isActive: true,
    rating: 0,
    numReviews: 0,
  },
  {
    _id: '6a5c7e9868f4cc25efa12b3e',
    name: 'Vitamin C Brightening Serum',
    brand: 'Foxtale',
    category: 'Skincare',
    size: '30 ml',
    mrp: 645,
    price: 528,
    stock: 13,
    images: ['https://m.media-amazon.com/images/I/61p2yS0hIhL._SL1000_.jpg'],
    featured: true,
    isActive: true,
    rating: 0,
    numReviews: 0,
  },
  {
    _id: '6a5c7e9768f4cc25efa12b26',
    name: 'Niacinamide Clarifying Serum',
    brand: 'Foxtale',
    category: 'Skincare',
    size: '30 ml',
    mrp: 645,
    price: 484,
    stock: 15,
    images: ['https://m.media-amazon.com/images/I/51MNnYD5d-L._SL1080_.jpg'],
    featured: true,
    isActive: true,
    rating: 0,
    numReviews: 0,
  },
  {
    _id: '6a5c7e9768f4cc25efa12b0b',
    name: 'The Light House Collagen-PDRN Cell Renewal Serum',
    brand: 'Foxtale',
    category: 'Skincare',
    size: '30 ml',
    mrp: 695,
    price: 600,
    stock: 14,
    images: ['https://m.media-amazon.com/images/I/51+hc43YYHL.jpg'],
    featured: true,
    isActive: true,
    rating: 0,
    numReviews: 0,
  },
  {
    _id: '6a5a083956b381d78b1a38ae',
    name: 'HydroRepair Hair Mask (Large Pack) - 200 ml',
    brand: 'Moxie',
    category: 'Haircare',
    size: '200 ml',
    mrp: 825,
    price: 779,
    stock: 10,
    images: ['https://res.cloudinary.com/rvsvsflb/image/upload/v1784287559/shagunshopping/products/vealixu0h19iy0pvqxkv.jpg'],
    featured: true,
    isActive: true,
    rating: 0,
    numReviews: 0,
  },
  {
    _id: '6a5a080456b381d78b1a38a9',
    name: 'Deep Dive Hair Mask - 100 ml',
    brand: 'Moxie',
    category: 'Haircare',
    size: '100 ml',
    mrp: 550,
    price: 449,
    stock: 10,
    images: ['https://res.cloudinary.com/rvsvsflb/image/upload/v1784287396/shagunshopping/products/p0al53ajk9dsuqfbfgag.jpg'],
    featured: true,
    isActive: true,
    rating: 0,
    numReviews: 0,
  },
  {
    _id: '6a5a070156b381d78b1a389b',
    name: 'Super Defining Curl Cream (Tub) - 500 ml',
    brand: 'Moxie',
    category: 'Haircare',
    size: '500 ml',
    mrp: 2495,
    price: 2195,
    stock: 10,
    images: ['https://res.cloudinary.com/rvsvsflb/image/upload/v1784289259/shagunshopping/products/az9ta8wujisleey10vpv.webp'],
    featured: true,
    isActive: true,
    rating: 0,
    numReviews: 0,
  },
  {
    _id: '6a5a064556b381d78b1a388c',
    name: 'Ultra Hydrating Conditioner (Tub) - 500 ml',
    brand: 'Moxie',
    category: 'Haircare',
    size: '500 ml',
    mrp: 1895,
    price: 1495,
    stock: 10,
    images: ['https://res.cloudinary.com/rvsvsflb/image/upload/v1784289635/shagunshopping/products/nhp2b6lzinygaqkft8j5.webp'],
    featured: true,
    isActive: true,
    rating: 0,
    numReviews: 0,
  },
];

/**
 * Builds a unique cache key from endpoint and query params
 */
export const buildCacheKey = (endpoint, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${endpoint}${sortedParams ? `?${sortedParams}` : ''}`;
};

/**
 * Synchronous get from memory or localStorage. Returns null if not found or expired.
 */
export const getCachedData = (key) => {
  if (memoryCache.has(key)) {
    const memEntry = memoryCache.get(key);
    if (Date.now() < memEntry.expiresAt) {
      return memEntry.value;
    }
    memoryCache.delete(key);
  }

  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() < entry.expiresAt) {
      // Warm up memory cache
      memoryCache.set(key, entry);
      return entry.value;
    }
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch {
    // ignore json/storage errors
  }

  return null;
};

/**
 * Store data into memory and localStorage with a TTL
 */
export const setCachedData = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  const entry = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
  memoryCache.set(key, entry);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Storage quota might be reached; memoryCache still holds it
  }
};

/**
 * Cache single product details by ID so clicking a product opens instantly
 */
export const cacheSingleProduct = (product) => {
  if (!product || (!product._id && !product.id)) return;
  const id = product._id || product.id;
  setCachedData(`product:${id}`, product, DEFAULT_TTL_MS);
};

export const getCachedSingleProduct = (id) => {
  return getCachedData(`product:${id}`);
};

/**
 * Stale-While-Revalidate fetcher:
 * 1. Calls onData immediately if cached data exists (0ms response).
 * 2. Fetches fresh data in the background and calls onData again if updated.
 */
export const fetchSWR = async (endpoint, params = {}, { onData, ttlMs = DEFAULT_TTL_MS } = {}) => {
  const key = buildCacheKey(endpoint, params);
  const cached = getCachedData(key);

  if (cached && onData) {
    onData(cached, true); // true = isCached
  }

  try {
    const { data } = await api.get(endpoint, { params });
    setCachedData(key, data, ttlMs);
    if (onData) {
      onData(data, false); // false = fresh network data
    }
    return data;
  } catch (err) {
    if (!cached) {
      throw err;
    }
    return cached;
  }
};
