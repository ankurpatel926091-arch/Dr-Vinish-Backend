import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import cloudinary from '../config/cloudinary.js';

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'dr_vinish_admin_jwt_secret_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
        message: 'Admin with this email already exists'
      });
    }

    // Create new admin
    const admin = await Admin.create({
      name,
      email: email.toLowerCase().trim(),
      password, // Password hashed automatically by Admin model pre-save hook
      role: role || 'Administrator'
    });

    if (admin) {
      const token = generateToken(admin._id);
      return res.status(201).json({
        success: true,
        message: 'Admin account created successfully',
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
        message: 'Invalid admin data'
      });
    }
  } catch (error) {
    console.error('Register Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin registration'
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
      const token = generateToken(admin._id);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
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
    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
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

// @desc    Upload Media File to Cloudinary (with local fallback)
// @route   POST /api/admin/upload
// @access  Private (Protected)
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const mime = req.file.mimetype;
    const resourceType = mime.startsWith('video/') ? 'video' : 'image';
    let finalUrl = '';
    let publicId = '';

    const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY;

    if (hasCloudinary) {
      try {
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
        finalUrl = cldResult.secure_url;
        publicId = cldResult.public_id;
      } catch (cldErr) {
        console.warn('Cloudinary upload warning, falling back to disk:', cldErr.message);
      }
    }

    if (!finalUrl) {
      const pathModule = await import('path');
      const fsModule = await import('fs');
      const uploadsFolder = pathModule.join(process.cwd(), 'uploads');
      if (!fsModule.existsSync(uploadsFolder)) {
        fsModule.mkdirSync(uploadsFolder, { recursive: true });
      }

      const ext = pathModule.extname(req.file.originalname) || (resourceType === 'video' ? '.mp4' : '.png');
      const uniqueName = `media_${Date.now()}_${Math.round(Math.random() * 1E6)}${ext}`;
      const filePath = pathModule.join(uploadsFolder, uniqueName);

      fsModule.writeFileSync(filePath, req.file.buffer);

      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      finalUrl = `${protocol}://${host}/uploads/${uniqueName}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Media uploaded successfully',
      url: finalUrl,
      publicId,
      isCloudinary: Boolean(publicId)
    });
  } catch (error) {
    console.error('Media Upload Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

