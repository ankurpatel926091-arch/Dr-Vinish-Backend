import GalleryItem from '../models/GalleryItem.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Stream upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, mimetype, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'dr_vinish_gallery',
        resource_type: resourceType
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// @desc    Get active gallery items for public website
// @route   GET /api/gallery
// @access  Public
export const getPublicGallery = async (req, res) => {
  try {
    const items = await GalleryItem.find({ active: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all gallery items for Admin panel
// @route   GET /api/admin/gallery
// @access  Private/Admin
export const getAdminGallery = async (req, res) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create / Upload new gallery media item
// @route   POST /api/admin/gallery
// @access  Private/Admin
export const createGalleryItem = async (req, res) => {
  try {
    const { title, category, type, url, tag, active, isLocal, fileName } = req.body;

    let finalUrl = url || '';
    let publicId = '';

    // If file was uploaded via multipart/form-data
    if (req.file) {
      const mime = req.file.mimetype;
      const resourceType = mime.startsWith('video/') ? 'video' : 'image';

      // Check if Cloudinary credentials are valid
      const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key';

      if (hasCloudinary) {
        try {
          const cldResult = await uploadToCloudinary(req.file.buffer, mime, resourceType);
          finalUrl = cldResult.secure_url;
          publicId = cldResult.public_id;
        } catch (cldErr) {
          console.warn('Cloudinary upload error, falling back to disk storage:', cldErr.message);
        }
      }

      // If Cloudinary is not used or failed, save file to local uploads directory
      if (!finalUrl) {
        const ext = path.extname(req.file.originalname) || (resourceType === 'video' ? '.mp4' : '.png');
        const uniqueName = `media_${Date.now()}_${Math.round(Math.random() * 1E6)}${ext}`;
        const filePath = path.join(uploadsDir, uniqueName);

        fs.writeFileSync(filePath, req.file.buffer);

        const protocol = req.protocol || 'http';
        const host = req.get('host') || 'localhost:5000';
        finalUrl = `${protocol}://${host}/uploads/${uniqueName}`;
      }
    }

    if (!finalUrl && !req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file or provide a valid media URL' });
    }

    const newItem = await GalleryItem.create({
      title: title || (req.file ? req.file.originalname : 'Gallery Media'),
      category: category || 'Photos',
      type: type || (req.file && req.file.mimetype.startsWith('video/') ? 'video' : 'photo'),
      url: finalUrl,
      publicId,
      tag: tag || '',
      active: active === 'false' ? false : Boolean(active),
      isLocal: publicId ? false : (isLocal === 'true' || (req.file && finalUrl.includes('/uploads/'))),
      fileName: fileName || (req.file ? req.file.originalname : '')
    });

    res.status(201).json({
      success: true,
      message: 'Media uploaded and saved successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Create Gallery Item Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle active / inactive status of gallery item
// @route   PATCH /api/admin/gallery/:id/toggle
// @access  Private/Admin
export const toggleGalleryStatus = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    item.active = !item.active;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Media item status changed to ${item.active ? 'Active' : 'Inactive'}`,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete gallery item
// @route   DELETE /api/admin/gallery/:id
// @access  Private/Admin
export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    // Delete from Cloudinary if publicId exists
    if (item.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
      const resourceType = item.type === 'video' ? 'video' : 'image';
      await cloudinary.uploader.destroy(item.publicId, { resource_type: resourceType }).catch(() => {});
    }

    // Delete local disk file if stored locally in uploads
    if (item.url && item.url.includes('/uploads/')) {
      const filename = path.basename(item.url);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await GalleryItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Default sample items to seed if database is empty
export const initialSampleItems = [
  {
    title: 'Dr. Vinish Kumar Singh - Senior Urologist',
    category: 'Doctor & Care',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
    tag: 'Doctor Profile',
    active: true
  },
  {
    title: 'Advanced Endourology Laser OT Setup',
    category: 'Surgical Setup',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600',
    tag: 'Laser Tech',
    active: true
  },
  {
    title: 'State-of-the-Art Operation Theatre',
    category: 'Surgical Setup',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    tag: 'OT Suite',
    active: true
  },
  {
    title: 'Patient OPD Consultation Room',
    category: 'Clinic Facilities',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
    tag: 'Clinic OPD',
    active: true
  },
  {
    title: 'Laser RIRS Kidney Stone Procedure Demo',
    category: 'Videos',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600',
    tag: 'Laser RIRS Video',
    active: true
  },
  {
    title: 'Modern Reception & Patient Lounge',
    category: 'Clinic Facilities',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600',
    tag: 'Patient Lounge',
    active: true
  }
];

// Seed initial gallery items
export const seedGalleryItems = async () => {
  try {
    const count = await GalleryItem.countDocuments();
    if (count === 0) {
      await GalleryItem.insertMany(initialSampleItems);
      console.log('Default Gallery Items seeded into MongoDB database.');
    }
  } catch (error) {
    console.error('Error seeding gallery items:', error.message);
  }
};
