import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import adminRoutes from './routes/adminRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import Admin from './models/Admin.js';
import { seedGalleryItems } from './controllers/galleryController.js';
import { seedBlogsIfEmpty } from './controllers/blogController.js';
import { seedInitialEnquiries } from './controllers/enquiryController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static uploads folder for video & image storage
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/enquiries', enquiryRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Dr. Vinish Kumar Singh Admin API is running...');
});

// Seed default Admin if no admin exists
const seedDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        name: 'Dr. Vinish Kumar Singh',
        email: 'admin@drvinish.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'Administrator'
      });
      console.log('Default Admin Account Created: admin@drvinish.com / admin123');
    }
  } catch (error) {
    console.error('Error seeding default admin:', error.message);
  }
};

const PORT = process.env.PORT || 5000;

// Start Server after connecting to DB
const startApp = async () => {
  try {
    await connectDB();
    await seedBlogsIfEmpty();
    await seedDefaultAdmin();
    await seedGalleryItems();
    await seedInitialEnquiries();
  } catch (dbErr) {
    console.error('Warning: Server started without DB connection. Please configure MONGO_URI in Render environment variables.');
  }

  app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
  });
};

startApp();
