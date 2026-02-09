import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

// Test credentials
const SUPERVISOR_EMAIL = 'supervisor@gmail.com';
const SUPERVISOR_PASSWORD = 'password123';

async function testTimezoneFix() {
    try {
        console.log('🔐 Logging in as supervisor...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: SUPERVISOR_EMAIL,
            password: SUPERVISOR_PASSWORD
        });

        const token = loginResponse.data.token;
        const projectId = 1003;

        console.log('✅ Login successful');
        console.log('📅 Current date:', new Date().toISOString());
        console.log('📅 Current local date:', new Date().toLocaleString());

        // Submit a daily progress report
        console.log('\n📊 Submitting daily progress report...');
        const submitResponse = await axios.post(
            `${BASE_URL}/supervisor/daily-progress`,
            {
                projectId,
                remarks: `Test report - ${new Date().toLocaleString()}`,
                issues: '',
                overallProgress: 75
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('✅ Report submitted successfully');
        console.log('📋 Report ID:', submitResponse.data.dailyProgress.id);
        console.log('📅 Report date (stored):', submitResponse.data.dailyProgress.date);
        console.log('📅 Report submittedAt:', submitResponse.data.dailyProgress.submittedAt);

        // Verify the date is correct
        const storedDate = new Date(submitResponse.data.dailyProgress.date);
        const today = new Date();
        
        console.log('\n🔍 Verification:');
        console.log('Stored date (UTC):', storedDate.toISOString());
        console.log('Today (UTC):', today.toISOString());
        console.log('Stored date (local):', storedDate.toLocaleDateString());
        console.log('Today (local):', today.toLocaleDateString());

        // Check if dates match (comparing just the date part)
        const storedDateStr = storedDate.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];

        if (storedDateStr === todayStr) {
            console.log('\n✅ SUCCESS! Date is stored correctly as today:', todayStr);
        } else {
            console.log('\n❌ FAILED! Date mismatch:');
            console.log('   Expected:', todayStr);
            console.log('   Got:', storedDateStr);
        }

        // Fetch the reports to verify it appears in the list
        console.log('\n📋 Fetching reports...');
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
        
        // Find today's report
        const todayReports = reportsResponse.data.data.filter(report => {
            const reportDate = new Date(report.date).toISOString().split('T')[0];
            return reportDate === todayStr;
        });

        console.log('📊 Reports for today:', todayReports.length);
        if (todayReports.length > 0) {
            console.log('✅ Today\'s report is visible in the list!');
            todayReports.forEach(report => {
                console.log(`   - Report ID ${report.id}: ${report.remarks}`);
            });
        } else {
            console.log('⚠️  No reports found for today in the list');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testTimezoneFix();
