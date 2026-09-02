import express from 'express';
import {
  createAppointment,
  getConfirmedAppointments,
  notifyAppointmentEmail,
  getAdminAppointments,
  updateAppointmentStatus,
  deleteAppointment
} from '../controllers/appointmentController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes for booking appointment from website
router.post('/', createAppointment);
router.get('/public/confirmed-slots', getConfirmedAppointments);
router.post('/notify-email', notifyAppointmentEmail);

// Protected Admin routes
router.get('/admin/all', protectAdmin, getAdminAppointments);
router.patch('/admin/:id/status', protectAdmin, updateAppointmentStatus);
router.delete('/admin/:id', protectAdmin, deleteAppointment);

export default router;
