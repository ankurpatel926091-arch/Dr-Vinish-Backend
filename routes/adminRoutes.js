import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  getMe,
  logoutAdmin,
  uploadMedia,
  getAllPatients,
  registerNewPatient
} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected routes
router.get('/me', protectAdmin, getMe);
router.post('/logout', protectAdmin, logoutAdmin);
router.post('/upload', protectAdmin, upload.single('file'), uploadMedia);
router.get('/patients', protectAdmin, getAllPatients);
router.post('/patients', protectAdmin, registerNewPatient);

export default router;
