import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 1337;
const DATA_DIR = path.join(__dirname, '.tmp');
const DB_FILE = path.join(DATA_DIR, 'cms_data.json');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default CMS dataset
const DEFAULT_DATA = {
  adminUsers: [
    {
      id: 1,
      email: 'admin@shagunshopping.com',
      passwordHash: crypto.createHash('sha256').update('Admin@12345').digest('hex'),
      name: 'Karan Kumar',
      role: 'Super Admin',
      createdAt: new Date().toISOString(),
    },
  ],
  sessions: {},
  banners: [
    {
      id: 1,
      title: 'Festive Glow Collection',
      subtitle: 'Pure Ayurvedic botanicals curated for radiant skin',
      badge: 'NEW ARRIVALS',
      link: '/shop?category=Skincare',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop&q=80',
      isActive: true,
      displayOrder: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Luxury Haircare Elixirs',
      subtitle: 'Nourish from root to tip with cold-pressed natural oils',
      badge: 'FLAT 20% OFF',
      link: '/shop?category=Haircare',
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=1600&auto=format&fit=crop&q=80',
      isActive: true,
      displayOrder: 2,
      createdAt: new Date().toISOString(),
    },
  ],
  articles: [
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
      createdAt: new Date().toISOString(),
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
      content: "Known as 'Shiro Abhyanga', traditional hair oiling is much more than deep conditioning—it is a therapy that relaxes the nervous system and promotes cellular nourishment to hair follicles.\n\nKey Botanicals:\n• Bhringraj: Revered in Ayurveda as 'the king of hair' for arresting premature greying and hair thinning.\n• Cold-Pressed Rosemary Oil: Clinically shown to rival minoxidil for stimulating micro-circulation and root density.\n• Sweet Almond & Amla: Packed with natural Vitamin E and tannins that smooth frizz and seal hair cuticles.\n\nRitual: Warm 2-3 tablespoons of oil. Massage scalp with circular fingertips for 10 minutes. Leave on for 45 minutes before rinsing with a sulphate-free cleanser.",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'The Festive Glow Guide: Pre-Party Skin Prep in 30 Minutes',
      slug: 'festive-glow-skin-prep',
      summary: 'Quick exfoliation and Kumkumadi facial oil pressing techniques to unlock all-night radiant skin.',
      category: 'Wellness',
      readingTimeMinutes: 3,
      author: 'Kavita Mehta, Beauty Editor',
      coverImageUrl: 'https://images.unsplash.com/photo-1512290900672-1f41d9c253be?w=800&auto=format&fit=crop&q=80',
      categoryLink: '/shop?category=Skincare',
      content: "When you have 30 minutes before a wedding or festive celebration, follow this express skin awakening ritual:\n\n1. 5-Minute Mild Enzyme Polish: Buff away dead skin cells to create an ultra-smooth canvas for makeup.\n2. Ice Roller Awakening: Glide chilled stainless steel over cheekbones and jawline to drain fluid and reduce puffiness.\n3. Kumkumadi Glow Drops: Press 3 drops of pure saffron oil onto high points of cheekbones.\n4. Hyaluronic Plump Cream: Lock in dewy glass-skin bounce that stays luminous all night long.",
      createdAt: new Date().toISOString(),
    },
  ],
};

const loadData = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (!data.adminUsers || data.adminUsers.length === 0) data.adminUsers = DEFAULT_DATA.adminUsers;
      if (!data.sessions) data.sessions = {};
      if (!data.banners) data.banners = DEFAULT_DATA.banners;
      if (!data.articles) data.articles = DEFAULT_DATA.articles;
      return data;
    }
  } catch (err) {
    console.error('[CMS] Error reading DB file:', err.message);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
  return DEFAULT_DATA;
};

const saveData = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[CMS] Error saving DB file:', err.message);
  }
};

let db = loadData();

// Helper to parse cookies
const parseCookies = (req) => {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
};

// Helper to check admin session
const getActiveAdmin = (req) => {
  const cookies = parseCookies(req);
  const token = cookies.strapi_session;
  if (!token || !db.sessions[token]) return null;
  const session = db.sessions[token];
  if (Date.now() > session.expires) {
    delete db.sessions[token];
    saveData(db);
    return null;
  }
  return db.adminUsers.find((u) => u.id === session.userId) || null;
};

