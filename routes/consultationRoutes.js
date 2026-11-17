import express from 'express';
import {
  createOrUpdateConsultation,
  getConsultations,
  getPatientConsultations,
  getConsultationById
} from '../controllers/consultationController.js';

const router = express.Router();

router.post('/', createOrUpdateConsultation);
router.get('/', getConsultations);
router.get('/patient/:patientId', getPatientConsultations);
router.get('/:id', getConsultationById);

export default router;
