/*
  Bulk product importer — how 100+ products get on the site without 100
  admin-panel sessions.

  My workflow:
    1. Fill import-template.csv in Excel/Google Sheets (one row per product).
       Keep the header row exactly as it is. Save as CSV.
    2. Photos: make a folder  server/import-photos/<slug>/  per product and
       drop 1-4 jpg/png/webp files in it. The slug is the product name in
       lowercase with hyphens (lakme-absolute-perfect-radiance-serum) — run
       with --dry-run first and the script prints each product's slug for you.
       OR: paste image URLs in the imageUrls column ("url1|url2") and skip
       folders entirely.
    3. Preview without touching the database:
         npm run import -- --dry-run
    4. Import for real:
         npm run import
       Existing products (same slug) get UPDATED, new ones get created —
       so re-running after fixing a typo in the CSV is completely safe.
       Orders are never touched; they carry their own price snapshots.

  If CLOUDINARY_URL is set (production), folder photos upload to Cloudinary.
  Without it, they're copied into server/uploads/ (fine for local testing,
  but remember Render's disk is wiped on redeploys — use Cloudinary for real).
*/

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSV_PATH = process.argv.find((a) => a.endsWith('.csv')) || path.join(ROOT, 'import-template.csv');
const PHOTOS_DIR = path.join(ROOT, 'import-photos');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
const DRY_RUN = process.argv.includes('--dry-run');

const slugify = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const CATEGORIES = ['skincare', 'haircare', 'makeup', 'fragrance', 'bath-body', 'mens'];

const readRows = () => {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
};

const validateRow = (row, i) => {
  const problems = [];
  if (!row.name) problems.push('name is empty');
  if (!row.brand) problems.push('brand is empty');
  if (!CATEGORIES.includes(row.category)) problems.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  const mrp = Number(row.mrp), price = Number(row.price), stock = Number(row.stock);
  if (!(mrp > 0)) problems.push('mrp must be a positive number');
  if (!(price > 0)) problems.push('price must be a positive number');
  if (price > mrp) problems.push('price is ABOVE mrp — that breaks the whole below-MRP promise');
  if (!(stock >= 0)) problems.push('stock must be 0 or more');
  if (!row.description || row.description.length < 20) problems.push('description too short (write at least a sentence)');
  if (problems.length) {
    console.error(`  Row ${i + 2} (${row.name || 'no name'}): ${problems.join(' · ')}`);
    return false;
  }
  return true;
};

/** Photos for a slug: from import-photos/<slug>/, or URLs from the CSV column. */
const collectImages = async (slug, imageUrlsCell) => {
  const urls = (imageUrlsCell || '')
    .split('|')
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//.test(u));
  if (urls.length) return urls;

  const dir = path.join(PHOTOS_DIR, slug);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  if (!files.length) return [];
  if (DRY_RUN) return files.map((f) => `(would upload) ${path.join('import-photos', slug, f)}`);

  const out = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    if (process.env.CLOUDINARY_URL) {
      const { v2: cloudinary } = await import('cloudinary');
      const res = await cloudinary.uploader.upload(filePath, {
        folder: 'shagunshopping/products',
        resource_type: 'image',
      });
      out.push(res.secure_url);
    } else {
      // Local fallback: copy into uploads/ with a safe name
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      const safe = `${slug}-${out.length + 1}${path.extname(f).toLowerCase()}`;
      fs.copyFileSync(filePath, path.join(UPLOADS_DIR, safe));
      const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`;
      out.push(`${base}/uploads/${safe}`);
    }
  }
  return out;
};

const run = async () => {
  const rows = readRows();
  console.log(`\nRead ${rows.length} products from ${path.basename(CSV_PATH)}${DRY_RUN ? '  [DRY RUN — database untouched]' : ''}\n`);

  let valid = 0, invalid = 0;
  const prepared = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!validateRow(row, i)) { invalid++; continue; }
    const slug = slugify(row.name);
    const images = await collectImages(slug, row.imageUrls);
    prepared.push({
      slug,
      doc: {
        name: row.name,
        slug,
        brand: row.brand,
        category: row.category,
        mrp: Number(row.mrp),
        price: Number(row.price),
        stock: Number(row.stock),
        size: row.size || '',
        description: row.description,
        ingredients: row.ingredients || '',
        howToUse: row.howToUse || '',
        featured: String(row.featured).toLowerCase() === 'true',
        isActive: true,
        ...(images.length ? { images } : {}),
      },
      photoNote: images.length ? `${images.length} photo(s)` : 'NO PHOTOS (add folder import-photos/' + slug + '/ or imageUrls)',
    });
    valid++;
  }

  console.log(`\nValid: ${valid} · Invalid: ${invalid}\n`);
  for (const p of prepared) console.log(`  ${p.slug}  →  ${p.photoNote}`);

  if (DRY_RUN) {
    console.log('\nDry run complete. Fix anything flagged above, then run without --dry-run.');
    process.exit(invalid ? 1 : 0);
  }
  if (invalid) {
    console.error('\nFix the invalid rows first — nothing was imported.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  let created = 0, updated = 0;
  for (const p of prepared) {
    const existing = await Product.findOne({ slug: p.slug });
    if (existing) {
      // Update everything except images when no new photos were provided —
      // never wipe a live product's photos because a CSV cell was blank.
      const { images, ...rest } = p.doc;
      Object.assign(existing, rest);
      if (images) existing.images = images;
      await existing.save();
      updated++;
    } else {
      await Product.create(p.doc);
      created++;
    }
  }
  console.log(`\nDone: ${created} created, ${updated} updated. They're live on the site now.`);
  await mongoose.disconnect();
};

run().catch((e) => { console.error('Import failed:', e.message); process.exit(1); });
