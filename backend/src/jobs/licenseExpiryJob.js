// Cron Job for License Expiry Checks
// Runs daily to check for expiring driver licenses

import cron from 'node-cron';
import { checkExpiringLicenses } from '../services/LicenseExpiryNotificationService.js';

/**
 * Schedule daily license expiry check
 * Runs every day at 8:00 AM
 */
export const scheduleLicenseExpiryCheck = () => {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running scheduled license expiry check...');
    try {
      await checkExpiringLicenses();
      console.log('✅ Scheduled license expiry check completed');
    } catch (error) {
      console.error('❌ Error in scheduled license expiry check:', error);
    }
  }, {
    timezone: "Asia/Dubai" // Adjust to your timezone
  });

  console.log('✅ License expiry check job scheduled (daily at 8:00 AM)');
};

/**
 * Run license check immediately (for testing)
 */
export const runLicenseCheckNow = async () => {
  console.log('🔄 Running immediate license expiry check...');
  try {
    await checkExpiringLicenses();
    console.log('✅ Immediate license expiry check completed');
  } catch (error) {
    console.error('❌ Error in immediate license expiry check:', error);
    throw error;
  }
};

export default {
  scheduleLicenseExpiryCheck,
  runLicenseCheckNow
};
