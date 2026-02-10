/**
 * Check client information for employeeId=2's project
 * Verifies the client data path: Project (clientId) -> Client collection
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Define schemas
const projectSchema = new mongoose.Schema({
  id: Number,
  projectName: String,
  projectCode: String,
  clientId: Number,
  clientName: String,
  companyId: Number
}, { collection: 'projects' });

const workerTaskAssignmentSchema = new mongoose.Schema({
  id: Number,
  employeeId: Number,
  proj