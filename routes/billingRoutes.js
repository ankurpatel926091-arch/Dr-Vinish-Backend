import express from 'express';
import {
  getAllBills,
  createBill,
  updateBill,
  deleteBill
} from '../controllers/billingController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin/all', protectAdmin, getAllBills);
router.post('/admin', protectAdmin, createBill);
router.put('/admin/:id', protectAdmin, updateBill);
router.delete('/admin/:id', protectAdmin, deleteBill);

export default router;

