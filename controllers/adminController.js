import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Appointment from '../models/Appointment.js';
import Bill from '../models/Bill.js';
import cloudinary from '../config/cloudinary.js';

// Helper: Generate JWT Token
const generateToken = (id, role) => {
  const normalizedRole = (role === 'Administrator' || role === 'admin') ? 'admin' : 'doctor';
  return jwt.sign(
    { id, role: normalizedRole },
    process.env.JWT_SECRET || 'dr_vinish_admin_jwt_secret_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '3d' }
  );
};

// @desc    Register New Admin
// @route   POST /api/admin/register
// @access  Public (or Protected if restricted)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Account with this email already exists'
      });
    }

    const assignedRole = (role && (role.toLowerCase() === 'doctor' || role === 'doctor')) ? 'doctor' : 'admin';

    // Create new admin
    const admin = await Admin.create({
      name,
      email: email.toLowerCase().trim(),
      password, // Password hashed automatically by Admin model pre-save hook
      role: assignedRole
    });

    if (admin) {
      const token = generateToken(admin._id, admin.role);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Register Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (admin && (await admin.matchPassword(password))) {
      const normalizedRole = (admin.role === 'Administrator' || admin.role === 'admin') ? 'admin' : 'doctor';
      if (admin.role !== normalizedRole) {
        admin.role = normalizedRole;
        await admin.save();
      }

      const token = generateToken(admin._id, normalizedRole);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: normalizedRole,
          createdAt: admin.createdAt
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get Current Admin Profile
// @route   GET /api/admin/me
// @access  Private (Protected by protectAdmin)
export const getMe = async (req, res) => {
  try {
    const admin = req.admin;
    const normalizedRole = (admin.role === 'Administrator' || admin.role === 'admin') ? 'admin' : 'doctor';
    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: normalizedRole,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
};

// @desc    Admin Logout
// @route   POST /api/admin/logout
// @access  Private (Protected)
export const logoutAdmin = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Upload Media File to Cloudinary
// @route   POST /api/admin/upload
// @access  Private (Protected)
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudinary) {
      return res.status(500).json({ success: false, message: 'Cloudinary configuration is missing' });
    }

    const mime = req.file.mimetype;
    const resourceType = mime.startsWith('video/') ? 'video' : 'image';

    const cldResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dr_vinish_uploads',
          resource_type: resourceType
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    return res.status(200).json({
      success: true,
      message: 'Media uploaded successfully to Cloudinary',
      url: cldResult.secure_url,
      publicId: cldResult.public_id,
      isCloudinary: true
    });
  } catch (error) {
    console.error('Media Upload Error:', error.message);
    return res.status(500).json({ success: false, message: `Cloudinary upload failed: ${error.message}` });
  }
};

