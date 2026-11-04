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
import appointmentRoutes from './routes/appointmentRoutes.js';
import clinicRoutes from './routes/clinicRoutes.js';
import Admin from './models/Admin.js';
import { seedGalleryItems } from './controllers/galleryController.js';
import { seedBlogsIfEmpty } from './controllers/blogController.js';
import { seedInitialEnquiries } from './controllers/enquiryController.js';
import { seedInitialClinics } from './controllers/clinicController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://dr-vinish-singh-frontend.vercel.app',
  'https://dr-vinish-singh-admin-panel.vercel.app',
  "https://www.urosurgeondrvinish.com/",
  "http://www.urosurgeondrvinish.com/",
  "http://www.urosurgeondrvinish.com",
  "https://www.urosurgeondrvinish.com",   
  "https://urosurgeondrvinish.com",
  "http://urosurgeondrvinish.com", 
  "https://admin.urosurgeondrvinish.com/",
  "https://admin.urosurgeondrvinish.com",
  "http://admin.urosurgeondrvinish.com/",
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];



const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /\.(vercel|netlify)\.app$/i.test(origin);
};

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true); 
    } else {
      callback(new Error('CORS policy: Ye origin allowed nahi hai'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', adminRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinics', clinicRoutes);

app.get('/', (req, res) => {
  res.send('Dr. Vinish Kumar Singh Admin API is running...');
});

const seedDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@drvinish.com' });
    if (!adminExists) {
      await Admin.create({
        name: 'Dr. Vinish Kumar Singh',
        email: 'admin@drvinish.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Default Admin Account Created: admin@drvinish.com / admin123');
    }
  } catch (error) {
    console.error('Error seeding default admin:', error.message);
  }
};

const seedDefaultdoctor = async () => {
  try {
    const doctorExists = await Admin.findOne({ email: 'doctor@drvinish.com' });
    if (!doctorExists) {
      await Admin.create({
        name: 'Dr. Vinish Kumar Singh',
        email: 'doctor@drvinish.com',
        password: 'doctor123',
        role: 'doctor'
      });
      console.log('Default Doctor Account Created: doctor@drvinish.com / doctor123');
    }
  } catch (error) {
    console.error('Error seeding default doctor:', error.message);
  }
};

const PORT = process.env.PORT || 5000;

const startApp = async () => {
  try {
    await connectDB();
    await seedDefaultAdmin();
    await seedDefaultdoctor();
    await seedInitialClinics();
  } catch (dbErr) {
    console.error('Warning: Server started without DB connection. Please configure MONGO_URI in environment variables.');
  }

  app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
  });
};

startApp();
