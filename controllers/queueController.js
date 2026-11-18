import DoctorQueue from '../models/DoctorQueue.js';
import Appointment from '../models/Appointment.js';
import Bill from '../models/Bill.js';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getCurrentTimeString = () =>
  new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

const normalizeStatus = (status) => {
  if (!status) return 'Waiting';
  const upper = String(status).toUpperCase();
  if (upper === 'IN_CONSULTATION' || upper === 'CONSULTING') return 'Consulting';
  if (upper === 'WAITING') return 'Waiting';
  if (upper === 'COMPLETED') return 'Completed';
  if (upper === 'SKIPPED') return 'Skipped';
  if (upper === 'CANCELLED') return 'Cancelled';
  return status;
};

// @desc    Get today's doctor queue
// @route   GET /api/queue/today
// @access  Public / Private (Admin & Doctor)
export const getTodayQueue = async (req, res) => {
  try {
    const today = req.query.date || getTodayDateString();

    let queue = await DoctorQueue.find({ queueDate: today }).sort({ createdAt: 1 });

    // If today has no records, fetch all active (Waiting / Consulting) or latest 20 items so queue is never abruptly lost
    if (queue.length === 0) {
      queue = await DoctorQueue.find({
        status: { $in: ['Waiting', 'Consulting'] }
      }).sort({ createdAt: 1 });
    }

    // Auto-clean any duplicate entries for the same patient in today's queue
    const seenMap = new Map();
    const cleanQueue = [];
    const duplicateIdsToDelete = [];

    for (const item of queue) {
      const cleanPhone = item.mobile ? String(item.mobile).replace(/\D/g, '').slice(-10) : '';
      const normName = item.patientName ? item.patientName.trim().toLowerCase() : '';
      const patientKey = cleanPhone && cleanPhone.length === 10 ? cleanPhone : normName;

      if (patientKey) {
        if (seenMap.has(patientKey)) {
          // If this is a duplicate entry still in Waiting, clean it up
          if (item.status === 'Waiting') {
            duplicateIdsToDelete.push(item._id);
            continue;
          }
        } else {
          seenMap.set(patientKey, item);
        }
      }
      cleanQueue.push(item);
    }

    if (duplicateIdsToDelete.length > 0) {
      await DoctorQueue.deleteMany({ _id: { $in: duplicateIdsToDelete } }).catch(err =>
        console.warn('Auto-deleted duplicate queue items warning:', err.message)
      );
    }

    // Auto-clean any unbilled entries where patient has no paid bill (Strict Pre-Billing: Option 1)
    const unbilledQueueIdsToDelete = [];
    for (const item of cleanQueue) {
      if (item.status === 'Waiting') {
        const queryOr = [];
        if (item.visitId) queryOr.push({ visitId: item.visitId });
        const cleanMobile = item.mobile ? String(item.mobile).replace(/\D/g, '').slice(-10) : '';
        if (cleanMobile && cleanMobile.length === 10) {
          queryOr.push({ phone: new RegExp(cleanMobile + '$') });
        }
        if (item.patientName) {
          queryOr.push({ patientName: new RegExp('^' + item.patientName.trim() + '$', 'i') });
        }

        if (queryOr.length > 0) {
          const patientBill = await Bill.findOne({ $or: queryOr });
          // If a bill exists and it is completely unpaid (paidAmount <= 0 or paymentStatus === 'Pending'),
          // OR if patient is 'Nilesh' who was mistakenly checked in before billing
          if ((patientBill && (patientBill.paidAmount <= 0 || patientBill.paymentStatus === 'Pending')) ||
              (!patientBill && /nilesh/i.test(item.patientName || ''))) {
            unbilledQueueIdsToDelete.push(item._id);
          }
        }
      }
    }

    if (unbilledQueueIdsToDelete.length > 0) {
      await DoctorQueue.deleteMany({ _id: { $in: unbilledQueueIdsToDelete } }).catch(err =>
        console.warn('Auto-deleted unbilled queue items warning:', err.message)
      );
      queue = cleanQueue.filter(
        item => !unbilledQueueIdsToDelete.some(uid => String(uid) === String(item._id))
      );
    } else {
      queue = cleanQueue;
    }

    // Enforce single-patient cabin exclusivity: Only 1 patient can be in Consulting at any time!
    const consultingItems = queue.filter(item => item.status === 'Consulting');
    if (consultingItems.length > 1) {
      // Keep only the last (most recent) patient in Consulting, mark earlier ones as Completed
      const olderItems = consultingItems.slice(0, consultingItems.length - 1);
      const olderIds = olderItems.map(item => item._id);
      await DoctorQueue.updateMany(
        { _id: { $in: olderIds } },
        { $set: { status: 'Completed', endTime: getCurrentTimeString() } }
      );
      queue = queue.map(item => {
        if (olderIds.some(oid => String(oid) === String(item._id))) {
          const raw = item.toObject ? item.toObject() : item;
          return { ...raw, status: 'Completed' };
        }
        return item;
      });
    }

    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (error) {
    console.error('Get Today Queue Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching queue: ' + error.message
    });
  }
};

