import Consultation from '../models/Consultation.js';

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
    const consultations = await Consultation.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
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
