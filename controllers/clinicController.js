import mongoose from 'mongoose';
import Clinic from '../models/Clinic.js';

const normalizeClinicKey = (name) => {
  const l = (name || '').trim().toLowerCase();
  if (l.includes('rudraksh')) return 'rudraksh';
  if (l.includes('shilpi')) return 'shilpi';
  return l;
};

// @desc    Get active clinics for public website
// @route   GET /api/clinics
// @access  Public
export const getPublicClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find({ active: true }).sort({ createdAt: 1 });

    const seen = new Set();
    const uniqueClinics = clinics.filter(c => {
      const key = normalizeClinicKey(c.name);
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.status(200).json({
      success: true,
      count: uniqueClinics.length,
      data: uniqueClinics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all clinics for Admin panel
// @route   GET /api/admin/clinics
// @access  Private/Admin
export const getAdminClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: 1 });

    const seen = new Set();
    const uniqueClinics = clinics.filter(c => {
      const key = normalizeClinicKey(c.name);
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.status(200).json({
      success: true,
      count: uniqueClinics.length,
      data: uniqueClinics
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
    const { name } = req.body;
    if (name) {
      const existing = await Clinic.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A clinic with this name already exists'
        });
      }
    }
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

// @desc    Update clinic location
// @route   PUT /api/admin/clinics/:id
// @access  Private/Admin
export const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    let clinic = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      clinic = await Clinic.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    }

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
