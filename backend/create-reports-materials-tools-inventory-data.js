/**
 * Create comprehensive test data for Reports, Materials, Tools, and Inventory screens
 * For supervisorId 4
 * Run: node create-reports-materials-tools-inventory-data.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import Project from './src/modules/project/models/Project.js';
import ProjectDailyProgress from './src/modules/project/models/ProjectDailyProgress.js';
import ProjectDailyProgressPhoto from './src/modules/project/models/ProjectDailyProgressPhoto.js';
import Material from './src/modules/project/models/Material.js';
import Tool from './src/modules/project/models/Tool.js';
import Employee from './src/modules/employee/Employee.js';

async function createReportsAndInventoryData() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const supervisorId = 4;
    console.log(`🎯 Creating Reports, Materials, Tools & Inventory data for Supervisor ID: ${supervisorId}\n`);

    // ========================================
    // STEP 1: Get supervisor's projects
    // ========================================
    console.log('📋 STEP 1: Finding supervisor\'s projects...');
    
    const projects = await Project.find({ supervisorId: supervisorId });
    console.log(`✅ Found ${projects.length} projects supervised by supervisor ${supervisorId}`);
    
    if (projects.length === 0) {
      console.log('❌ No projects found for this supervisor.');
      return;
    }

    const projectIds = projects.map(p => p.id);
    console.log(`📊 Project IDs: ${projectIds.join(', ')}`);

    // ========================================
    // STEP 2: Create Daily Progress Reports
    // ========================================
    console.log('\n📋 STEP 2: Creating Daily Progress Reports...');
    
    const reportDates = [
      new Date('2026-02-08'),
      new Date('2026-02-09'),
      new Date('2026-02-10'),
      new Date('2026-02-07'),
      new Date('2026-02-06')
    ];

    const createdReports = [];
    for (const [projectIndex, project] of projects.slice(0, 2).entries()) { // Use first 2 projects
      for (const [dateIndex, reportDate] of reportDates.entries()) {
        const lastReport = await ProjectDailyProgress.findOne().sort({ id: -1 });
        const nextReportId = lastReport ? lastReport.id + 1 : 1;
        
        const progressPercentage = Math.min(20 + (dateIndex * 15) + (projectIndex * 10), 95);
        
        const report = await ProjectDailyProgress.create({
          id: nextReportId,
          projectId: project.id,
          supervisorId: supervisorId,
          date: reportDate,
          overallProgress: progressPercentage,
          remarks: `Daily progress for ${project.projectName || project.name}. Work proceeding as planned with ${progressPercentage}% completion.`,
          issues: dateIndex === 2 ? 'Minor delay due to weather conditions' : dateIndex === 4 ? 'Material delivery delayed by 2 hours' : 'No major issues reported',
          submittedAt: new Date(reportDate.getTime() + 18 * 60 * 60 * 1000), // 6 PM same day
          approvalStatus: dateIndex < 3 ? 'APPROVED' : 'PENDING',
          approvedBy: dateIndex < 3 ? 1 : null, // Manager ID 1
          approvedAt: dateIndex < 3 ? new Date(reportDate.getTime() + 20 * 60 * 60 * 1000) : null,
          
          // Manpower Usage
          manpowerUsage: {
            totalWorkers: 15 + projectIndex * 5,
            activeWorkers: 13 + projectIndex * 4,
            productivity: 85 + Math.floor(Math.random() * 10),
            efficiency: 80 + Math.floor(Math.random() * 15),
            overtimeHours: dateIndex === 1 ? 4 : dateIndex === 3 ? 2 : 0,
            absentWorkers: Math.floor(Math.random() * 3),
            lateWorkers: Math.floor(Math.random() * 2),
            workerBreakdown: [
              { role: 'Mason', planned: 6, actual: 5 + Math.floor(Math.random() * 2), hoursWorked: 40 + Math.floor(Math.random() * 8) },
              { role: 'Carpenter', planned: 4, actual: 3 + Math.floor(Math.random() * 2), hoursWorked: 32 + Math.floor(Math.random() * 8) },
              { role: 'Electrician', planned: 3, actual: 2 + Math.floor(Math.random() * 2), hoursWorked: 24 + Math.floor(Math.random() * 8) },
              { role: 'Helper', planned: 5, actual: 4 + Math.floor(Math.random() * 2), hoursWorked: 40 + Math.floor(Math.random() * 8) }
            ]
          },
          
          // Material Consumption
          materialConsumption: [
            {
              materialId: 101,
              materialName: 'Portland Cement',
              consumed: 25 + Math.floor(Math.random() * 15),
              remaining: 150 - (25 + Math.floor(Math.random() * 15)),
              unit: 'bags',
              plannedConsumption: 30,
              wastage: Math.floor(Math.random() * 3),
              notes: 'Quality good, no issues'
            },
            {
              materialId: 102,
              materialName: 'Steel Reinforcement Bars',
              consumed: 50 + Math.floor(Math.random() * 20),
              remaining: 200 - (50 + Math.floor(Math.random() * 20)),
              unit: 'pieces',
              plannedConsumption: 60,
              wastage: Math.floor(Math.random() * 5),
              notes: 'Standard quality, on schedule'
            },
            {
              materialId: 103,
              materialName: 'Ready Mix Concrete',
              consumed: 8 + Math.floor(Math.random() * 4),
              remaining: 50 - (8 + Math.floor(Math.random() * 4)),
              unit: 'cubic meters',
              plannedConsumption: 10,
              wastage: 0.5,
              notes: 'Fresh delivery, good consistency'
            }
          ]
        });
        
        createdReports.push(report);
        console.log(`✅ Created Daily Report ID: ${report.id} for ${project.projectName || project.name} (${reportDate.toDateString()})`);
        
        // Create some photos for recent reports
        if (dateIndex < 3) {
          const photoCount = Math.floor(Math.random() * 3) + 1; // 1-3 photos
          for (let i = 0; i < photoCount; i++) {
            const lastPhoto = await ProjectDailyProgressPhoto.findOne().sort({ id: -1 });
            const nextPhotoId = lastPhoto ? lastPhoto.id + 1 : 1;
            
            await ProjectDailyProgressPhoto.create({
              id: nextPhotoId,
              dailyProgressId: report.id,
              projectId: project.id,
              supervisorId: supervisorId,
              photoUrl: `/uploads/progress/project_${project.id}_${reportDate.toISOString().split('T')[0]}_${i + 1}.jpg`,
              uploadedAt: new Date(reportDate.getTime() + (17 + i) * 60 * 60 * 1000) // 5 PM, 6 PM, 7 PM
            });
          }
          console.log(`   📸 Added ${photoCount} photos for this report`);
        }
      }
    }

    // ========================================
    // STEP 3: Create Materials Inventory
    // ========================================
    console.log('\n📋 STEP 3: Creating Materials Inventory...');
    
    const materialsData = [
      // Project 1 Materials
      {
        projectId: projectIds[0],
        name: 'Portland Cement',
        category: 'concrete',
        quantity: 200,
        unit: 'bags',
        allocated: 150,
        used: 75,
        location: 'Storage Area A',
        specification: 'Grade 53, OPC',
        brand: 'UltraTech',
        costPerUnit: 450,
        supplier: 'Building Materials Ltd',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Steel Reinforcement Bars',
        category: 'steel',
        quantity: 500,
        unit: 'pieces',
        allocated: 300,
        used: 120,
        location: 'Storage Area B',
        specification: '12mm TMT Bars',
        brand: 'Tata Steel',
        costPerUnit: 65,
        supplier: 'Steel Mart',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Ready Mix Concrete',
        category: 'concrete',
        quantity: 100,
        unit: 'cubic meters',
        allocated: 60,
        used: 25,
        location: 'On-site mixing',
        specification: 'M25 Grade',
        brand: 'RMC Corp',
        costPerUnit: 4500,
        supplier: 'Concrete Solutions',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Electrical Cables',
        category: 'electrical',
        quantity: 1000,
        unit: 'meters',
        allocated: 600,
        used: 200,
        location: 'Electrical Store',
        specification: '2.5 sq mm copper wire',
        brand: 'Havells',
        costPerUnit: 85,
        supplier: 'Electrical Supplies Co',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'PVC Pipes',
        category: 'plumbing',
        quantity: 200,
        unit: 'pieces',
        allocated: 120,
        used: 45,
        location: 'Plumbing Store',
        specification: '4 inch diameter',
        brand: 'Supreme',
        costPerUnit: 320,
        supplier: 'Plumbing Mart',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Ceramic Tiles',
        category: 'finishing',
        quantity: 500,
        unit: 'sq meters',
        allocated: 200,
        used: 50,
        location: 'Finishing Store',
        specification: '600x600mm Vitrified',
        brand: 'Kajaria',
        costPerUnit: 450,
        supplier: 'Tile World',
        status: 'available'
      },
      // Project 2 Materials (if exists)
      ...(projectIds[1] ? [
        {
          projectId: projectIds[1],
          name: 'Bricks',
          category: 'other',
          quantity: 10000,
          unit: 'pieces',
          allocated: 6000,
          used: 2500,
          location: 'Brick Yard',
          specification: 'Red clay bricks',
          brand: 'Local Supplier',
          costPerUnit: 8,
          supplier: 'Brick Works',
          status: 'available'
        },
        {
          projectId: projectIds[1],
          name: 'Wooden Planks',
          category: 'wood',
          quantity: 100,
          unit: 'pieces',
          allocated: 60,
          used: 25,
          location: 'Carpentry Shop',
          specification: 'Teak wood planks',
          brand: 'Premium Wood',
          costPerUnit: 1200,
          supplier: 'Wood Mart',
          status: 'available'
        },
        {
          projectId: projectIds[1],
          name: 'Paint',
          category: 'finishing',
          quantity: 50,
          unit: 'liters',
          allocated: 30,
          used: 12,
          location: 'Paint Store',
          specification: 'Exterior emulsion',
          brand: 'Asian Paints',
          costPerUnit: 350,
          supplier: 'Paint Palace',
          status: 'available'
        }
      ] : [])
    ];

    const createdMaterials = [];
    for (const materialData of materialsData) {
      const lastMaterial = await Material.findOne().sort({ id: -1 });
      const nextMaterialId = lastMaterial ? lastMaterial.id + 1 : 101;
      
      const material = await Material.create({
        id: nextMaterialId,
        companyId: 1,
        projectId: materialData.projectId,
        name: materialData.name,
        category: materialData.category,
        quantity: materialData.quantity,
        unit: materialData.unit,
        allocated: materialData.allocated,
        used: materialData.used,
        location: materialData.location,
        specification: materialData.specification,
        brand: materialData.brand,
        purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
        costPerUnit: materialData.costPerUnit,
        totalCost: materialData.costPerUnit * materialData.quantity,
        supplier: materialData.supplier,
        batchNumber: `BATCH-${nextMaterialId}-${new Date().getFullYear()}`,
        qualityGrade: 'Grade A',
        status: materialData.status
      });
      
      createdMaterials.push(material);
      console.log(`✅ Created Material: ${material.name} (ID: ${material.id}) - Available: ${material.quantity - material.used} ${material.unit}`);
    }

    // ========================================
    // STEP 4: Create Tools Inventory
    // ========================================
    console.log('\n📋 STEP 4: Creating Tools Inventory...');
    
    const toolsData = [
      // Project 1 Tools
      {
        projectId: projectIds[0],
        name: 'Power Drill Set',
        category: 'power_tools',
        quantity: 5,
        unit: 'sets',
        allocated: false,
        location: 'Tool Room A',
        condition: 'excellent',
        serialNumber: 'PD-001-2024',
        cost: 15000,
        supplier: 'Tool Mart',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Angle Grinder',
        category: 'power_tools',
        quantity: 8,
        unit: 'pieces',
        allocated: false,
        location: 'Tool Room A',
        condition: 'good',
        serialNumber: 'AG-002-2024',
        cost: 8000,
        supplier: 'Power Tools Co',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Concrete Mixer',
        category: 'power_tools',
        quantity: 2,
        unit: 'pieces',
        allocated: true,
        location: 'Site Area 1',
        condition: 'good',
        serialNumber: 'CM-003-2024',
        cost: 45000,
        supplier: 'Construction Equipment',
        status: 'in_use'
      },
      {
        projectId: projectIds[0],
        name: 'Safety Helmets',
        category: 'safety_equipment',
        quantity: 25,
        unit: 'pieces',
        allocated: false,
        location: 'Safety Store',
        condition: 'excellent',
        serialNumber: 'SH-004-2024',
        cost: 500,
        supplier: 'Safety First',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Safety Harness',
        category: 'safety_equipment',
        quantity: 15,
        unit: 'pieces',
        allocated: false,
        location: 'Safety Store',
        condition: 'good',
        serialNumber: 'SHR-005-2024',
        cost: 1200,
        supplier: 'Safety Solutions',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Measuring Tape',
        category: 'measuring_tools',
        quantity: 10,
        unit: 'pieces',
        allocated: false,
        location: 'Tool Room A',
        condition: 'good',
        serialNumber: 'MT-006-2024',
        cost: 350,
        supplier: 'Precision Tools',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Spirit Level',
        category: 'measuring_tools',
        quantity: 8,
        unit: 'pieces',
        allocated: false,
        location: 'Tool Room A',
        condition: 'excellent',
        serialNumber: 'SL-007-2024',
        cost: 800,
        supplier: 'Level Best Tools',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Hammer Set',
        category: 'hand_tools',
        quantity: 12,
        unit: 'sets',
        allocated: false,
        location: 'Tool Room B',
        condition: 'good',
        serialNumber: 'HS-008-2024',
        cost: 1500,
        supplier: 'Hand Tools Inc',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Screwdriver Set',
        category: 'hand_tools',
        quantity: 15,
        unit: 'sets',
        allocated: false,
        location: 'Tool Room B',
        condition: 'excellent',
        serialNumber: 'SS-009-2024',
        cost: 800,
        supplier: 'Precision Hand Tools',
        status: 'available'
      },
      {
        projectId: projectIds[0],
        name: 'Welding Machine',
        category: 'power_tools',
        quantity: 3,
        unit: 'pieces',
        allocated: true,
        location: 'Welding Bay',
        condition: 'good',
        serialNumber: 'WM-010-2024',
        cost: 25000,
        supplier: 'Welding Solutions',
        status: 'in_use',
        lastMaintenanceDate: new Date('2026-01-15'),
        nextMaintenanceDate: new Date('2026-04-15')
      },
      // Project 2 Tools (if exists)
      ...(projectIds[1] ? [
        {
          projectId: projectIds[1],
          name: 'Circular Saw',
          category: 'power_tools',
          quantity: 4,
          unit: 'pieces',
          allocated: false,
          location: 'Carpentry Shop',
          condition: 'excellent',
          serialNumber: 'CS-011-2024',
          cost: 12000,
          supplier: 'Wood Working Tools',
          status: 'available'
        },
        {
          projectId: projectIds[1],
          name: 'Paint Sprayer',
          category: 'power_tools',
          quantity: 3,
          unit: 'pieces',
          allocated: false,
          location: 'Paint Room',
          condition: 'good',
          serialNumber: 'PS-012-2024',
          cost: 8500,
          supplier: 'Paint Equipment Co',
          status: 'available'
        },
        {
          projectId: projectIds[1],
          name: 'Ladder Set',
          category: 'other',
          quantity: 6,
          unit: 'pieces',
          allocated: false,
          location: 'General Store',
          condition: 'good',
          serialNumber: 'LS-013-2024',
          cost: 3500,
          supplier: 'Access Equipment',
          status: 'available'
        }
      ] : [])
    ];

    const createdTools = [];
    for (const toolData of toolsData) {
      const lastTool = await Tool.findOne().sort({ id: -1 });
      const nextToolId = lastTool ? lastTool.id + 1 : 201;
      
      const tool = await Tool.create({
        id: nextToolId,
        companyId: 1,
        projectId: toolData.projectId,
        name: toolData.name,
        category: toolData.category,
        quantity: toolData.quantity,
        unit: toolData.unit,
        allocated: toolData.allocated,
        location: toolData.location,
        condition: toolData.condition,
        serialNumber: toolData.serialNumber,
        purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000), // Random date within last 60 days
        lastMaintenanceDate: toolData.lastMaintenanceDate,
        nextMaintenanceDate: toolData.nextMaintenanceDate,
        cost: toolData.cost,
        supplier: toolData.supplier,
        status: toolData.status
      });
      
      createdTools.push(tool);
      console.log(`✅ Created Tool: ${tool.name} (ID: ${tool.id}) - Status: ${tool.status}, Qty: ${tool.quantity}`);
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ REPORTS, MATERIALS, TOOLS & INVENTORY DATA CREATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary for Supervisor ID ${supervisorId}:`);
    console.log(`   - Daily Progress Reports: ${createdReports.length}`);
    console.log(`   - Materials in Inventory: ${createdMaterials.length}`);
    console.log(`   - Tools in Inventory: ${createdTools.length}`);
    console.log(`   - Projects with Data: ${Math.min(projects.length, 2)}`);
    
    console.log(`\n🎯 Test URLs for Mobile App:\n`);
    
    console.log(`1️⃣  Daily Progress Reports:`);
    console.log(`   GET http://192.168.0.3:5002/api/supervisor/daily-progress/${projectIds[0]}`);
    console.log(`   GET http://192.168.0.3:5002/api/supervisor/daily-progress/${projectIds[0]}/2026-02-10`);
    console.log(`   Headers: Authorization: Bearer <token>\n`);
    
    console.log(`2️⃣  Materials & Tools Combined:`);
    console.log(`   GET http://192.168.0.3:5002/api/supervisor/materials-tools?projectId=${projectIds[0]}`);
    console.log(`   Headers: Authorization: Bearer <token>\n`);
    
    console.log(`3️⃣  Materials Inventory:`);
    console.log(`   GET http://192.168.0.3:5002/api/supervisor/materials/inventory?projectId=${projectIds[0]}`);
    console.log(`   GET http://192.168.0.3:5002/api/supervisor/materials/inventory?lowStock=true`);
    console.log(`   Headers: Authorization: Bearer <token>\n`);
    
    console.log(`4️⃣  Tool Usage Log:`);
    console.log(`   GET http://192.168.0.3:5002/api/supervisor/tool-usage-log?projectId=${projectIds[0]}`);
    console.log(`   Headers: Authorization: Bearer <token>\n`);
    
    console.log(`5️⃣  Submit Daily Progress:`);
    console.log(`   POST http://192.168.0.3:5002/api/supervisor/daily-progress`);
    console.log(`   Body: { projectId: ${projectIds[0]}, overallProgress: 75, remarks: "Good progress", issues: "None" }`);
    console.log(`   Headers: Authorization: Bearer <token>\n`);

    console.log(`\n📝 Login Credentials:`);
    console.log(`   Email: supervisor@gmail.com`);
    console.log(`   Password: password123`);
    console.log(`   POST http://192.168.0.3:5002/api/auth/login\n`);

    console.log(`\n📱 Mobile App Testing:`);
    console.log(`   1. Login as supervisor@gmail.com`);
    console.log(`   2. Navigate to Reports section - view daily progress reports`);
    console.log(`   3. Go to Materials section - check inventory levels`);
    console.log(`   4. Go to Tools section - view tool availability`);
    console.log(`   5. Test creating new daily progress reports`);
    console.log(`   6. Test material/tool allocation and usage tracking`);

    // Show some sample data
    console.log(`\n📋 Sample Data Created:`);
    console.log(`\n   📊 Latest Report:`);
    if (createdReports.length > 0) {
      const latestReport = createdReports[createdReports.length - 1];
      console.log(`      Date: ${latestReport.date.toDateString()}`);
      console.log(`      Progress: ${latestReport.overallProgress}%`);
      console.log(`      Status: ${latestReport.approvalStatus}`);
    }
    
    console.log(`\n   🧱 Sample Materials:`);
    createdMaterials.slice(0, 3).forEach(material => {
      console.log(`      ${material.name}: ${material.quantity - material.used}/${material.quantity} ${material.unit} available`);
    });
    
    console.log(`\n   🔧 Sample Tools:`);
    createdTools.slice(0, 3).forEach(tool => {
      console.log(`      ${tool.name}: ${tool.quantity} ${tool.unit} (${tool.status})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

createReportsAndInventoryData();