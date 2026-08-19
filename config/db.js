import mongoose from 'mongoose';

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
