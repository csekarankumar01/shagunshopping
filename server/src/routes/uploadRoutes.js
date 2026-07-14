import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { protect, admin } from '../middleware/auth.js';

/**
 * POST /api/upload  (admin only, field name: "image")
 * Saves product photos to server/uploads/ and returns an absolute URL.
 *
 * Note for production: on hosts with ephemeral disks (Render free tier),
 * uploaded files are lost on redeploy — move to Cloudinary/S3 for permanence
 * (see README). For a VPS or persistent disk this works as-is.
 */

const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
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

const router = Router();

router.post('/', protect, admin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 3 MB' : err.message || 'Upload failed';
      return res.status(400).json({ message });
    }
    if (!req.file) return res.status(400).json({ message: 'No image file received' });
    // Absolute URL so it works when the API and storefront live on different domains
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

export default router;
