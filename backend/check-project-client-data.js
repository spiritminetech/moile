import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

const checkProjectClientData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check project 1003 (School Campus Renovation)
    const project = await Project.findOne({ id: 1003 });
    
    console.log('\n📊 Project 1003 Data:');
    console.log('Project Name:', project.projectName);
    console.log('Client ID:', project.clientId);
    console.log('Client Name:', project.clientName);
    
    // Check if clients collection exists and has data
    const clientsCollection = mongoose.connection.db.collection('clients');
    const clientsCount = await clientsCollection.countDocuments();
    console.log('\n📋 Clients Collection:');
    console.log('Total clients:', clientsCount);
    
    if (project.clientId) {
      const client = await clientsCollection.findOne({ id: project.clientId });
      console.log('\nClient data for clientId', project.clientId + ':', client);
    } else {
      console.log('\n⚠️ Project has no clientId set');
    }
    
    // List all clients
    if (clientsCount > 0) {
      const allClients = await clientsCollection.find({}).limit(10).toArray();
      console.log('\n📋 Sample clients:');
      allClients.forEach(client => {
        console.log(`  - ID: ${client.id}, Name: ${client.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

checkProjectClientData();
