import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));

async function verifyAttendanceFeatures() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendances = await Attendance.find({
      date: today,
      projectId: 1
    }).sort({ employeeId: 1 });

    console.log('📊 ATTENDANCE MONITORING FEATURES VERIFICATION');
    console.log('='.repeat(80));

    attendances.forEach((att, index) => {
      console.log(`\n${index + 1}. ${att.employeeName} (ID: ${att.employeeId})`);
      console.log('   ' + '-'.repeat(70));
      
      // Status
      console.log(`   📍 Status: ${att.status.toUpperCase()}`);
      
      // Clock times
      if (att.clockIn) {
        console.log(`   🕐 Clock In: ${att.clockIn.toLocaleTimeString()}`);
      }
      if (att.clockOut) {
        console.log(`   🕐 Clock Out: ${att.clockOut.toLocaleTimeString()}`);
      }
      
      // Lunch break tracking
      if (att.lunchStart && att.lunchEnd) {
        console.log(`   🍽️  Lunch Break:`);
        console.log(`      Start: ${att.lunchStart.toLocaleTimeString()}`);
        console.log(`      End: ${att.lunchEnd.toLocaleTimeString()}`);
        console.log(`      Duration: ${att.lunchDuration} minutes`);
        
        if (att.lunchDuration > 60) {
          console.log(`      ⚠️  Extended lunch break!`);
        }
      } else if (att.status === 'present') {
        console.log(`   🍽️  Lunch Break: None`);
      }
      
      // Hours tracking
      console.log(`   ⏱️  Hours:`);
      console.log(`      Regular: ${att.regularHours}h (Display in GREEN)`);
      console.log(`      Overtime: ${att.otHours}h (Display in ORANGE/BOLD)`);
      console.log(`      Total: ${att.totalHours}h`);
      
      // Absence information
      if (att.absenceReason) {
        console.log(`   ⚠️  Absence Reason: ${att.absenceReason} (Color-coded badge)`);
      }
      if (att.absenceNote) {
        console.log(`   📝 Note: ${att.absenceNote}`);
      }
      
      // Escalation status
      if (att.escalated !== undefined) {
        if (att.escalated) {
          console.log(`   🚨 ESCALATED at ${att.escalatedAt?.toLocaleString()}`);
        } else if (att.status === 'absent' || att.status === 'late') {
          console.log(`   🔘 Action Available: Can escalate`);
        }
      }
      
      // Action buttons
      console.log(`   🎯 Actions:`);
      if (!att.absenceReason && (att.status === 'absent' || att.status === 'late')) {
        console.log(`      ✅ Mark Reason (Available)`);
      } else if (att.absenceReason) {
        console.log(`      ✏️  Edit Reason (Available)`);
      }
      if (!att.escalated && (att.status === 'absent' || att.status === 'late')) {
        console.log(`      ⚠️  Escalate (Available)`);
      } else if (att.escalated) {
        console.log(`      ✅ Already Escalated`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('📋 FEATURE CHECKLIST');
    console.log('='.repeat(80));

    const features = [
      {
        name: 'Lunch Break Tracking',
        check: attendances.some(a => a.lunchStart && a.lunchEnd && a.lunchDuration)
      },
      {
        name: 'Regular Hours Display',
        check: attendances.some(a => a.regularHours > 0)
      },
      {
        name: 'OT Hours Display',
        check: attendances.some(a => a.otHours > 0)
      },
      {
        name: 'Absence Reasons',
        check: attendances.some(a => a.absenceReason)
      },
      {
        name: 'Absence Notes',
        check: attendances.some(a => a.absenceNote)
      },
      {
        name: 'Escalation Status',
        check: attendances.some(a => a.escalated === true)
      },
      {
        name: 'Non-escalated Cases',
        check: attendances.some(a => a.escalated === false && (a.status === 'absent' || a.status === 'late'))
      },
      {
        name: 'Extended Lunch Breaks',
        check: attendances.some(a => a.lunchDuration > 60)
      },
      {
        name: 'Multiple Status Types',
        check: new Set(attendances.map(a => a.status)).size >= 3
      },
      {
        name: 'Late Arrivals',
        check: attendances.some(a => a.status === 'late')
      }
    ];

    features.forEach(feature => {
      const icon = feature.check ? '✅' : '❌';
      console.log(`${icon} ${feature.name}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📱 MOBILE APP TESTING GUIDE');
    console.log('='.repeat(80));
    console.log('1. Login as supervisor4@example.com / password123');
    console.log('2. Navigate to Attendance Monitoring screen');
    console.log('3. Select today\'s date');
    console.log('4. Verify the following:');
    console.log('   • Lunch break times are displayed with start, end, and duration');
    console.log('   • Regular hours are shown in GREEN color');
    console.log('   • OT hours are shown in ORANGE/BOLD');
    console.log('   • Absence reasons appear as color-coded badges');
    console.log('   • Notes are visible for absences and special cases');
    console.log('   • "Mark Reason" button appears for unmarked absences/late');
    console.log('   • "Escalate" button appears for non-escalated issues');
    console.log('   • Escalated cases show escalation indicator');
    console.log('   • Extended lunch breaks are highlighted');

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

verifyAttendanceFeatures();
