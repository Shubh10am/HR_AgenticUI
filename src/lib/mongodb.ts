
import mongoose from 'mongoose';

// Import all models to ensure they are registered with Mongoose before use.
// This is crucial for serverless environments like Vercel where file execution
// order is not guaranteed across different function invocations.
import './../models/Organization';
import './../models/Employee';
import './../models/Admin';
import './../models/AttendanceRecord';
import './../models/CompanyPolicy';
import './../models/LeaveRequest';
import './../models/SupportTicket';
import './../models/TokenUsageLog';
import './../models/Post';
import './../models/Comment';
import './../models/ContactSubmission';
import './../models/DemoRequest';


const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
