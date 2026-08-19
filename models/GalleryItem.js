import mongoose from 'mongoose';

const galleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Photos', 'Videos', 'Surgical Setup', 'Doctor & Care', 'Clinic Facilities'],
    default: 'Photos',
    required: true
  },
  type: {
    type: String,
    enum: ['photo', 'video'],
    default: 'photo',
    required: true
  },
  url: {
    type: String,
    required: [true, 'Media URL is required']
  },
  publicId: {
    type: String,
    default: ''
  },
  tag: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  isLocal: {
    type: Boolean,
    default: false
  },
  fileName: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema);

export default GalleryItem;