// Render Clean, Secure Login Page (No prefilled passwords or credentials shown)
const renderLoginPage = (errorMsg = '') => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Strapi — Administrator Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
  <!-- Ambient background glow -->
  <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none"></div>

  <div class="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-purple-500/40">
        S
      </div>
      <h1 class="text-2xl font-black text-white tracking-tight">Welcome back!</h1>
      <p class="text-xs text-slate-400 mt-1.5">Sign in to your Strapi CMS administrator account</p>
    </div>

    ${
      errorMsg
        ? `<div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <svg class="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ${errorMsg}
          </div>`
        : ''
    }

    <!-- Login Form -->
    <form method="POST" action="/admin/login" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
        <input 
          type="email" 
          name="email" 
          required 
          autocomplete="email"
          placeholder="name@example.com" 
          class="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition placeholder:text-slate-500"
        />
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
        </div>
        <div class="relative">
          <input 
            type="password" 
            id="password-field"
            name="password" 
            required 
            autocomplete="current-password"
            placeholder="••••••••" 
            class="w-full px-4 py-3 pr-11 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition placeholder:text-slate-500"
          />
          <button 
            type="button" 
            onclick="togglePasswordVisibility()" 
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1"
            title="Toggle password view"
          >
            <svg id="eye-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </div>
      </div>

      <div class="pt-3">
        <button 
          type="submit" 
          class="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition duration-200 shadow-lg shadow-purple-600/30 cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </form>
  </div>

  <script>
    function togglePasswordVisibility() {
      const field = document.getElementById('password-field');
      const icon = document.getElementById('eye-icon');
      if (field.type === 'password') {
        field.type = 'text';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>';
      } else {
        field.type = 'password';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
      }
    }
  </script>
