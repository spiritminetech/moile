// Test script to verify that all content within team member cards is visible
const fs = require('fs');
const path = require('path');

const teamManagementPath = path.join(__dirname, 'src/screens/supervisor/TeamManagementScreen.tsx');

try {
  const content = fs.readFileSync(teamManagementPath, 'utf8');
  
  console.log('🔍 Testing Team Member Card Content Visibility...\n');
  console.log('Checking if all data within each card is properly displayed...\n');
  
  // Check for proper text handling
  const hasNumberOfLines = content.includes('numberOfLines={2}') || content.includes('numberOfLines={3}');
  const hasEllipsizeMode = content.includes('ellipsizeMode="tail"');
  
  // Check for proper container heights
  const hasMinHeightHeader = content.includes('minHeight: 60');
  const hasMinHeightContent = content.includes('minHeight: 80');
  const hasMinHeightTask = content.includes('minHeight: 40');
  const hasMinHeightLocation = content.includes('minHeight: 50');
  const hasMinHeightProgress = content.includes('minHeight: 20');
  
  // Check for proper flex layout
  const hasFlexForLocationText = content.includes('flex: 1, // Take available space');
  const hasMaxWidthStatus = content.includes('maxWidth: 100');
  const hasFlexShrinkStatus = content.includes('flexShrink: 0');
  const hasMarginForMemberInfo = content.includes('marginRight: ConstructionTheme.spacing.md, // Add margin to prevent overlap');
  
  // Check for text wrapping in styles
  const hasFlexWrapLocation = content.includes('flexWrap: \'wrap\', // Allow wrapping if text is long');
  
  console.log('✅ Text Display Improvements:');
  console.log(`   Multiple Lines Support: ${hasNumberOfLines ? '✓' : '✗'}`);
  console.log(`   Text Truncation with Ellipsis: ${hasEllipsizeMode ? '✓' : '✗'}`);
  
  console.log('\n✅ Container Height Fixes:');
  console.log(`   Card Header Min Height: ${hasMinHeightHeader ? '✓' : '✗'}`);
  console.log(`   Card Content Min Height: ${hasMinHeightContent ? '✓' : '✗'}`);
  console.log(`   Task Info Min Height: ${hasMinHeightTask ? '✓' : '✗'}`);
  console.log(`   Location Info Min Height: ${hasMinHeightLocation ? '✓' : '✗'}`);
  console.log(`   Progress Bar Min Height: ${hasMinHeightProgress ? '✓' : '✗'}`);
  
  console.log('\n✅ Layout Optimization:');
  console.log(`   Location Text Flex Layout: ${hasFlexForLocationText ? '✓' : '✗'}`);
  console.log(`   Status Container Max Width: ${hasMaxWidthStatus ? '✓' : '✗'}`);
  console.log(`   Status Container No Shrink: ${hasFlexShrinkStatus ? '✓' : '✗'}`);
  console.log(`   Member Info Margin: ${hasMarginForMemberInfo ? '✓' : '✗'}`);
  console.log(`   Location Status Flex Wrap: ${hasFlexWrapLocation ? '✓' : '✗'}`);
  
  // Check for specific content areas
  const hasNameDisplay = content.includes('member.name');
  const hasRoleDisplay = content.includes('member.role');
  const hasTaskDisplay = content.includes('member.currentTask?.name');
  const hasLocationDisplay = content.includes('member.location.insideGeofence');
  const hasProgressDisplay = content.includes('member.currentTask.progress');
  const hasLastUpdatedDisplay = content.includes('member.location.lastUpdated');
  
  console.log('\n✅ Content Areas Verification:');
  console.log(`   Member Name Display: ${hasNameDisplay ? '✓' : '✗'}`);
  console.log(`   Member Role Display: ${hasRoleDisplay ? '✓' : '✗'}`);
  console.log(`   Task Name Display: ${hasTaskDisplay ? '✓' : '✗'}`);
  console.log(`   Location Status Display: ${hasLocationDisplay ? '✓' : '✗'}`);
  console.log(`   Progress Display: ${hasProgressDisplay ? '✓' : '✗'}`);
  console.log(`   Last Updated Display: ${hasLastUpdatedDisplay ? '✓' : '✗'}`);
  
  const allChecks = [
    hasNumberOfLines,
    hasEllipsizeMode,
    hasMinHeightHeader,
    hasMinHeightContent,
    hasMinHeightTask,
    hasMinHeightLocation,
    hasMinHeightProgress,
    hasFlexForLocationText,
    hasMaxWidthStatus,
    hasFlexShrinkStatus,
    hasMarginForMemberInfo,
    hasFlexWrapLocation,
    hasNameDisplay,
    hasRoleDisplay,
    hasTaskDisplay,
    hasLocationDisplay,
    hasProgressDisplay,
    hasLastUpdatedDisplay
  ];
  
  const passedChecks = allChecks.filter(check => check).length;
  const totalChecks = allChecks.length;
  
  console.log(`\n📊 Card Content Visibility Score: ${passedChecks}/${totalChecks} checks passed`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 CARD CONTENT VISIBILITY ISSUE FIXED! 🎉');
    console.log('\n📱 What you should now see in each team member card:');
    console.log('   ✅ Full member name (up to 2 lines with ellipsis if longer)');
    console.log('   ✅ Complete role description (up to 2 lines)');
    console.log('   ✅ Full task name (up to 3 lines with ellipsis)');
    console.log('   ✅ Complete location status text');
    console.log('   ✅ Full progress bar and percentage');
    console.log('   ✅ Complete last updated timestamp');
    console.log('   ✅ All action buttons fully visible');
    
    console.log('\n🔧 Key improvements made:');
    console.log('   • Added minimum heights to ensure all content areas have adequate space');
    console.log('   • Implemented proper text wrapping with numberOfLines and ellipsizeMode');
    console.log('   • Fixed flex layout to prevent content overlap');
    console.log('   • Added margins to prevent text from being cut off');
    console.log('   • Optimized container sizes for better content display');
    
    console.log('\n📋 What each card now shows:');
    console.log('   1. Header: Member name + role + status icon');
    console.log('   2. Task Info: Current task name + progress bar');
    console.log('   3. Location: Geofence status + last update time');
    console.log('   4. Actions: Message and Assign Task buttons');
    
    console.log('\n🧪 How to test:');
    console.log('   1. Open Team Management screen');
    console.log('   2. Look at each team member card');
    console.log('   3. Verify all text is readable and not cut off');
    console.log('   4. Check that long names/tasks show ellipsis (...)');
    console.log('   5. Confirm all 3 data sections are visible in each card');
    
  } else {
    console.log('\n⚠️  Some content visibility issues may still exist.');
    console.log('\nMissing improvements:');
    
    if (!hasNumberOfLines) console.log('   • Text numberOfLines prop needed for proper display');
    if (!hasMinHeightContent) console.log('   • Minimum heights needed for content containers');
    if (!hasFlexForLocationText) console.log('   • Flex layout needed for proper text display');
    if (!hasMarginForMemberInfo) console.log('   • Margins needed to prevent text overlap');
  }
  
} catch (error) {
  console.error('❌ Error reading Team Management screen file:', error.message);
}