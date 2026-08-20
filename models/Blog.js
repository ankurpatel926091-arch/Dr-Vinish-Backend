import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Blog slug is required'],
      trim: true,
      lowercase: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General Urology'
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800'
    },
    shortDescription: {
      type: String,
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Blog content is required']
    },
    publishDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    readTime: {
      type: String,
      default: '5 min read'
    },
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Published'
    },
    featured: {
      type: Boolean,
      default: false
    },
    author: {
      type: String,
      default: 'Dr. Vinish Kumar Singh'
    },
    authorRole: {
      type: String,
      default: 'Senior Consultant Urologist & Laser Surgeon'
    }
  },
  {
    timestamps: true
  }
);

// Index for search & slug lookup
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1 });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
