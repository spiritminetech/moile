import NotificationService from './NotificationService.js';
import Employee from '../../employee/Employee.js';
import LeaveRequest from '../../leaveRequest/models/LeaveRequest.js';
import LeaveApproval from '../../leaveRequest/models/LeaveApproval.js';

/**
 * ApprovalStatusNotificationService
 * Handles approval status notification triggers for worker mobile notifications
 * Implements Requirements 4.1, 4.2, 4.3, 4.4 (leave requests, payment requests, material requests)
 */
class ApprovalStatusNotificationService {
  constructor() {
    this.notificationService = NotificationService;
  }

  /**
   * Send notification when leave requests are approved or rejected
   * Implements Requirement 4.1: Leave request status notifications within 1 hour
   * @param {number} leaveRequestId - Leave request ID
   * @param {string} status - 'APPROVED' or 'REJECTED'
   * @param {number} approverId - ID of approver
   * @param {string} remarks - Optional remarks for rejection
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyLeaveRequestStatus(leaveRequestId, status, approverId, remarks = null) {
    try {
      // Get leave request details
      const leaveRequest = await LeaveRequest.findOne({ id: leaveRequestId });
      if (!leaveRequest) {
        throw new Error(`Leave request with ID ${leaveRequestId} not found`);
      }

      // Get worker and approver information
      const [worker, approver] = await Promise.all([
        Employee.findOne({ id: leaveRequest.employeeId }),
        Employee.findOne({ id: approverId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${leaveRequest.employeeId} not found`);
      }

      // Create notification content based on status
      let title, message;
      if (status === 'APPROVED') {
        title = 'Leave Request Approved';
        message = `Your ${leaveRequest.leaveType.toLowerCase()} leave request from ${new Date(leaveRequest.fromDate).toLocaleDateString()} to ${new Date(leaveRequest.toDate).toLocaleDateString()} has been approved.`;
      } else if (status === 'REJECTED') {
        title = 'Leave Request Rejected';
        message = `Your ${leaveRequest.leaveType.toLowerCase()} leave request from ${new Date(leaveRequest.fromDate).toLocaleDateString()} to ${new Date(leaveRequest.toDate).toLocaleDateString()} has been rejected.`;
        if (remarks) {
          message += ` Reason: ${remarks}`;
        }
      } else {
        throw new Error(`Invalid leave request status: ${status}`);
      }

      const approverContact = approver ? {
        name: approver.fullName,
        phone: approver.phone || 'N/A',
        email: approver.email || 'N/A'
      } : {
        name: 'Approver',
        phone: 'N/A',
        email: 'N/A'
      };

      // Prepare action data with required fields (Requirement 4.1)
      const actionData = {
        referenceNumber: `LR-${leaveRequestId}`,
        approvalType: 'LEAVE_REQUEST',
        status: status,
        leaveType: leaveRequest.leaveType,
        fromDate: leaveRequest.fromDate,
        toDate: leaveRequest.toDate,
        totalDays: Math.ceil((new Date(leaveRequest.toDate) - new Date(leaveRequest.fromDate)) / (1000 * 60 * 60 * 24)) + 1,
        approverContact: approverContact,
        remarks: remarks,
        nextSteps: status === 'APPROVED' 
          ? 'Your leave has been approved. Please coordinate with your supervisor for work handover.'
          : 'Please contact your supervisor if you need to discuss this decision or submit a new request.',
        actionUrl: '/worker/leave-requests'
      };

      // Determine priority based on status
      const priority = status === 'REJECTED' ? 'HIGH' : 'NORMAL';

      // Create notification
      const notificationResult = await this.notificationService.createNotification({
        type: 'APPROVAL_STATUS',
        priority: priority,
        title: title,
        message: message,
        senderId: approverId,
        recipients: [leaveRequest.employeeId],
        actionData: actionData,
        requiresAcknowledgment: status === 'REJECTED', // Require acknowledgment for rejections
        language: 'en'
      });

      return {
        success: true,
        message: `Leave request ${status.toLowerCase()} notification sent`,
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in ApprovalStatusNotificationService.notifyLeaveRequestStatus:', error);
      throw error;
    }
  }

  /**
   * Send notification when advance payment requests change status
   * Implements Requirement 4.2: Payment request status notifications with approval details
   * @param {number} paymentRequestId - Payment request ID
   * @param {string} status - 'APPROVED' or 'REJECTED'
   * @param {number} approverId - ID of approver
   * @param {Object} paymentDetails - Payment request details
   * @param {string} remarks - Optional remarks
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyPaymentRequestStatus(paymentRequestId, status, approverId, paymentDetails, remarks = null) {
    try {
      // Get worker and approver information
      const [worker, approver] = await Promise.all([
        Employee.findOne({ id: paymentDetails.employeeId }),
        Employee.findOne({ id: approverId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${paymentDetails.employeeId} not found`);
      }

      // Create notification content based on status
      let title, message;
      if (status === 'APPROVED') {
        title = 'Payment Request Approved';
        message = `Your advance payment request of $${paymentDetails.amount} has been approved. Payment will be processed within 3-5 business days.`;
      } else if (status === 'REJECTED') {
        title = 'Payment Request Rejected';
        message = `Your advance payment request of $${paymentDetails.amount} has been rejected.`;
        if (remarks) {
          message += ` Reason: ${remarks}`;
        }
      } else {
        throw new Error(`Invalid payment request status: ${status}`);
      }

      const approverContact = approver ? {
        name: approver.fullName,
        phone: approver.phone || 'N/A',
        email: approver.email || 'N/A'
      } : {
        name: 'Approver',
        phone: 'N/A',
        email: 'N/A'
      };

      // Prepare action data with required fields (Requirement 4.2)
      const actionData = {
        referenceNumber: `PR-${paymentRequestId}`,
        approvalType: 'PAYMENT_REQUEST',
        status: status,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || 'SGD',
        requestType: paymentDetails.requestType || 'ADVANCE_PAYMENT',
        approverContact: approverContact,
        remarks: remarks,
        paymentTimeline: status === 'APPROVED' ? '3-5 business days' : null,
        nextSteps: status === 'APPROVED' 
          ? 'Payment will be processed and credited to your account within 3-5 business days. You will receive a confirmation once processed.'
          : 'Please contact HR or your supervisor if you need to discuss this decision or submit a new request.',
        actionUrl: '/worker/payment-requests'
      };

      // Determine priority based on status
      const priority = status === 'REJECTED' ? 'HIGH' : 'NORMAL';

      // Create notification
      const notificationResult = await this.notificationService.createNotification({
        type: 'APPROVAL_STATUS',
        priority: priority,
        title: title,
        message: message,
        senderId: approverId,
        recipients: [paymentDetails.employeeId],
        actionData: actionData,
        requiresAcknowledgment: status === 'REJECTED', // Require acknowledgment for rejections
        language: 'en'
      });

      return {
        success: true,
        message: `Payment request ${status.toLowerCase()} notification sent`,
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in ApprovalStatusNotificationService.notifyPaymentRequestStatus:', error);
      throw error;
    }
  }

  /**
   * Send notification when medical reimbursement claims are processed
   * Implements Requirement 4.3: Medical reimbursement status notifications with payment timeline
   * @param {number} claimId - Medical claim ID
   * @param {string} status - 'APPROVED' or 'REJECTED'
   * @param {number} approverId - ID of approver
   * @param {Object} claimDetails - Medical claim details
   * @param {string} remarks - Optional remarks
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyMedicalClaimStatus(claimId, status, approverId, claimDetails, remarks = null) {
    try {
      // Get worker and approver information
      const [worker, approver] = await Promise.all([
        Employee.findOne({ id: claimDetails.employeeId }),
        Employee.findOne({ id: approverId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${claimDetails.employeeId} not found`);
      }

      // Create notification content based on status
      let title, message;
      if (status === 'APPROVED') {
        title = 'Medical Claim Approved';
        message = `Your medical reimbursement claim of $${claimDetails.claimAmount} has been approved. Reimbursement will be processed with your next payroll.`;
      } else if (status === 'REJECTED') {
        title = 'Medical Claim Rejected';
        message = `Your medical reimbursement claim of $${claimDetails.claimAmount} has been rejected.`;
        if (remarks) {
          message += ` Reason: ${remarks}`;
        }
      } else {
        throw new Error(`Invalid medical claim status: ${status}`);
      }

      const approverContact = approver ? {
        name: approver.fullName,
        phone: approver.phone || 'N/A',
        email: approver.email || 'N/A'
      } : {
        name: 'Approver',
        phone: 'N/A',
        email: 'N/A'
      };

      // Prepare action data with required fields (Requirement 4.3)
      const actionData = {
        referenceNumber: `MC-${claimId}`,
        approvalType: 'MEDICAL_CLAIM',
        status: status,
        claimAmount: claimDetails.claimAmount,
        currency: claimDetails.currency || 'SGD',
        claimType: claimDetails.claimType || 'MEDICAL_REIMBURSEMENT',
        treatmentDate: claimDetails.treatmentDate,
        approverContact: approverContact,
        remarks: remarks,
        paymentTimeline: status === 'APPROVED' ? 'Next payroll cycle' : null,
        nextSteps: status === 'APPROVED' 
          ? 'Reimbursement will be included in your next payroll. You will see it reflected in your pay slip.'
          : 'Please contact HR if you need to discuss this decision or submit additional documentation.',
        actionUrl: '/worker/medical-claims'
      };

      // Determine priority based on status
      const priority = status === 'REJECTED' ? 'HIGH' : 'NORMAL';

      // Create notification
      const notificationResult = await this.notificationService.createNotification({
        type: 'APPROVAL_STATUS',
        priority: priority,
        title: title,
        message: message,
        senderId: approverId,
        recipients: [claimDetails.employeeId],
        actionData: actionData,
        requiresAcknowledgment: status === 'REJECTED', // Require acknowledgment for rejections
        language: 'en'
      });

      return {
        success: true,
        message: `Medical claim ${status.toLowerCase()} notification sent`,
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in ApprovalStatusNotificationService.notifyMedicalClaimStatus:', error);
      throw error;
    }
  }

  /**
   * Send notification when material and tool requests are approved
   * Implements Requirement 4.4: Material request approval notifications with pickup instructions
   * @param {number} requestId - Material/tool request ID
   * @param {string} status - 'APPROVED' or 'REJECTED'
   * @param {number} approverId - ID of approver
   * @param {Object} requestDetails - Request details
   * @param {string} remarks - Optional remarks
   * @returns {Promise<Object>} Notification creation result
   */
  async notifyMaterialRequestStatus(requestId, status, approverId, requestDetails, remarks = null) {
    try {
      // Get worker and approver information
      const [worker, approver] = await Promise.all([
        Employee.findOne({ id: requestDetails.employeeId }),
        Employee.findOne({ id: approverId })
      ]);

      if (!worker) {
        throw new Error(`Worker with ID ${requestDetails.employeeId} not found`);
      }

      // Create notification content based on status
      let title, message;
      const itemType = requestDetails.requestType === 'MATERIAL' ? 'material' : 'tool';
      const itemName = requestDetails.itemName || 'requested item';
      const quantity = requestDetails.quantity || 1;

      if (status === 'APPROVED') {
        title = `${requestDetails.requestType === 'MATERIAL' ? 'Material' : 'Tool'} Request Approved`;
        message = `Your request for ${quantity} ${itemName} has been approved. Please collect from the designated pickup location.`;
      } else if (status === 'REJECTED') {
        title = `${requestDetails.requestType === 'MATERIAL' ? 'Material' : 'Tool'} Request Rejected`;
        message = `Your request for ${quantity} ${itemName} has been rejected.`;
        if (remarks) {
          message += ` Reason: ${remarks}`;
        }
      } else {
        throw new Error(`Invalid material request status: ${status}`);
      }

      const approverContact = approver ? {
        name: approver.fullName,
        phone: approver.phone || 'N/A',
        email: approver.email || 'N/A'
      } : {
        name: 'Approver',
        phone: 'N/A',
        email: 'N/A'
      };

      // Prepare action data with required fields (Requirement 4.4)
      const actionData = {
        referenceNumber: `${requestDetails.requestType === 'MATERIAL' ? 'MR' : 'TR'}-${requestId}`,
        approvalType: requestDetails.requestType === 'MATERIAL' ? 'MATERIAL_REQUEST' : 'TOOL_REQUEST',
        status: status,
        itemName: requestDetails.itemName,
        quantity: requestDetails.quantity,
        unit: requestDetails.unit || 'pieces',
        requestType: requestDetails.requestType,
        projectId: requestDetails.projectId,
        approverContact: approverContact,
        remarks: remarks,
        pickupLocation: status === 'APPROVED' ? (requestDetails.pickupLocation || 'Site storage area') : null,
        pickupInstructions: status === 'APPROVED' ? (requestDetails.pickupInstructions || 'Contact site supervisor for collection') : null,
        nextSteps: status === 'APPROVED' 
          ? `Please collect your ${itemType} from ${requestDetails.pickupLocation || 'the site storage area'}. Contact your supervisor for specific pickup instructions and timing.`
          : 'Please contact your supervisor if you need to discuss this decision or submit a new request with additional justification.',
        actionUrl: '/worker/material-requests'
      };

      // Determine priority based on status
      const priority = status === 'REJECTED' ? 'HIGH' : 'NORMAL';

      // Create notification
      const notificationResult = await this.notificationService.createNotification({
        type: 'APPROVAL_STATUS',
        priority: priority,
        title: title,
        message: message,
        senderId: approverId,
        recipients: [requestDetails.employeeId],
        actionData: actionData,
        requiresAcknowledgment: status === 'REJECTED', // Require acknowledgment for rejections
        language: 'en'
      });

      return {
        success: true,
        message: `${requestDetails.requestType === 'MATERIAL' ? 'Material' : 'Tool'} request ${status.toLowerCase()} notification sent`,
        notificationResult: notificationResult
      };

    } catch (error) {
      console.error('❌ Error in ApprovalStatusNotificationService.notifyMaterialRequestStatus:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple approval status notifications
   * Useful for bulk approval processing
   * @param {Array} notifications - Array of notification requests
   * @returns {Promise<Array>} Results of batch processing
   */
  async batchNotifyApprovalStatus(notifications) {
    const results = [];
    
    for (const notificationRequest of notifications) {
      try {
        let result;
        
        switch (notificationRequest.approvalType) {
          case 'LEAVE_REQUEST':
            result = await this.notifyLeaveRequestStatus(
              notificationRequest.requestId,
              notificationRequest.status,
              notificationRequest.approverId,
              notificationRequest.remarks
            );
            break;
            
          case 'PAYMENT_REQUEST':
            result = await this.notifyPaymentRequestStatus(
              notificationRequest.requestId,
              notificationRequest.status,
              notificationRequest.approverId,
              notificationRequest.paymentDetails,
              notificationRequest.remarks
            );
            break;
            
          case 'MEDICAL_CLAIM':
            result = await this.notifyMedicalClaimStatus(
              notificationRequest.requestId,
              notificationRequest.status,
              notificationRequest.approverId,
              notificationRequest.claimDetails,
              notificationRequest.remarks
            );
            break;
            
          case 'MATERIAL_REQUEST':
          case 'TOOL_REQUEST':
            result = await this.notifyMaterialRequestStatus(
              notificationRequest.requestId,
              notificationRequest.status,
              notificationRequest.approverId,
              notificationRequest.requestDetails,
              notificationRequest.remarks
            );
            break;
            
          default:
            throw new Error(`Unknown approval type: ${notificationRequest.approvalType}`);
        }
        
        results.push({ ...notificationRequest, result, success: true });
      } catch (error) {
        console.error(`❌ Batch approval notification failed for ${notificationRequest.approvalType}:`, error);
        results.push({ ...notificationRequest, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Helper method to integrate with existing leave request approval workflow
   * This can be called from the leave request controller when status changes
   * @param {number} leaveRequestId - Leave request ID
   * @param {string} newStatus - New status
   * @param {number} approverId - Approver ID
   * @param {string} remarks - Optional remarks
   * @returns {Promise<Object>} Notification result
   */
  async handleLeaveRequestStatusChange(leaveRequestId, newStatus, approverId, remarks = null) {
    try {
      // Only send notifications for final status changes
      if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
        return await this.notifyLeaveRequestStatus(leaveRequestId, newStatus, approverId, remarks);
      }
      
      return {
        success: false,
        message: `No notification sent for status: ${newStatus}`
      };
    } catch (error) {
      console.error('❌ Error in ApprovalStatusNotificationService.handleLeaveRequestStatusChange:', error);
      throw error;
    }
  }
}

export default new ApprovalStatusNotificationService();