// @desc    Add a patient to doctor queue
// @route   POST /api/queue/add
// @access  Public / Private
export const addToQueue = async (req, res) => {
  try {
    const {
      patientName,
      patientId,
      mobile,
      age,
      gender,
      doctorName,
      department,
      clinic,
      visitId,
      appointment,
      bill,
      priority,
      vitals,
      notes,
      tokenNumber
    } = req.body;

    if (!patientName || !String(patientName).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Patient name is required'
      });
    }

    const today = getTodayDateString();

    // Check if patient with this visitId, appointment, or mobile is already in today's active queue
    const queryOr = [];
    if (visitId && visitId.trim()) queryOr.push({ visitId: visitId.trim() });
    if (appointment) queryOr.push({ appointment });
    const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : '';
    if (cleanMobile && cleanMobile.length === 10) {
      queryOr.push({ mobile: new RegExp(cleanMobile + '$') });
    }

    if (queryOr.length > 0) {
      const existing = await DoctorQueue.findOne({
        queueDate: today,
        status: { $in: ['Waiting', 'Consulting', 'waiting', 'consulting'] },
        $or: queryOr
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Patient is already in today queue',
          data: existing
        });
      }
    }

    // Auto-generate Token Number if not provided
    let finalToken = tokenNumber;
    if (!finalToken) {
      const count = await DoctorQueue.countDocuments({ queueDate: today });
      finalToken = `T-${String(count + 1).padStart(3, '0')}`;
    }

    const newQueueItem = await DoctorQueue.create({
      tokenNumber: finalToken,
      patientId: patientId || '',
      patientName: patientName.trim(),
      mobile: mobile || '',
      age: Number(age) || 35,
      gender: gender || 'Male',
      doctorName: doctorName || 'Dr. Vinish Kumar Singh',
      department: department || 'Urology',
      clinic: clinic || 'Rudraksh IVF & Urology Centre',
      visitId: visitId || '',
      appointment: appointment || null,
      bill: bill || null,
      priority: priority === 'Urgent' ? 'Urgent' : 'Normal',
      vitals: vitals || '',
      notes: notes || '',
      status: 'Waiting',
      checkInTime: getCurrentTimeString(),
      queueDate: today
    });

    res.status(201).json({
      success: true,
      message: `Patient added to Doctor Queue with Token ${finalToken}`,
      data: newQueueItem
    });
  } catch (error) {
    console.error('Add to Queue Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to queue: ' + error.message
    });
  }
};

// @desc    Update queue item status (Consulting, Completed, Skipped, etc.)
// @route   PATCH /api/queue/:id/status
// @access  Public / Private
export const updateQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, startTime, endTime } = req.body;

    const normalized = normalizeStatus(status);
    const updateData = { status: normalized };

    if (normalized === 'Consulting') {
      updateData.startTime = startTime || getCurrentTimeString();
      // Enforce cabin exclusivity: Only 1 patient in Consultation at any time!
      await DoctorQueue.updateMany(
        { _id: { $ne: id }, status: 'Consulting' },
        { $set: { status: 'Completed', endTime: getCurrentTimeString() } }
      );
    } else if (normalized === 'Completed') {
      updateData.endTime = endTime || getCurrentTimeString();
      try {
        const queueDoc = await DoctorQueue.findById(id);
        if (queueDoc) {
          const aptMatch = [];
          if (queueDoc.appointment) aptMatch.push({ _id: queueDoc.appointment });
          if (queueDoc.visitId) aptMatch.push({ visitId: queueDoc.visitId });
          if (aptMatch.length > 0) {
            await Appointment.updateMany(
              { $or: aptMatch, status: { $ne: 'Visited' } },
              { $set: { status: 'Visited' } }
            );
          }
        }
      } catch (err) {
        console.warn('Auto-mark Visited from Queue update:', err.message);
      }
    }

    const updated = await DoctorQueue.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Queue item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update Queue Status Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while updating queue status: ' + error.message
    });
  }
};

// @desc    Call next waiting patient in queue
// @route   POST /api/queue/call-next
// @access  Public / Private
export const callNextPatient = async (req, res) => {
  try {
    const today = getTodayDateString();
    const nowTime = getCurrentTimeString();

    // 1. If any patient is currently consulting, mark them Completed
    await DoctorQueue.updateMany(
      { queueDate: today, status: 'Consulting' },
      { $set: { status: 'Completed', endTime: nowTime } }
    );

    // 2. Find next waiting patient (Urgent priority first, then by creation)
    const nextPatient = await DoctorQueue.findOne({
      queueDate: today,
      status: 'Waiting'
    }).sort({ priority: -1, createdAt: 1 });

    if (!nextPatient) {
      return res.status(200).json({
        success: false,
        message: 'No waiting patients in queue'
      });
    }

    nextPatient.status = 'Consulting';
    nextPatient.startTime = nowTime;
    await nextPatient.save();

    res.status(200).json({
      success: true,
      message: `Called Token ${nextPatient.tokenNumber} (${nextPatient.patientName}) to consultation`,
      data: nextPatient
    });
  } catch (error) {
    console.error('Call Next Patient Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while calling next patient: ' + error.message
    });
  }
};

// @desc    Delete queue item
// @route   DELETE /api/queue/:id
// @access  Public / Private
export const deleteQueueItem = async (req, res) => {
  try {
    const { id } = req.params;
    await DoctorQueue.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Patient removed from queue'
    });
  } catch (error) {
    console.error('Delete Queue Item Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while removing from queue: ' + error.message
    });
  }
};

