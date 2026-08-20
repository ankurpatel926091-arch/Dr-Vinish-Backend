import express from 'express';
import {
  getPublicBlogs,
  getBlogBySlugOrId,
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus
} from '../controllers/blogController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/public', getPublicBlogs);
router.get('/detail/:slugOrId', getBlogBySlugOrId);

// Admin routes (Protected by protectAdmin)
router.get('/admin/all', protectAdmin, getAdminBlogs);
router.post('/admin', protectAdmin, createBlog);
router.put('/admin/:id', protectAdmin, updateBlog);
router.delete('/admin/:id', protectAdmin, deleteBlog);
router.patch('/admin/:id/status', protectAdmin, toggleBlogStatus);

// Generic REST routes fallback
router.get('/', getPublicBlogs);
router.get('/:slugOrId', getBlogBySlugOrId);
router.post('/', protectAdmin, createBlog);
router.put('/:id', protectAdmin, updateBlog);
router.delete('/:id', protectAdmin, deleteBlog);

export default router;
