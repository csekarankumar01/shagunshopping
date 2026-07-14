import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import CATALOG from './catalog.js';

/**
 * Seeds the admin account and the full 18-brand catalog (see catalog.js).
 * Each product ships with in-depth details (description, ingredients,
 * how to use) and professional product artwork in client/public/products/.
 * Replace any image by pasting a photo URL in the admin panel.
 */
const products = CATALOG.map(({ slug, form, hue, ...p }) => ({
  ...p,
  images: [`/products/${slug}.svg`],
}));

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding...');

  // Admin account (idempotent)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Shop Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
      emailVerified: true, // admin logs in without the OTP step
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  // Products: wipe and re-insert the catalog (users and orders are kept)
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Inserted ${products.length} products across 18 brands.`);

  await mongoose.disconnect();
  console.log('Done. Log in as the admin to manage the catalog.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
