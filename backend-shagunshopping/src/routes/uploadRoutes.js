import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { protect, admin } from '../middleware/auth.js';

// Product photo uploads (admin only).
//
// Two modes, picked automatically at boot:
//  - CLOUDINARY_URL set   -> upload to Cloudinary (survives redeploys, CDN).
//  - CLOUDINARY_URL empty -> save to server/uploads/ (fine for local dev;
//    on Render's free tier this disk is wiped on every redeploy, which is
//    exactly why Cloudinary support exists — add the env var to switch, no
//    code change needed).
// Either way the client just gets back a URL to store on the product.

const useCloudinary = Boolean(process.env.CLOUDINARY_URL);

const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = useCloudinary
  ? multer.memoryStorage() // keep the file in RAM, stream it to Cloudinary
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        // Never trust the original filename — build a safe one from scratch
        const ext = EXT_BY_MIME[file.mimetype];
        cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    cb(new Error('Only JPG, PNG or WebP images are allowed'));
  },
});

const uploadToCloudinary = async (buffer) => {
  const { v2: cloudinary } = await import('cloudinary'); // lazy — only loaded when configured
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shagunshopping/products', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
};

const router = Router();

router.post('/', protect, admin, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 3 MB' : err.message || 'Upload failed';
      return res.status(400).json({ message });
    }
    if (!req.file) return res.status(400).json({ message: 'No image file received' });
    try {
      if (useCloudinary) {
        const url = await uploadToCloudinary(req.file.buffer);
        return res.status(201).json({ url });
      }
      // Absolute URL so it works when the API and storefront live on different domains
      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      res.status(201).json({ url });
    } catch (e) {
      console.error('Upload failed:', e.message);
      res.status(500).json({ message: 'Upload failed — try again' });
    }
  });
});

export default router;
