import express from 'express';
import {
  getPublicGallery,
  getAdminGallery,
  createGalleryItem,
  toggleGalleryStatus,
  deleteGalleryItem
} from '../controllers/galleryController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/public', getPublicGallery);
router.get('/', getPublicGallery);

// Protected Admin routes
router.get('/admin/all', protectAdmin, getAdminGallery);
router.post('/admin/upload', protectAdmin, upload.single('file'), createGalleryItem);
router.patch('/admin/:id/toggle', protectAdmin, toggleGalleryStatus);
router.delete('/admin/:id', protectAdmin, deleteGalleryItem);

export default router;
