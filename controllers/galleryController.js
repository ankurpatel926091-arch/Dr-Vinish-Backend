import GalleryItem from '../models/GalleryItem.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

// Stream upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, resourceType = 'auto') => {
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

// Check if Cloudinary credentials exist in environment
const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// @desc    Get active gallery items for public website
// @route   GET /api/gallery
// @access  Public
export const getPublicGallery = async (req, res) => {
  try {
    const categories = [
      'All',
      'Photos',
      'Videos',
      'Surgical Setup',
      'Doctor & Care',
      'Clinic Facilities'
    ];
    const { category = 'All' } = req.query;

    if (typeof category !== 'string' || !categories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery category'
      });
    }

    const itemMatch = category === 'All'
      ? {}
      : category === 'Photos'
        ? { $or: [{ type: 'photo' }, { category: 'Photos' }] }
        : category === 'Videos'
          ? { $or: [{ type: 'video' }, { category: 'Videos' }] }
          : { category };

    const [result] = await GalleryItem.aggregate([
      { $match: { active: true } },
      {
        $facet: {
          data: [
            ...(Object.keys(itemMatch).length ? [{ $match: itemMatch }] : []),
            { $sort: { createdAt: -1 } }
          ],
          categoryGroups: [
            {
              $group: {
                _id: { category: '$category', type: '$type' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const categoryCounts = Object.fromEntries(
      categories.map((name) => [name, 0])
    );

    for (const group of result.categoryGroups) {
      const { category: itemCategory, type } = group._id || {};
      categoryCounts.All += group.count;

      if (type === 'photo' || itemCategory === 'Photos') {
        categoryCounts.Photos += group.count;
      }
      if (type === 'video' || itemCategory === 'Videos') {
        categoryCounts.Videos += group.count;
      }
      if (
        categories.includes(itemCategory) &&
        !['All', 'Photos', 'Videos'].includes(itemCategory)
      ) {
        categoryCounts[itemCategory] += group.count;
      }
    }

    res.status(200).json({
      success: true,
      count: result.data.length,
      categoryCounts,
      data: result.data
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
    const { title, category, type, url, tag, active, fileName } = req.body;

    let finalUrl = url || '';
    let publicId = '';

    // If file was uploaded via multipart/form-data
    if (req.file) {
      // Check if Cloudinary credentials are missing
      if (!isCloudinaryConfigured()) {
        console.error('Gallery Upload Error: Cloudinary configuration is missing in environment variables.');
        return res.status(500).json({
          success: false,
          message: 'Cloudinary configuration is missing'
        });
      }

      const mime = req.file.mimetype;
      const resourceType = mime.startsWith('video/') ? 'video' : 'image';

      // Cloudinary-only upload flow (no local disk fallback)
      try {
        const cldResult = await uploadToCloudinary(req.file.buffer, resourceType);
        finalUrl = cldResult.secure_url;
        publicId = cldResult.public_id;
      } catch (cldErr) {
        console.error('Detailed Cloudinary Upload Failure:', cldErr);
        return res.status(500).json({
          success: false,
          message: `Cloudinary upload failed: ${cldErr.message || 'Upload stream error'}`
        });
      }
    }

    if (!finalUrl && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file or provide a valid media URL'
      });
    }

    const detectedType = type || (req.file && req.file.mimetype.startsWith('video/') ? 'video' : 'photo');

    const newItem = await GalleryItem.create({
      title: title || (req.file ? req.file.originalname : 'Gallery Media'),
      category: category || 'Photos',
      type: detectedType,
      url: finalUrl,
      publicId,
      tag: tag || '',
      active: active === 'false' ? false : Boolean(active),
      isLocal: false,
      fileName: fileName || (req.file ? req.file.originalname : '')
    });

    res.status(201).json({
      success: true,
      message: 'Media uploaded and saved to Cloudinary successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Create Gallery Item Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update gallery media details and optionally replace its file
// @route   PUT /api/gallery/admin/:id
// @access  Private/Admin
export const updateGalleryItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid gallery item ID' });
    }

    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    const categories = ['Photos', 'Videos', 'Surgical Setup', 'Doctor & Care', 'Clinic Facilities'];
    const { title, category, type, url, tag, active } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!categories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid gallery category' });
    }
    if (!['photo', 'video'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid media type' });
    }
    if (active !== 'true' && active !== 'false' && typeof active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid gallery status' });
    }

    const previousPublicId = item.publicId;
    const previousType = item.type;
    const previousUrl = item.url;

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          message: 'Cloudinary configuration is missing'
        });
      }

      const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const uploaded = await uploadToCloudinary(req.file.buffer, resourceType);
      item.url = uploaded.secure_url;
      item.publicId = uploaded.public_id;
      item.fileName = req.file.originalname;
      item.isLocal = false;
    } else if (typeof url === 'string') {
      if (!url.trim()) {
        return res.status(400).json({ success: false, message: 'Media URL cannot be empty' });
      }
      if (url.trim() !== previousUrl) {
        item.url = url.trim();
        item.publicId = '';
        item.fileName = '';
        item.isLocal = false;
      }
    }

    item.title = title.trim();
    item.category = category;
    item.type = type;
    item.tag = typeof tag === 'string' ? tag.trim() : item.tag;
    item.active = active === true || active === 'true';
    await item.save();

    if (previousPublicId && previousPublicId !== item.publicId && isCloudinaryConfigured()) {
      try {
        await cloudinary.uploader.destroy(previousPublicId, {
          resource_type: previousType === 'video' ? 'video' : 'image'
        });
      } catch (cleanupError) {
        console.error(`Cloudinary cleanup failed for replaced media (${previousPublicId}):`, cleanupError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update Gallery Item Error:', error);
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
    if (item.publicId && isCloudinaryConfigured()) {
      const resourceType = item.type === 'video' ? 'video' : 'image';
      try {
        await cloudinary.uploader.destroy(item.publicId, { resource_type: resourceType });
      } catch (cldDestroyErr) {
        console.error(`Cloudinary deletion error for publicId (${item.publicId}):`, cldDestroyErr.message);
      }
    }

    // Legacy support: Delete local file ONLY IF existing record was stored in local /uploads/
    if (item.url && item.url.includes('/uploads/')) {
      try {
        const pathModule = await import('path');
        const fsModule = await import('fs');
        const filename = pathModule.basename(item.url);
        const filePath = pathModule.join(process.cwd(), 'uploads', filename);
        if (fsModule.existsSync(filePath)) {
          fsModule.unlinkSync(filePath);
        }
      } catch (legacyErr) {
        console.warn('Legacy file cleanup notice:', legacyErr.message);
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
