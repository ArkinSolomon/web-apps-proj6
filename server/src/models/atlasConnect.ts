import mongoose from 'mongoose';
let isInitialized = false;

export default async function connect() {
  if (isInitialized) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.ATLAS_CONNECTION_STRING!, {
      tlsAllowInvalidCertificates: false,
      minPoolSize: 5,
      socketTimeoutMS: 60000 
    });
    console.log('Connected to MongoDB Atlas');
    isInitialized = true;
  } catch (e) {
    console.error('Could not connect to MongoDB Atlas');
    console.error(e);
    process.exit(1);
  }
}