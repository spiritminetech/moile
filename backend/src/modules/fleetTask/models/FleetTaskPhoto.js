// models/FleetTaskPhoto.js
import mongoose from "mongoose";

const FleetTaskPhotoSchema = new mongoose.Schema({
  fleetTaskId: { type: Number, required: true },
  driverId: { type: Number, required: true },
  companyId: { type: Number, required: true },
  photoType: { type: String, enum: ["pickup", "dropoff"], required: true },
  photoUrl: { type: String, required: true },
  remarks: { type: String, default: "" },
  locationId: { type: Number },
  fileName: { type: String },
  fileSize: { type: Number },
  mimeType: { type: String },
  gpsLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }
  },
  uploadedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'fleetTaskPhotos',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export default mongoose.model("FleetTaskPhoto", FleetTaskPhotoSchema);