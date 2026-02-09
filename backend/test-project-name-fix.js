import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

// Test credentials
const SUPERVISOR_EMAIL = 'supervisor@gmail.com';
const SUPERVISOR_PASSWORD = 'password123';

async function testProjectNameFix() {
    try {
        console.log('🔐 Logging in as supervisor...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: SUPERVISOR_EMAIL,
            password: SUPERVISOR_PASSWORD
        });

        const token = loginResponse.data.token;
        const projectId = 1003;

        console.log('✅ Login successful\n');

        // Fetch the reports to check project names
        console.log('📋 Fetching daily progress reports...');
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
        const toDate = new Date();

        const reportsResponse = await axios.get(
            `${BASE_URL}/supervisor/daily-progress/${projectId}`,
            {
                params: {
                    from: fromDate.toISOString().split('T')[0],
                    to: toDate.toISOString().split('T')[0]
                },
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('✅ Fetched', reportsResponse.data.count, 'reports');
        console.log('📊 Project ID:', reportsResponse.data.projectId);
        console.log('📝 Project Name:', reportsResponse.data.projectName);
        
        console.log('\n📋 Sample Reports:');
        reportsResponse.data.data.slice(0, 5).forEach((report, index) => {
            console.log(`\n${index + 1}. Report ID: ${report.id}`);
            console.log(`   Date: ${new Date(report.date).toLocaleDateString()}`);
            console.log(`   Project ID: ${report.projectId}`);
            console.log(`   Project Name: ${report.projectName || 'NOT SET'}`);
            console.log(`   Remarks: ${report.remarks}`);
        });

        // Verify project name is set
        const hasProjectName = reportsResponse.data.data.every(report => 
            report.projectName && !report.projectName.startsWith('Project ')
        );

        if (hasProjectName) {
            console.log('\n✅ SUCCESS! All reports have proper project names');
        } else {
            const withoutName = reportsResponse.data.data.filter(report => 
                !report.projectName || report.projectName.startsWith('Project ')
            );
            console.log('\n⚠️  Some reports still showing Project ID instead of name:');
            console.log(`   ${withoutName.length} out of ${reportsResponse.data.data.length} reports`);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testProjectNameFix();
