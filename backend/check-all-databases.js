import mongoose from 'mongoose';

const connections = [
  {
    name: 'Current (erp-dev)',
    uri: 'mongodb+srv://spiritminetech_db_user:WEjGsXhdDqjQ08W5@erp-dev.ubah6nb.mongodb.net/?appName=Erp-Dev',
    dbName: 'erpNew'
  },
  {
    name: 'Commented URI 1 (erp cluster)',
    uri: 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp',
    dbName: 'erp'
  },
  {
    name: 'Commented URI 2 (erp cluster - replica set)',
    uri: 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority',
    dbName: 'erp'
  }
];

async function checkDatabase(config) {
  try {
    console.log(`\n🔍 Checking: ${config.name}`);
    console.log(`   Database: ${config.dbName}`);
    
    await mongoose.connect(config.uri);
    const db = mongoose.connection.db;
    
    // Check employees collection
    const employeeCount = await db.collection('employees').countDocuments();
    console.log(`   ✅ Connected! Employees: ${employeeCount} documents`);
    
    if (employeeCount > 0) {
      // Get a sample employee
      const sample = await db.collection('employees').findOne();
      console.log(`   📄 Sample employee: ${sample?.name || sample?.email || 'No name/email'}`);
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function checkAll() {
  console.log('🔍 Checking all database connections for employee data...\n');
  
  for (const config of connections) {
    await checkDatabase(config);
  }
  
  console.log('\n✅ Check complete!');
  process.exit(0);
}

checkAll();
