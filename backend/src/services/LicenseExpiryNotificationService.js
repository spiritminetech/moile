// License Expiry Notification Service
// Sends alerts to drivers, admins, and managers about expiring licenses

import Employee from '../modules/employee/Employee.js';
import User from '../modules/user/User.js';
import { sendNotification } from '../modules/notification/services/NotificationService.js';

/**
 * Check for expiring licenses and send notifications
 * Should be run daily via cron job
 */
export const checkExpiringLicenses = async () => {
  try {
    console.log('🔍 Checking for expiring driver licenses...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for licenses expiring in 30, 14, 7, and 1 days
    const checkDays = [30, 14, 7, 1];
    
    for (const days of checkDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      
      // Find drivers with licenses expiring on target date
      const driversWithExpiringLicenses = await Employee.find({
        licenseExpiry: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        },
        status: 'ACTIVE'
      }).lean();

      console.log(`📋 Found ${driversWithExpiringLicenses.length} licenses expiring in ${days} days`);

      for (const driver of driversWithExpiringLicenses) {
        await sendLicenseExpiryNotifications(driver, days);
      }
    }

    // Check for already expired licenses
    const driversWithExpiredLicenses = await Employee.find({
      licenseExpiry: { $lt: today },
      status: 'ACTIVE'
    }).lean();

    console.log(`⚠️ Found ${driversWithExpiredLicenses.length} drivers with expired licenses`);

    for (const driver of driversWithExpiredLicenses) {
      await sendExpiredLicenseNotifications(driver);
    }

    console.log('✅ License expiry check completed');

  } catch (error) {
    console.error('❌ Error checking expiring licenses:', error);
    throw error;
  }
};

/**
 * Send notifications for expiring license
 */
const sendLicenseExpiryNotifications = async (driver, daysUntilExpiry) => {
  try {
    const expiryDate = new Date(driver.licenseExpiry);
    const formattedDate = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Determine urgency level
    let urgency = 'info';
    if (daysUntilExpiry <= 7) urgency = 'urgent';
    else if (daysUntilExpiry <= 14) urgency = 'warning';

    // Notification to driver
    const driverUser = await User.findOne({ id: driver.id });
    if (driverUser) {
      await sendNotification({
        userId: driver.id,
        companyId: driver.companyId,
        type: 'LICENSE_EXPIRY_WARNING',
        title: `⚠️ License Expiring in ${daysUntilExpiry} Days`,
        message: `Your driving license (${driver.drivingLicenseNumber || 'N/A'}) will expire on ${formattedDate}. Please renew it before expiry to continue transport operations.`,
        priority: urgency,
        data: {
          driverId: driver.id,
          licenseNumber: driver.drivingLicenseNumber,
          expiryDate: driver.licenseExpiry,
          daysUntilExpiry
        }
      });
    }

    // Notification to company admins
    const admins = await User.find({
      companyId: driver.companyId,
      role: { $in: ['ADMIN', 'SUPER_ADMIN'] }
    });

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        companyId: driver.companyId,
        type: 'DRIVER_LICENSE_EXPIRY_ALERT',
        title: `Driver License Expiring Soon`,
        message: `Driver ${driver.fullName} (ID: ${driver.employeeCode || driver.id}) has a license expiring in ${daysUntilExpiry} days (${formattedDate}).`,
        priority: urgency,
        data: {
          driverId: driver.id,
          driverName: driver.fullName,
          licenseNumber: driver.drivingLicenseNumber,
          expiryDate: driver.licenseExpiry,
          daysUntilExpiry
        }
      });
    }

    // Notification to fleet managers (if critical - 7 days or less)
    if (daysUntilExpiry <= 7) {
      const managers = await User.find({
        companyId: driver.companyId,
        role: 'MANAGER'
      });

      for (const manager of managers) {
        await sendNotification({
          userId: manager.id,
          companyId: driver.companyId,
          type: 'CRITICAL_LICENSE_EXPIRY',
          title: `🚨 Critical: Driver License Expiring`,
          message: `URGENT: Driver ${driver.fullName} license expires in ${daysUntilExpiry} days. Immediate action required.`,
          priority: 'urgent',
          data: {
            driverId: driver.id,
            driverName: driver.fullName,
            licenseNumber: driver.drivingLicenseNumber,
            expiryDate: driver.licenseExpiry,
            daysUntilExpiry
          }
        });
      }
    }

    console.log(`✅ Sent expiry notifications for driver ${driver.id} (${daysUntilExpiry} days)`);

  } catch (error) {
    console.error(`❌ Error sending expiry notifications for driver ${driver.id}:`, error);
  }
};

