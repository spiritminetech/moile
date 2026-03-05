// Simple script to populate clients collection
// Run with: node populate-clients.js

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_db');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define client schema
const clientSchema = new mongoose.Schema({
  clientId: { type: Number, unique: true, required: true },
  clientName: { type: String, required: true },
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  companyId: { type: Number, required: true },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

// Sample clients
const clients = [
  {
    clientId: 1,
    clientName: 'ABC Pte Ltd',
    contactPerson: 'John Smith',
    email: 'john@abc.com.sg',
    phone: '+65 6123 4567',
    address: '123 Business Park, Singapore 123456',
    companyId: 1,
    status: 'Active'
  },
  {
    clientId: 2,
    clientName: 'XYZ Construction',
    contactPerson: 'Mary Johnson',
    email: 'mary@xyz.com.sg',
    phone: '+65 6234 5678',
    address: '456 Industrial Road, Singapore 234567',
    companyId: 1,
    status: 'Active'
  },
  {
    clientId: 3,
    clientName: 'DEF Properties',
    contactPerson: 'Robert Lee',
    email: 'robert@def.com.sg',
    phone: '+65 6345 6789',
    address: '789 Orchard Road, Singapore 345678',
    companyId: 1,
    status: 'Active'
  },
  {
    clientId: 4,
    clientName: 'GHI Development',
    contactPerson: 'Sarah Tan',
    email: 'sarah@ghi.com.sg',
    phone: '+65 6456 7890',
    address: '321 Marina Bay, Singapore 456789',
    companyId: 1,
    status: 'Active'
  }
];

// Insert data
async function insertData() {
  try {
    // Clear existing clients (optional)
    await Client.deleteMany({});
    console.log('🗑️  Cleared existing clients');
    
    // Insert new clients
    const result = await Client.insertMany(clients);
    console.log(`✅ Inserted ${result.length} clients:`);
    
    result.forEach(c => {
      console.log(`   - ${c.clientName} (ID: ${c.clientId}) - ${c.contactPerson}`);
    });
    
    // Show summary
    const total = await Client.countDocuments();
    console.log(`\n📊 Total clients in database: ${total}`);
    
  } catch (error) {
    console.error('❌ Error inserting data:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  await insertData();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  console.log('🎉 Client data population completed!');
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});