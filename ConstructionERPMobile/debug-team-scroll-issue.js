// Debug script to identify the exact scrolling issue in Team Management
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Team Management Scrolling Issue...\n');

// Check the main App.tsx to see if there are any global layout constraints
const appPath = path.join(__dirname, 'App.tsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  console.log('📱 App.tsx Analysis:');
  
  const hasSafeAreaView = appContent.includes('SafeAreaView');
  const hasStatusBar = appContent.includes('StatusBar');
  const hasKeyboardAvoidingView = appContent.includes('KeyboardAvoidingView');
  
  console.log(`   SafeAreaView: ${hasSafeAreaView ? '✓' : '✗'}`);
  console.log(`   StatusBar: ${hasStatusBar ? '✓' : '✗'}`);
  console.log(`   KeyboardAvoidingView: ${hasKeyboardAvoidingView ? '✓' : '✗'}`);
}

// Check the theme file for any layout constraints
const themePath = path.join(__dirname, 'src/utils/theme/constructionTheme.js');
const themePathTs = path.join(__dirname, 'src/utils/theme/constructionTheme.ts');

let themeContent = '';
if (fs.existsSync(themePath)) {
  themeContent = fs.readFileSync(themePath, 'utf8');
} else if (fs.existsSync(themePathTs)) {
  themeContent = fs.readFileSync(themePathTs, 'utf8');
}

if (themeContent) {
  console.log('\n🎨 Theme Analysis:');
  
  const hasButtonDimensions = themeContent.includes('buttonSmall');
  const hasSpacingXXL = themeContent.includes('xxl');
  
  console.log(`   Button Dimensions Defined: ${hasButtonDimensions ? '✓' : '✗'}`);
  console.log(`   XXL Spacing Available: ${hasSpacingXXL ? '✓' : '✗'}`);
}

// Analyze the Team Management screen structure
const teamManagementPath = path.join(__dirname, 'src/screens/supervisor/TeamManagementScreen.tsx');
const content = fs.readFileSync(teamManagementPath, 'utf8');

console.log('\n📋 Team Management Screen Analysis:');

// Check for proper component structure
const headerOutsideScroll = content.includes('Header - Fixed at top') && 
                           content.includes('Scrollable Content');

const scrollViewConfig = content.includes('showsVerticalScrollIndicator={true}') &&
                        content.includes('bounces={true}') &&
                        content.includes('alwaysBounceVertical={true}');

const properPadding = content.includes('paddingBottom: ConstructionTheme.spacing.xxl');

console.log(`   Header Outside ScrollView: ${headerOutsideScroll ? '✓' : '✗'}`);
console.log(`   ScrollView Properly Configured: ${scrollViewConfig ? '✓' : '✗'}`);
console.log(`   Extra Bottom Padding: ${properPadding ? '✓' : '✗'}`);

// Check for team member rendering
const teamMemberMapping = content.includes('filteredAndSortedMembers.map');
const memberCardStructure = content.includes('memberCard') && content.includes('TouchableOpacity');

console.log(`   Team Members Mapped: ${teamMemberMapping ? '✓' : '✗'}`);
console.log(`   Member Cards Structure: ${memberCardStructure ? '✓' : '✗'}`);

// Check for potential layout issues
const hasFlexIssues = content.includes('flex: 1') && content.includes('flexGrow: 1');
const hasProperMargins = content.includes('marginBottom: ConstructionTheme.spacing.md');

console.log(`   Proper Flex Layout: ${hasFlexIssues ? '✓' : '✗'}`);
console.log(`   Adequate Card Margins: ${hasProperMargins ? '✓' : '✗'}`);

console.log('\n🔧 Recommended Solutions:');

if (!headerOutsideScroll) {
  console.log('   ❌ Move header outside ScrollView to prevent layout conflicts');
}

if (!properPadding) {
  console.log('   ❌ Add extra bottom padding to ensure last item is visible');
}

if (!scrollViewConfig) {
  console.log('   ❌ Enable proper ScrollView configuration for better scrolling');
}

console.log('\n📱 Testing Instructions:');
console.log('1. Open the Team Management screen');
console.log('2. Check if you can see the team summary (4 boxes with numbers)');
console.log('3. Try scrolling down to see team member cards');
console.log('4. Verify that the third team member card is fully visible when scrolled');
console.log('5. Check if pull-to-refresh works properly');

console.log('\n💡 If scrolling still doesn\'t work:');
console.log('   • Check if the parent navigator has height constraints');
console.log('   • Verify that the device has enough team members to require scrolling');
console.log('   • Test on different screen sizes');
console.log('   • Check for any global styles affecting the layout');