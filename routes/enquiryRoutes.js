import express from 'express';
import {
  createEnquiry,
  getAdminEnquiries,
  updateEnquiryStatus,
  deleteEnquiry
} from '../controllers/enquiryController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for frontend contact form submission
router.post('/', createEnquiry);

// Protected Admin routes
router.get('/admin/all', protectAdmin, getAdminEnquiries);
router.patch('/admin/:id/status', protectAdmin, updateEnquiryStatus);
router.delete('/admin/:id', protectAdmin, deleteEnquiry);

export default router;
