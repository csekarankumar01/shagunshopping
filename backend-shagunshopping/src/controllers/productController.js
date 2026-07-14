import Product, { CATEGORIES } from '../models/Product.js';

const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/products?q=&brand=&category=&sort=&featured=&page=&limit=
export const listProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));

    const filter = { isActive: true };
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(req.query.q), 'i');
      filter.$or = [{ name: rx }, { brand: rx }];
    }
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === 'true') filter.featured = true;

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1, numReviews: -1 },
      newest: { createdAt: -1 },
    };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .select('-reviews -description')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ products, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/filters -> brands + categories for the filter UI
export const getFilters = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json({ brands: brands.sort(), categories: CATEGORIES });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
};

// POST /api/products/:id/reviews (logged in)
export const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const already = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (already) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }

    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment || '',
    });
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review added', product });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin ----------

// GET /api/products/admin/all (includes inactive, includes stock)
export const adminListProducts = async (req, res, next) => {
  try {
    const products = await Product.find({})
      .select('-reviews')
      .sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    next(err);
  }
};

// POST /api/products (admin)
export const createProduct = async (req, res, next) => {
  try {
    const { name, brand, category, description, size, ingredients, howToUse, mrp, price, stock, images, featured, isActive } =
      req.body;
    const product = await Product.create({
      name,
      brand,
      category,
      description,
      size,
      ingredients,
      howToUse,
      mrp,
      price,
      stock,
      images: (images || []).filter(Boolean),
      featured: !!featured,
      isActive: isActive !== false,
    });
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id (admin)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const fields = ['name', 'brand', 'category', 'description', 'size', 'ingredients', 'howToUse', 'mrp', 'price', 'stock', 'featured', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });
    if (req.body.images !== undefined) {
      product.images = (req.body.images || []).filter(Boolean);
    }
    await product.save();
    res.json({ product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id (admin) -- soft delete keeps order history intact
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.isActive = false;
    await product.save();
    res.json({ message: 'Product hidden from the store' });
  } catch (err) {
    next(err);
  }
};
