const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/accesshub';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Make sure your local MongoDB service is running on mongodb://127.0.0.1:27017');
    process.exit(1);
  }
};

module.exports = connectDB;
