import express from 'express';
import { registerAdmin, loginAdmin, getMe, logoutAdmin } from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected routes
router.get('/me', protectAdmin, getMe);
router.post('/logout', protectAdmin, logoutAdmin);

export default router;
