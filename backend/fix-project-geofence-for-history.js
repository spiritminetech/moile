// Fix project geofence coordinates for task history
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const Project = mongoose.model('Project', ProjectSchema);

// Set your actual location here
const YOUR_LOCATION = {
  latitude: 12.9716,  // Bangalore coordinates - CHANGE THIS to your actual location
  longitude: 77.5946,
  radius: 50000 // 50km radius for testing
};

async function fixProjectGeofence() {
  try {
    await mongoose.c