</body>
</html>`;
};

// Render Authenticated Admin Dashboard with full Tab Switching & CRUD
const renderAdminDashboard = (admin) => {
  const bannerRows = db.banners
    .map(
      (b) => `
      <tr class="border-b border-gray-100 hover:bg-purple-50/40 transition">
        <td class="p-4">
          <div class="flex items-center gap-3">
            <img src="${b.imageUrl}" class="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" onerror="this.src='https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200';" />
            <div>
              <p class="font-bold text-gray-900 text-sm">${b.title}</p>
              <p class="text-xs text-gray-500 line-clamp-1">${b.subtitle || '—'}</p>
            </div>
          </div>
        </td>
        <td class="p-4"><span class="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">${b.badge || 'PROMO'}</span></td>
        <td class="p-4 text-xs font-mono text-gray-500">${b.link}</td>
        <td class="p-4">
          <form method="POST" action="/admin/banners/toggle" class="inline">
            <input type="hidden" name="id" value="${b.id}" />
            <button type="submit" class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full cursor-pointer transition ${b.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}">
              <span class="w-1.5 h-1.5 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
              ${b.isActive ? 'Live on Store' : 'Draft / Paused'}
            </button>
          </form>
        </td>
        <td class="p-4 text-right">
          <form method="POST" action="/admin/banners/delete" class="inline" onsubmit="return confirm('Remove this banner from the storefront?');">
            <input type="hidden" name="id" value="${b.id}" />
            <button type="submit" class="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer">Delete</button>
          </form>
        </td>
      </tr>`
    )
    .join('');

  const articleRows = db.articles
    .map(
      (a) => `
      <tr class="border-b border-gray-100 hover:bg-purple-50/40 transition">
        <td class="p-4">
          <div class="flex items-center gap-3">
            <img src="${a.coverImageUrl}" class="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" onerror="this.src='https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200';" />
            <div>
              <p class="font-bold text-gray-900 text-sm">${a.title}</p>
              <p class="text-xs text-gray-500 line-clamp-1">${a.summary}</p>
            </div>
          </div>
        </td>
        <td class="p-4"><span class="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">${a.category}</span></td>
        <td class="p-4 text-xs font-medium text-gray-600">${a.author}</td>
        <td class="p-4 text-xs text-gray-500 font-mono">${a.readingTimeMinutes} min</td>
        <td class="p-4 text-right">
          <form method="POST" action="/admin/articles/delete" class="inline" onsubmit="return confirm('Delete this article?');">
            <input type="hidden" name="id" value="${a.id}" />
            <button type="submit" class="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer">Delete</button>
          </form>
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ShagunShopping — Strapi Headless CMS Admin</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex">
  <!-- Sidebar -->
  <aside class="w-72 bg-slate-900 text-white flex flex-col justify-between p-6 shrink-0">
    <div>
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-purple-500/30">
          S
        </div>
        <div>
          <h1 class="font-bold text-base tracking-tight leading-tight">Strapi CMS</h1>
          <p class="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Shagun Headless</p>
        </div>
      </div>
      
      <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Content Types</p>
      <nav class="space-y-1.5">
        <button 
          type="button" 
          onclick="switchTab('banners')" 
          id="tab-btn-banners" 
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm transition shadow-lg shadow-purple-600/30 cursor-pointer"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="truncate whitespace-nowrap">Hero Banners</span>
          </div>
          <span id="badge-banners" class="ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-purple-500/40 text-purple-100 shrink-0">${db.banners.length}</span>
        </button>
        <button 
          type="button" 
          onclick="switchTab('articles')" 
          id="tab-btn-articles" 
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium text-sm transition cursor-pointer"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
            <span class="truncate whitespace-nowrap">Editorial Articles</span>
          </div>
          <span id="badge-articles" class="ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-slate-800 text-slate-400 shrink-0">${db.articles.length}</span>
        </button>
      </nav>
    </div>

    <!-- User Profile & Logout -->
    <div class="pt-6 border-t border-slate-800">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs font-bold text-white">${admin.name}</p>
          <p class="text-[11px] text-purple-400 font-mono">${admin.role}</p>
        </div>
        <a href="/admin/logout" class="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition" title="Log out">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </a>
      </div>
      <div class="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        REST API Active (1337)
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 p-8 sm:p-10 overflow-y-auto">
    <header class="flex items-center justify-between pb-8 border-b border-slate-200">
      <div>
        <h2 id="header-title" class="text-2xl font-bold text-slate-900">Promotional Drops & Hero Banners</h2>
        <p id="header-desc" class="text-sm text-slate-500">Add or toggle promotional marketing hero drops that update the storefront live.</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="http://localhost:5173" target="_blank" class="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition shadow-sm flex items-center gap-2">
          Open Storefront (5173) ↗
        </a>
        <a id="inspect-api-btn" href="/api/banners" target="_blank" class="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm">
          Inspect /api/banners JSON ↗
        </a>
      </div>
    </header>

    <!-- TAB 1: BANNERS VIEW -->
    <div id="view-banners" class="space-y-8">
      <!-- Create Banner Form -->
      <div class="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Publish New Promotional Banner
        </h3>
        <form method="POST" action="/admin/banners/create" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Banner Title</label>
              <input type="text" name="title" required placeholder="Diwali Special Drop" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Subtitle / Offer</label>
              <input type="text" name="subtitle" placeholder="Flat 25% Off Luxury Fragrances" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Badge Text</label>
              <input type="text" name="badge" placeholder="LIMITED EDITION" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Target Link</label>
              <input type="text" name="link" value="/shop?category=Fragrance" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
            <input type="url" name="imageUrl" required value="https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&auto=format&fit=crop&q=80" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
          </div>
          <div class="flex items-center justify-end pt-2 border-t border-slate-100">
            <button type="submit" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              Publish Banner
            </button>
          </div>
        </form>
      </div>

      <!-- Banners Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th class="p-4">Drop Info</th>
              <th class="p-4">Badge</th>
              <th class="p-4">Target Link</th>
              <th class="p-4">Visibility</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bannerRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: ARTICLES VIEW (Hidden by default, activated on click) -->
    <div id="view-articles" class="space-y-8 hidden">
      <!-- Create Article Form -->
      <div class="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Publish New Beauty & Skincare Article
        </h3>
        <form method="POST" action="/admin/articles/create" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-600 mb-1">Article Title</label>
              <input type="text" name="title" required placeholder="10 Ayurvedic Skincare Secrets for Festive Season" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select name="category" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white">
                <option value="Skincare">Skincare</option>
                <option value="Haircare">Haircare</option>
                <option value="Makeup">Makeup</option>
                <option value="Ayurveda">Ayurveda</option>
                <option value="Wellness">Wellness</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Article Summary / Excerpt</label>
            <textarea name="summary" required rows="2" placeholder="Discover how cold-pressed Kumkumadi and rose water transform dull skin..." class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Author Name</label>
              <input type="text" name="author" value="Shagun Editorial Team" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Estimated Reading Time (mins)</label>
              <input type="number" name="readingTimeMinutes" value="4" min="1" max="60" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Cover Image URL</label>
              <input type="url" name="coverImageUrl" required value="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500" />
            </div>
          </div>
          <div class="flex items-center justify-end pt-2 border-t border-slate-100">
            <button type="submit" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              + Publish Article
            </button>
          </div>
        </form>
      </div>

      <!-- Articles Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th class="p-4">Article</th>
              <th class="p-4">Category</th>
              <th class="p-4">Author</th>
              <th class="p-4">Reading Time</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${articleRows}
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- Interactive Tab Switching Script -->
  <script>
    function updateTabButton(btnId, badgeId, isActive) {
      const btn = document.getElementById(btnId);
      const badge = document.getElementById(badgeId);
      if (!btn || !badge) return;

      if (isActive) {
        btn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm transition shadow-lg shadow-purple-600/30 cursor-pointer';
        badge.className = 'ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-purple-500/40 text-purple-100 shrink-0';
      } else {
        btn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium text-sm transition cursor-pointer';
        badge.className = 'ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-slate-800 text-slate-400 shrink-0';
      }
    }

    function switchTab(tab) {
      const viewBanners = document.getElementById('view-banners');
      const viewArticles = document.getElementById('view-articles');
      const headerTitle = document.getElementById('header-title');
      const headerDesc = document.getElementById('header-desc');
      const inspectBtn = document.getElementById('inspect-api-btn');

      if (tab === 'articles') {
        viewBanners.classList.add('hidden');
        viewArticles.classList.remove('hidden');

        updateTabButton('tab-btn-articles', 'badge-articles', true);
        updateTabButton('tab-btn-banners', 'badge-banners', false);

        headerTitle.textContent = 'Beauty & Skincare Editorial Articles';
        headerDesc.textContent = 'Publish and manage beauty guides and skincare routines served via Strapi REST API.';

        if (inspectBtn) {
          inspectBtn.href = '/api/articles';
          inspectBtn.textContent = 'Inspect /api/articles JSON ↗';
        }
        if (history.replaceState) {
          history.replaceState(null, '', '#articles');
        } else {
          window.location.hash = 'articles';
        }
      } else {
        viewArticles.classList.add('hidden');
        viewBanners.classList.remove('hidden');

        updateTabButton('tab-btn-banners', 'badge-banners', true);
        updateTabButton('tab-btn-articles', 'badge-articles', false);

        headerTitle.textContent = 'Promotional Drops & Hero Banners';
        headerDesc.textContent = 'Add or toggle promotional marketing hero drops that update the storefront live.';

        if (inspectBtn) {
          inspectBtn.href = '/api/banners';
          inspectBtn.textContent = 'Inspect /api/banners JSON ↗';
        }
        if (history.replaceState) {
          history.replaceState(null, '', '#banners');
        } else {
          window.location.hash = 'banners';
        }
      }
    }

    // Auto-select tab based on URL hash
    window.addEventListener('DOMContentLoaded', () => {
      if (window.location.hash === '#articles') {
        switchTab('articles');
      } else {
        switchTab('banners');
      }
    });
  </script>
