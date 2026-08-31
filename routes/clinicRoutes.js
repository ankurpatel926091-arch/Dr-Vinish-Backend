import express from 'express';
import {
  getPublicClinics,
  getAdminClinics,
  createClinic,
  updateClinic,
  toggleClinicStatus,
  deleteClinic
} from '../controllers/clinicController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for Frontend website
router.get('/', getPublicClinics);

// Admin routes for Admin Panel
router.get('/admin', protectAdmin, getAdminClinics);
router.post('/admin', protectAdmin, createClinic);
router.put('/admin/:id', protectAdmin, updateClinic);
router.patch('/admin/:id/toggle', protectAdmin, toggleClinicStatus);
router.delete('/admin/:id', protectAdmin, deleteClinic);

export default router;
