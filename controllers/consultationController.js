import Consultation from '../models/Consultation.js';
import Appointment from '../models/Appointment.js';

// @desc    Create or update a consultation
// @route   POST /api/consultations
// @access  Private/Doctor/Admin
export const createOrUpdateConsultation = async (req, res) => {
  try {
    const {
      recordKey,
      patient,
      consultation,
      medicines,
      status = 'COMPLETED'
    } = req.body;

    const pt = patient || {};
    const cons = consultation || {};

    const payload = {
      recordKey: recordKey || pt.visitId || pt.patientId || '',
      patientId: pt.patientId || '',
      patientName: pt.patientName || pt.name || 'Patient',
      age: pt.age ? Number(pt.age) : null,
      gender: pt.gender || '',
      mobile: pt.mobile || pt.phone || '',
      visitId: pt.visitId || '',
      tokenNumber: pt.tokenNumber || pt.token || '',
      appointmentId: pt.appointmentId || '',
      doctorName: pt.doctorName || 'Dr. Vinish Kumar Singh',
      department: pt.department || 'Urology',
      clinic: pt.clinic || '',
      vitals: {
        bp: cons.bp || '',
        pulse: cons.pulse || '',
        temperature: cons.temperature || '',
        spo2: cons.spo2 || '',
        weight: cons.weight || '',
        height: cons.height || ''
      },
      chiefComplaint: cons.chiefComplaint || '',
      clinicalNotes: cons.clinicalNotes || '',
      diagnosis: cons.diagnosis || '',
      investigation: cons.investigation || '',
      advice: cons.advice || '',
      followUpDate: cons.followUpDate || '',
      followUpInstructions: cons.followUpInstructions || '',
      medicines: Array.isArray(medicines)
        ? medicines.filter((m) => m && m.name && m.name.trim())
        : [],
      status: status === 'DRAFT' ? 'DRAFT' : 'COMPLETED',
      completedAt: status === 'COMPLETED' ? new Date() : null
    };

    // If an existing record exists with this recordKey, update it; otherwise create new
    let saved;
    if (payload.recordKey) {
      saved = await Consultation.findOneAndUpdate(
        { recordKey: payload.recordKey },
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      saved = await Consultation.create(payload);
    }

    // Automatically mark the linked appointment as Visited upon completing consultation
    if (payload.status === 'COMPLETED') {
      const matchConditions = [];
      const aptId = pt.appointmentId || pt.appointment?._id || pt.appointment;
      if (aptId && String(aptId).length === 24) {
        matchConditions.push({ _id: aptId });
      }
      if (pt.visitId && pt.visitId !== '—') {
        matchConditions.push({ visitId: pt.visitId });
      }
      if (payload.recordKey && payload.recordKey.startsWith('VIS-')) {
        matchConditions.push({ visitId: payload.recordKey });
      }
      if (matchConditions.length > 0) {
        await Appointment.updateMany(
          { $or: matchConditions, status: { $ne: 'Visited' } },
          { $set: { status: 'Visited' } }
        ).catch((err) => console.warn('Auto-mark appointment Visited error:', err.message));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Consultation saved successfully',
      data: saved
    });
  } catch (error) {
    console.error('Save consultation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all consultations (for Medical Records)
// @route   GET /api/consultations
// @access  Private/Doctor/Admin
export const getConsultations = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const conditions = [];

    const escapeRegex = (val) => String(val).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (search && String(search).trim()) {
      const searchRegex = new RegExp(escapeRegex(String(search).trim()), 'i');
      conditions.push({
        $or: [
          { patientName: searchRegex },
          { patientId: searchRegex },
          { diagnosis: searchRegex },
          { complaint: searchRegex },
          { phone: searchRegex }
        ]
      });
    }

    const mongoQuery = conditions.length > 0 ? { $and: conditions } : {};
    const total = await Consultation.countDocuments(mongoQuery);

    let query = Consultation.find(mongoQuery).sort({ createdAt: -1 });

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const isPaginated = !isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0;

    if (isPaginated) {
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
    }

    const consultations = await query;

    res.status(200).json({
      success: true,
      total,
      page: isPaginated ? pageNum : 1,
      totalPages: isPaginated ? Math.ceil(total / limitNum) : 1,
      limit: isPaginated ? limitNum : total,
      count: consultations.length,
      data: consultations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get consultations for a specific patient
// @route   GET /api/consultations/patient/:patientId
// @access  Private/Doctor/Admin
export const getPatientConsultations = async (req, res) => {
  try {
    const { patientId } = req.params;
    const history = await Consultation.find({
      $or: [{ patientId }, { recordKey: patientId }]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single consultation by ID
// @route   GET /api/consultations/:id
// @access  Private/Doctor/Admin
export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found'
      });
    }
    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
