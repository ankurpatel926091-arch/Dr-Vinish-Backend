import mongoose from 'mongoose';
import Clinic from '../models/Clinic.js';

export const initialClinics = [
  {
    clinicId: 'morning',
    name: 'Rudraksh IVF & Urology Centre',
    tag: 'Morning OPD',
    badgeLabel: 'MORNING CONSULTATION CENTRE',
    city: 'Sharda Nagar, Lucknow',
    address: '1/795, Ratan Khand, Sharda Nagar, Lucknow, UP 226002',
    phone: '+91 89600 68307',
    timings: '10:00 AM – 03:00 PM',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800',
    mapUrl: 'https://www.google.com/maps?q=Rudraksh+IVF+And+Urology+Centre+Lucknow',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3561.428!2d80.9242723!3d26.7803631!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399bff149cec4b2d%3A0xe680ad74dd601b3b!2sDr.%20Vinish%20Singh%20%7C%20Rudraksh%20IVF%20%26%20Urology%20Centre!5e0!3m2!1sen!2sin',
    active: true
  },
  {
    clinicId: 'evening',
    name: 'Dr. Shilpi Maternity & Urology Centre',
    tag: 'Evening OPD',
    badgeLabel: 'EVENING CONSULTATION CENTRE',
    city: 'Pakkabag, Ring Road, Lucknow',
    address: '596Pb/1114/03, Ring Rd, Pakkabag, Lucknow, UP 226017',
    phone: '+91 86048 91955',
    timings: '03:00 PM – 07:00 PM',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
    mapUrl: 'https://maps.app.goo.gl/w9mqio5fe4Hj8KLm9',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3558.200!2d80.8609337!3d26.8566859!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399bff2d7be105cf%3A0x87c6db827648df8!2sDr.%20Shilpi%20Maternity%20%26%20Urology%20Centre!5e0!3m2!1sen!2sin',
    active: true
  }
];

// @desc    Get active clinics for public website
// @route   GET /api/clinics
// @access  Public
export const getPublicClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find({ active: true }).sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      count: clinics.length,
      data: clinics.length > 0 ? clinics : initialClinics
    });
  } catch (error) {
    res.status(200).json({ success: true, data: initialClinics });
  }
};

// @desc    Get all clinics for Admin panel
// @route   GET /api/admin/clinics
// @access  Private/Admin
export const getAdminClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      count: clinics.length,
      data: clinics.length > 0 ? clinics : initialClinics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create clinic location
// @route   POST /api/admin/clinics
// @access  Private/Admin
export const createClinic = async (req, res) => {
  try {
    const clinic = await Clinic.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Clinic location created successfully',
      data: clinic
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update clinic location (timing, helpline phone, address, photo, map)
// @route   PUT /api/admin/clinics/:id
// @access  Private/Admin
export const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    let clinic = null;

    // 1. Try finding by MongoDB _id if valid 24-char hex
    if (mongoose.Types.ObjectId.isValid(id)) {
      clinic = await Clinic.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    }

    // 2. Try finding by clinicId or numeric id ('1' / '2' / 'morning' / 'evening')
    if (!clinic) {
      clinic = await Clinic.findOneAndUpdate(
        {
          $or: [
            { clinicId: String(id) },
            { clinicId: String(id) === '1' ? 'morning' : String(id) === '2' ? 'evening' : String(id) }
          ]
        },
        body,
        { new: true }
      );
    }

    // 3. Try matching by clinic name in req.body
    if (!clinic && body.name) {
      if (body.name.includes('Rudraksh')) {
        clinic = await Clinic.findOneAndUpdate(
          { $or: [{ clinicId: 'morning' }, { name: { $regex: /Rudraksh/i } }] },
          body,
          { new: true }
        );
      } else if (body.name.includes('Shilpi')) {
        clinic = await Clinic.findOneAndUpdate(
          { $or: [{ clinicId: 'evening' }, { name: { $regex: /Shilpi/i } }] },
          body,
          { new: true }
        );
      }
    }

    // 4. Fallback create if not found
    if (!clinic) {
      clinic = await Clinic.create({ ...body, clinicId: String(id) });
    }

    res.status(200).json({
      success: true,
      message: 'Clinic details updated successfully',
      data: clinic
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle clinic status
// @route   PATCH /api/admin/clinics/:id/toggle
// @access  Private/Admin
export const toggleClinicStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let clinic = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      clinic = await Clinic.findById(id);
    }
    if (!clinic) {
      clinic = await Clinic.findOne({
        $or: [
          { clinicId: String(id) },
          { clinicId: String(id) === '1' ? 'morning' : String(id) === '2' ? 'evening' : String(id) }
        ]
      });
    }
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    clinic.active = !clinic.active;
    await clinic.save();

    res.status(200).json({
      success: true,
      message: `Clinic status changed to ${clinic.active ? 'Active' : 'Inactive'}`,
      data: clinic
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete clinic location
// @route   DELETE /api/admin/clinics/:id
// @access  Private/Admin
export const deleteClinic = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Clinic.findByIdAndDelete(id);
    } else {
      await Clinic.findOneAndDelete({
        $or: [
          { clinicId: String(id) },
          { clinicId: String(id) === '1' ? 'morning' : String(id) === '2' ? 'evening' : String(id) }
        ]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Clinic location deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seed initial clinics if empty
export const seedInitialClinics = async () => {
  try {
    const count = await Clinic.countDocuments();
    if (count === 0) {
      await Clinic.insertMany(initialClinics);
      console.log('Default Clinic locations seeded into MongoDB database.');
    }
  } catch (error) {
    console.error('Error seeding initial clinics:', error.message);
  }
};