// @desc    Get all unique real patients from database (Appointments & Bills)
// @route   GET /api/admin/patients
// @access  Private (Admin & Doctor)
export const getAllPatients = async (req, res) => {
  try {
    const apts = await Appointment.find({}).sort({ createdAt: -1 });
    const bills = await Bill.find({}).sort({ createdAt: -1 });

    const patientMap = new Map();

    // 1. Process from Appointments
    for (const a of apts) {
      const rawName = a.name ? a.name.trim() : 'Patient';
      const cleanPhone = a.phone ? String(a.phone).replace(/\D/g, '').slice(-10) : '';
      const normName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = cleanPhone ? `${normName}_${cleanPhone}` : normName;
      if (!key) continue;

      const nameParts = rawName.split(' ');
      const firstName = nameParts[0] || rawName;
      const lastName = nameParts.slice(1).join(' ') || '';
      const regDate = a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '2026-11-19';

      const uhid = a.visitId
        ? `UHID-${a.visitId.replace(/\D/g, '')}`
        : (cleanPhone && cleanPhone.length === 10 ? `UHID-${cleanPhone.slice(-5)}` : `UHID-${String(a._id).slice(-5).toUpperCase()}`);

      const visitToken = a.visitId || (a.date ? `${a.date}_${a.time || ''}` : String(a._id));

      if (!patientMap.has(key)) {
        const vSet = new Set();
        vSet.add(visitToken);

        patientMap.set(key, {
          id: String(a._id),
          uhid,
          firstName,
          lastName,
          name: rawName,
          age: Number(a.age) || 35,
          gender: a.gender || 'Male',
          mobile: a.phone || '',
          email: a.email || '',
          address: a.message && a.message.length > 5 ? a.message : 'Lucknow, Uttar Pradesh',
          emergencyContact: a.phone || '',
          status: 'Active',
          registeredOn: regDate,
          visitId: a.visitId || '',
          _visitsSet: vSet,
          latestVisitDate: a.date || regDate,
          latestProblem: a.problem || 'General Urology Consultation',
          source: 'Appointment'
        });
      } else {
        const item = patientMap.get(key);
        item._visitsSet.add(visitToken);
        if (a.email && !item.email) item.email = a.email;
        if (a.visitId && !item.visitId) item.visitId = a.visitId;
      }
    }

    // 2. Process from Bills
    for (const b of bills) {
      const rawName = b.patientName ? b.patientName.trim() : 'Patient';
      const cleanPhone = b.phone ? String(b.phone).replace(/\D/g, '').slice(-10) : '';
      const normName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = cleanPhone ? `${normName}_${cleanPhone}` : normName;
      if (!key) continue;

      const nameParts = rawName.split(' ');
      const firstName = nameParts[0] || rawName;
      const lastName = nameParts.slice(1).join(' ') || '';
      const regDate = b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : '2026-11-19';

      const uhid = b.patientId && b.patientId.startsWith('UHID-')
        ? b.patientId
        : (b.visitId ? `UHID-${b.visitId.replace(/\D/g, '')}` : (cleanPhone ? `UHID-${cleanPhone.slice(-5)}` : `UHID-${String(b._id).slice(-5).toUpperCase()}`));

      const visitToken = b.visitId || (b.visitDate ? b.visitDate : b.billId || String(b._id));

      if (!patientMap.has(key)) {
        const vSet = new Set();
        vSet.add(visitToken);

        patientMap.set(key, {
          id: String(b._id),
          uhid,
          firstName,
          lastName,
          name: rawName,
          age: Number(b.age) || 35,
          gender: b.gender || 'Male',
          mobile: b.phone || '',
          email: '',
          address: 'Lucknow, Uttar Pradesh',
          emergencyContact: b.phone || '',
          status: 'Active',
          registeredOn: regDate,
          visitId: b.visitId || '',
          _visitsSet: vSet,
          latestVisitDate: b.visitDate || regDate,
          latestProblem: b.diagnosis || 'OPD Consultation',
          source: 'Billing'
        });
      } else {
        const item = patientMap.get(key);
        item._visitsSet.add(visitToken);
        if (b.patientId && b.patientId.startsWith('UHID-')) item.uhid = b.patientId;
        if (b.phone && !item.mobile) item.mobile = b.phone;
        if (b.visitId && !item.visitId) item.visitId = b.visitId;
      }
    }

    let patientsList = Array.from(patientMap.values()).map((p) => {
      const { _visitsSet, ...cleanPatient } = p;
      return {
        ...cleanPatient,
        totalVisits: _visitsSet ? _visitsSet.size : 1
      };
    }).sort((a, b) => {
      return new Date(b.registeredOn).getTime() - new Date(a.registeredOn).getTime();
    });

    const { search, gender, page, limit } = req.query;

    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      patientsList = patientsList.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.uhid && p.uhid.toLowerCase().includes(q)) ||
        (p.mobile && p.mobile.includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.latestProblem && p.latestProblem.toLowerCase().includes(q))
      );
    }

    if (gender && String(gender).trim().toLowerCase() !== 'all') {
      const g = String(gender).trim().toLowerCase();
      patientsList = patientsList.filter(p => (p.gender || '').toLowerCase() === g);
    }

    const total = patientsList.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const isPaginated = !isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0;

    let pagedData = patientsList;
    if (isPaginated) {
      const skip = (pageNum - 1) * limitNum;
      pagedData = patientsList.slice(skip, skip + limitNum);
    }

    return res.status(200).json({
      success: true,
      total,
      page: isPaginated ? pageNum : 1,
      totalPages: isPaginated ? Math.ceil(total / limitNum) : 1,
      limit: isPaginated ? limitNum : total,
      count: pagedData.length,
      data: pagedData
    });
  } catch (error) {
    console.error('Get All Patients Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving patients list'
    });
  }
};

// @desc    Register a new permanent patient
// @route   POST /api/admin/patients
// @access  Private
export const registerNewPatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      name,
      mobile,
      email,
      age,
      gender,
      address,
      emergencyContact,
      problem,
      clinic
    } = req.body;

    const patientFullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    if (!patientFullName) {
      return res.status(400).json({ success: false, message: 'Patient name is required' });
    }

    if (!mobile || !String(mobile).trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    const countApt = await Appointment.countDocuments();
    const nextVisitNumber = 5000 + countApt + 1;
    const visitId = `VIS-${nextVisitNumber}`;
    const uhid = `UHID-${cleanMobile.slice(-5) || Math.floor(10000 + Math.random() * 90000)}`;

    const Clinic = (await import('../models/Clinic.js')).default;
    const defaultClinic = clinic || (await Clinic.findOne({}))?._id;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newApt = await Appointment.create({
      name: patientFullName,
      phone: mobile.trim(),
      email: email ? email.trim() : '',
      age: Number(age) || 35,
      gender: gender || 'Male',
      clinic: defaultClinic,
      problem: problem || 'General Urology Consultation',
      date: formattedDate,
      time: '11:00 AM',
      message: address ? address.trim() : '',
      status: 'Confirmed',
      visitId
    });

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        id: String(newApt._id),
        uhid,
        firstName: firstName || patientFullName.split(' ')[0],
        lastName: lastName || patientFullName.split(' ').slice(1).join(' '),
        name: patientFullName,
        mobile: newApt.phone,
        email: newApt.email,
        age: newApt.age,
        gender: newApt.gender,
        address: address || 'Lucknow, Uttar Pradesh',
        emergencyContact: emergencyContact || newApt.phone,
        status: 'Active',
        registeredOn: now.toISOString().split('T')[0],
        visitId: newApt.visitId,
        totalVisits: 1
      }
    });
  } catch (error) {
    console.error('Register Patient Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error registering patient: ' + error.message
    });
  }
};

