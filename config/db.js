import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows DNS resolution issue (querySrv ECONNREFUSED) with MongoDB Atlas SRV records
try {
  if (dns.setServers) {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  }
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Ignore if custom DNS setting is restricted
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dr_vinish_db';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5s timeout instead of infinite buffering
    });
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database Connection Failed (${mongoUri}): ${error.message}`);
    throw error;
  }
};

export default connectDB;
