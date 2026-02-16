import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function addDetailedInstructions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update assignment 7035 (LED Lighting) with detailed instructions
    console.log('\n📝 Updating Assignment 7035 with detailed instructions...');
    const assignment7035 = await WorkerTaskAssignment.findOne({ id: 7035 });
    
    if (assignment7035) {
      assignment7035.supervisorInstructions = {
        text: `1. Follow safety harness procedure.
2. Complete units near staircase first.
3. Ensure alignment before sealing.
4. Take photo after every 5 installations.`,
        attachments: [
          {
            type: 'drawing',
            filename: 'Pipe_Layout_L5.pdf',
            url: '/uploads/instructions/pipe-layout-l5.pdf',
            uploadedAt: new Date(),
            uploadedBy: 4,
            description: 'Drawing – Pipe Layout L5',
            fileSize: 2458000,
            mimeType: 'application/pdf'
          },
          {
            type: 'document',
            filename: 'Method_Statement.pdf',
            url: '/uploads/instructions/method-statement.pdf',
            uploadedAt: new Date(),
            uploadedBy: 4,
            description: 'Method Statement PDF',
            fileSize: 1856000,
            mimeType: 'application/pdf'
          },
          {
            type: 'photo',
            filename: 'Reference_Photo.jpg',
            url: '/uploads/instructions/reference-photo.jpg',
            uploadedAt: new Date(),
            uploadedBy: 4,
            description: 'Reference Photo',
            fileSize: 845000,
            mimeType: 'image/jpeg'
          }
        ],
        lastUpdated: new Date(),
        updatedBy: 4
      };
      
      await assignment7035.save();
      console.log('✅ Updated assignment 7035 with detailed instructions');
    }

    // Update assignment 7036 (Painting) with instructions
    console.log('\n📝 Updating Assignment 7036 with instructions...');
    const assignment7036 = await WorkerTaskAssignment.findOne({ id: 7036 });
    
    if (assignment7036) {
      assignment7036.supervisorInstructions = {
        text: `1. Prepare surface by sanding rough areas.
2. Apply primer coat first and let dry for 2 hours.
3. Use roller for large areas, brush for edges.
4. Apply two coats with 4-hour gap between coats.
5. Take before and after photos.`,
        attachments: [
          {
            type: 'photo',
            filename: 'Color_Sample.jpg',
            url: '/uploads/instructions/color-sample.jpg',
            uploadedAt: new Date(),
            uploadedBy: 4,
            description: 'Color Sample Reference',
            fileSize: 456000,
            mimeType: 'image/jpeg'
          },
          {
            type: 'document',
            filename: 'Paint_Specifications.pdf',
            url: '/uploads/instructions/paint-specs.pdf',
            uploadedAt: new Date(),
            uploadedBy: 4,
            description: 'Paint Specifications',
            fileSize: 678000,
            mimeType: 'application/pdf'
          }
        ],
        lastUpdated: new Date(),
        updatedBy: 4
      };
      
      await assignment7036.save();
      console.log('✅ Updated assignment 7036 with instructions');
    }

    // Update assignment 7034 (Bricklaying) with instructions
    console.log('\n📝 Updating Assignment 7034 with instructions...');
    const assignment7034 = await WorkerTaskAssignment.findOne({ id: 7034 });
    
    if (assignment7034) {
      assignment7034.supervisorInstructions = {
        text: `1. Check brick quality before starting.
2. Maintain consistent mortar thickness (10mm).
3. Use string line for alignment.
4. Check level every 3 rows.
5. Clean excess mortar immediately.`,
        attachments: [
          {
            type: 'drawing',
            filename: 'Wall_Layout.pdf',
            url: '/uploads/instructions/wall-layout.pdf',
            uploadedAt: new Date(),
            uploadedBy: 4,
            description: 'Wall Layout Drawing',
            fileSize: 1234000,
            mimeType: 'application/pdf'
          },
          {
            type: 'photo',
            filename: 'Brick_Pattern.jpg',
            url: '/uploads/instructions/brick-pattern.jpg',
            uploadedAt: new Date(),
            uploadedBy: 4,
            description: 'Brick Pattern Reference',
            fileSize: 567000,
            mimeType: 'image/jpeg'
          }
        ],
        lastUpdated: new Date(),
        updatedBy: 4
      };
      
      await assignment7034.save();
      console.log('✅ Updated assignment 7034 with instructions');
    }

    // Verify updates
    console.log('\n✅ Verification:');
    const assignments = await WorkerTaskAssignment.find({
      id: { $in: [7034, 7035, 7036] }
    }).lean();

    for (const assignment of assignments) {
      console.log(`\n📋 Assignment ${assignment.id}:`);
      console.log(`  Instructions: ${assignment.supervisorInstructions?.text?.substring(0, 50)}...`);
      console.log(`  Attachments: ${assignment.supervisorInstructions?.attachments?.length || 0} files`);
      
      if (assignment.supervisorInstructions?.attachments) {
        assignment.supervisorInstructions.attachments.forEach((att, index) => {
          console.log(`    ${index + 1}. [${att.type.toUpperCase()}] ${att.description}`);
        });
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

addDetailedInstructions();
