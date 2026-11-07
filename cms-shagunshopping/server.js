import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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
      summary: 'How to protect against humidity and UV damage while maintaining natural hydration.',
      category: 'Skincare',
      readingTimeMinutes: 4,
      author: 'Shagun Editorial Team',
      coverImageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
  ],
};

const loadData = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
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

// Build Admin Dashboard HTML
const renderAdminDashboard = () => {
  const bannerRows = db.banners
    .map(
      (b) => `
      <tr class="border-b border-gray-100 hover:bg-purple-50/40 transition">
        <td class="p-4 font-semibold text-gray-800">${b.title}</td>
        <td class="p-4"><span class="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">${b.badge || 'PROMO'}</span></td>
        <td class="p-4 text-sm text-gray-600">${b.subtitle || '—'}</td>
        <td class="p-4 text-xs font-mono text-gray-500">${b.link}</td>
        <td class="p-4">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}">
            <span class="w-1.5 h-1.5 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-gray-400'}"></span>
            ${b.isActive ? 'Published' : 'Draft'}
          </span>
        </td>
      </tr>`
    )
    .join('');

  const articleRows = db.articles
    .map(
      (a) => `
      <tr class="border-b border-gray-100 hover:bg-purple-50/40 transition">
        <td class="p-4 font-semibold text-gray-800">${a.title}</td>
        <td class="p-4 text-xs font-bold text-purple-600 uppercase">${a.category}</td>
        <td class="p-4 text-sm text-gray-600">${a.summary}</td>
        <td class="p-4 text-xs text-gray-500">${a.readingTimeMinutes} min read</td>
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
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex">
  <!-- Sidebar -->
  <aside class="w-64 bg-slate-900 text-white flex flex-col justify-between p-6">
    <div>
      <div class="flex items-center gap-3 mb-8">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-purple-500/30">
          S
        </div>
        <div>
          <h1 class="font-bold text-base tracking-tight leading-tight">Strapi CMS</h1>
          <p class="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Shagun Headless</p>
        </div>
      </div>
      
      <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Content Manager</p>
      <nav class="space-y-1">
        <a href="#banners" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-600 text-white font-medium text-sm transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Hero Banners (${db.banners.length})
        </a>
        <a href="#articles" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 font-medium text-sm transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
          Editorial Articles (${db.articles.length})
        </a>
      </nav>
    </div>
    <div class="pt-6 border-t border-slate-800 text-xs text-slate-400">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-semibold text-emerald-400">REST API Ready</span>
      </div>
      Port: 1337 • Status: Live
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 p-10 overflow-y-auto">
    <header class="flex items-center justify-between pb-8 border-b border-slate-200">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Content Manager</h2>
        <p class="text-sm text-slate-500">Manage promotional drops and editorial articles served to the Shagun storefront.</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="/api/banners" target="_blank" class="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm">
          Inspect /api/banners JSON ↗
        </a>
      </div>
    </header>

    <!-- Banners Section -->
    <section id="banners" class="mt-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Promotional Hero Banners</h3>
          <p class="text-xs text-slate-500">Live banners rendered on the storefront homepage.</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th class="p-4">Title</th>
              <th class="p-4">Badge</th>
              <th class="p-4">Subtitle</th>
              <th class="p-4">Target Link</th>
              <th class="p-4">State</th>
            </tr>
          </thead>
          <tbody>
            ${bannerRows}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Articles Section -->
    <section id="articles" class="mt-12">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Beauty & Skincare Editorial</h3>
          <p class="text-xs text-slate-500">Curated beauty routines and articles.</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th class="p-4">Title</th>
              <th class="p-4">Category</th>
              <th class="p-4">Summary</th>
              <th class="p-4">Reading Time</th>
            </tr>
          </thead>
          <tbody>
            ${articleRows}
          </tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>`;
};

// Create the HTTP server
const server = http.createServer((req, res) => {
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

  // Root or Admin Dashboard
  if (pathname === '/' || pathname === '/admin' || pathname.startsWith('/admin/')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderAdminDashboard());
    return;
  }

  // REST API: /api/banners (Strapi format)
  if (pathname === '/api/banners') {
    const responsePayload = {
      data: db.banners.map((b) => ({
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
          total: db.banners.length,
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
  console.log(`[Strapi Headless CMS] Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`[Strapi Headless CMS] REST API: http://localhost:${PORT}/api/banners`);
});