/**
 * Send notifications for expired license
 */
const sendExpiredLicenseNotifications = async (driver) => {
  try {
    const expiryDate = new Date(driver.licenseExpiry);
    const daysExpired = Math.floor((new Date() - expiryDate) / (1000 * 60 * 60 * 24));

    // Notification to driver
    const driverUser = await User.findOne({ id: driver.id });
    if (driverUser) {
      await sendNotification({
        userId: driver.id,
        companyId: driver.companyId,
        type: 'LICENSE_EXPIRED',
        title: `🚫 License EXPIRED`,
        message: `Your driving license expired ${daysExpired} days ago. You cannot be assigned transport tasks until your license is renewed.`,
        priority: 'urgent',
        data: {
          driverId: driver.id,
          licenseNumber: driver.drivingLicenseNumber,
          expiryDate: driver.licenseExpiry,
          daysExpired
        }
      });
    }

    // Notification to admins
    const admins = await User.find({
      companyId: driver.companyId,
      role: { $in: ['ADMIN', 'SUPER_ADMIN'] }
    });

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        companyId: driver.companyId,
        type: 'DRIVER_LICENSE_EXPIRED_ALERT',
        title: `🚫 Driver License EXPIRED`,
        message: `Driver ${driver.fullName} (ID: ${driver.employeeCode || driver.id}) has an EXPIRED license (expired ${daysExpired} days ago). Cannot assign transport tasks.`,
        priority: 'urgent',
        data: {
          driverId: driver.id,
          driverName: driver.fullName,
          licenseNumber: driver.drivingLicenseNumber,
          expiryDate: driver.licenseExpiry,
          daysExpired
        }
      });
    }

    console.log(`✅ Sent expired license notifications for driver ${driver.id}`);

  } catch (error) {
    console.error(`❌ Error sending expired notifications for driver ${driver.id}:`, error);
  }
};

/**
 * Check single driver's license status
 * Used when assigning tasks
 */
export const checkDriverLicenseStatus = async (driverId) => {
  try {
    const driver = await Employee.findOne({ id: driverId });
    
    if (!driver) {
      return {
        valid: false,
        reason: 'Driver not found'
      };
    }

    if (!driver.licenseExpiry) {
      return {
        valid: false,
        reason: 'No license expiry date on record'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const licenseExpiry = new Date(driver.licenseExpiry);
    licenseExpiry.setHours(0, 0, 0, 0);

    if (licenseExpiry < today) {
      const daysExpired = Math.floor((today - licenseExpiry) / (1000 * 60 * 60 * 24));
      return {
        valid: false,
        reason: `License expired ${daysExpired} days ago`,
        expiryDate: driver.licenseExpiry,
        daysExpired
      };
    }

    const daysUntilExpiry = Math.floor((licenseExpiry - today) / (1000 * 60 * 60 * 24));
    
    return {
      valid: true,
      expiryDate: driver.licenseExpiry,
      daysUntilExpiry,
      warning: daysUntilExpiry <= 30 ? `License expires in ${daysUntilExpiry} days` : null
    };

  } catch (error) {
    console.error(`❌ Error checking driver license status:`, error);
    return {
      valid: false,
      reason: 'Error checking license status'
    };
  }
};

export default {
  checkExpiringLicenses,
  checkDriverLicenseStatus
};