</body>
</html>`;
};

// Helper to parse POST urlencoded bodies
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const result = {};
      for (const [key, val] of params.entries()) {
        result[key] = val;
      }
      resolve(result);
    });
  });
};

// Create the HTTP server
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Login Page GET
  if (pathname === '/admin/login' && req.method === 'GET') {
    const admin = getActiveAdmin(req);
    if (admin) {
      res.writeHead(302, { Location: '/admin' });
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderLoginPage());
    return;
  }

  // Login POST
  if (pathname === '/admin/login' && req.method === 'POST') {
    const { email, password } = await parseBody(req);
    const passwordHash = crypto.createHash('sha256').update(password || '').digest('hex');

    const admin = db.adminUsers.find(
      (u) => u.email.toLowerCase() === (email || '').toLowerCase() && u.passwordHash === passwordHash
    );

    if (admin) {
      const token = crypto.randomUUID();
      db.sessions[token] = {
        userId: admin.id,
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };
      saveData(db);

      res.writeHead(302, {
        'Set-Cookie': `strapi_session=${token}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=604800`,
        Location: '/admin',
      });
      res.end();
      return;
    }

    res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderLoginPage('Invalid email or password. Please try again.'));
    return;
  }

  // Logout GET
  if (pathname === '/admin/logout') {
    const cookies = parseCookies(req);
    const token = cookies.strapi_session;
    if (token) {
      delete db.sessions[token];
      saveData(db);
    }
    res.writeHead(302, {
      'Set-Cookie': `strapi_session=; Path=/admin; HttpOnly; Max-Age=0`,
      Location: '/admin/login',
    });
    res.end();
    return;
  }

  // Admin Dashboard routes (Protected)
  if (pathname === '/' || pathname === '/admin' || pathname.startsWith('/admin/')) {
    const admin = getActiveAdmin(req);
    if (!admin) {
      res.writeHead(302, { Location: '/admin/login' });
      res.end();
      return;
    }

    // Action: Create Banner POST
    if (pathname === '/admin/banners/create' && req.method === 'POST') {
      const data = await parseBody(req);
      if (data.title && data.imageUrl) {
        const newBanner = {
          id: Date.now(),
          title: data.title,
          subtitle: data.subtitle || '',
          badge: data.badge || 'PROMO',
          link: data.link || '/shop',
          imageUrl: data.imageUrl,
          isActive: true,
          displayOrder: db.banners.length + 1,
          createdAt: new Date().toISOString(),
        };
        db.banners.unshift(newBanner);
        saveData(db);
      }
      res.writeHead(302, { Location: '/admin#banners' });
      res.end();
      return;
    }

    // Action: Toggle Banner Visibility POST
    if (pathname === '/admin/banners/toggle' && req.method === 'POST') {
      const data = await parseBody(req);
      const banner = db.banners.find((b) => String(b.id) === String(data.id));
      if (banner) {
        banner.isActive = !banner.isActive;
        saveData(db);
      }
      res.writeHead(302, { Location: '/admin#banners' });
      res.end();
      return;
    }

    // Action: Delete Banner POST
    if (pathname === '/admin/banners/delete' && req.method === 'POST') {
      const data = await parseBody(req);
      db.banners = db.banners.filter((b) => String(b.id) !== String(data.id));
      saveData(db);
      res.writeHead(302, { Location: '/admin#banners' });
      res.end();
      return;
    }

    // Action: Create Article POST
    if (pathname === '/admin/articles/create' && req.method === 'POST') {
      const data = await parseBody(req);
      if (data.title && data.summary) {
        const newArticle = {
          id: Date.now(),
          title: data.title,
          slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          summary: data.summary,
          category: data.category || 'Skincare',
          readingTimeMinutes: Number(data.readingTimeMinutes) || 4,
          author: data.author || 'Shagun Editorial Team',
          coverImageUrl: data.coverImageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
        };
        db.articles.unshift(newArticle);
        saveData(db);
      }
      res.writeHead(302, { Location: '/admin#articles' });
      res.end();
      return;
    }

    // Action: Delete Article POST
    if (pathname === '/admin/articles/delete' && req.method === 'POST') {
      const data = await parseBody(req);
      db.articles = db.articles.filter((a) => String(a.id) !== String(data.id));
      saveData(db);
      res.writeHead(302, { Location: '/admin#articles' });
      res.end();
      return;
    }

    // Render Admin
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderAdminDashboard(admin));
    return;
  }

  // REST API: /api/banners (Strapi format)
  if (pathname === '/api/banners') {
    const responsePayload = {
      data: db.banners
        .filter((b) => b.isActive)
        .map((b) => ({
          id: b.id,
          attributes: {
            title: b.title,
            subtitle: b.subtitle,
            badge: b.badge,
            link: b.link,
            imageUrl: b.imageUrl,
            isActive: b.isActive,
            displayOrder: b.displayOrder,
            createdAt: b.createdAt,
            updatedAt: b.createdAt,
          },
        })),
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          pageCount: 1,
          total: db.banners.filter((b) => b.isActive).length,
        },
      },
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(responsePayload));
    return;
  }

  // REST API: /api/articles (Strapi format)
  if (pathname === '/api/articles') {
    const responsePayload = {
      data: db.articles.map((a) => ({
        id: a.id,
        attributes: {
          title: a.title,
          slug: a.slug,
          summary: a.summary,
          category: a.category,
          readingTimeMinutes: a.readingTimeMinutes,
          author: a.author,
          coverImageUrl: a.coverImageUrl,
          categoryLink: a.categoryLink || '/shop?category=Skincare',
          content: a.content || a.summary,
          createdAt: a.createdAt,
          updatedAt: a.createdAt,
        },
      })),
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          pageCount: 1,
          total: db.articles.length,
        },
      },
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(responsePayload));
    return;
  }

  // Health probe
  if (pathname === '/_health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'shagunshopping-cms' }));
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Strapi Headless CMS] Running at http://localhost:${PORT}`);
  console.log(`[Strapi Headless CMS] Admin Login: http://localhost:${PORT}/admin/login`);
  console.log(`[Strapi Headless CMS] REST API: http://localhost:${PORT}/api/banners`);
});
