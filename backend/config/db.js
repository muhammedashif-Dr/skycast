import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return true;
  }

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather';
  
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3 seconds instead of 30 seconds
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Error: ${error.message}`);
    console.warn('Running backend with in-memory fallback for history and favorites.');
    isConnected = false;
    return false;
  }
};

export const getDBStatus = () => isConnected;
