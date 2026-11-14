import express from 'express';
import {
  getTodayQueue,
  addToQueue,
  updateQueueStatus,
  callNextPatient,
  deleteQueueItem
} from '../controllers/queueController.js';

const router = express.Router();

router.get('/today', getTodayQueue);
router.post('/add', addToQueue);
router.patch('/:id/status', updateQueueStatus);
router.post('/call-next', callNextPatient);
router.delete('/:id', deleteQueueItem);

export default router;

