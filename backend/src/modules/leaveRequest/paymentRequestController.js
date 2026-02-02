import PaymentRequest from './models/PaymentRequest.js';
import Employee from '../employee/Employee.js';
import ApprovalStatusNotificationService from '../notification/services/ApprovalStatusNotificationService.js';

/**
 * Payment Request Controller
 * Handles payment request operations and approval workflow
 */

/* ===============================
   Create Payment Request (Worker)
================================ */
export const createPaymentRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            requestType,
            amount,
            currency = 'SGD',
            reason,
            description,
            urgency = 'NORMAL',
            paymentMethod = 'BANK_TRANSFER',
            bankDetails
        } = req.body;

        const paymentRequest = await PaymentRequest.create({
            id: Date.now(),
            companyId: employee.companyId,
            employeeId: employee.id,
            requestType,
            amount,
            currency,
            reason,
            description,
            urgency,
            paymentMethod,
            bankDetails,
            status: 'PENDING',
            createdBy: userId
        });

        res.status(201).json({
            message: 'Payment request submitted successfully',
            paymentRequestId: paymentRequest.id
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Get My Payment Requests (Worker)
================================ */
export const getMyPaymentRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        const requests = await PaymentRequest.find({
            employeeId: employee.id
        }).sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Get Pending Payment Requests (Supervisor)
================================ */
export const getPendingPaymentRequests = async (req, res) => {
    try {
        const requests = await PaymentRequest.find({ status: 'PENDING' });

        // Get all unique employee IDs
        const employeeIds = [...new Set(requests.map(r => r.employeeId).filter(Boolean))];

        // Fetch employee details
        const employees = await Employee.find({ id: { $in: employeeIds } });

        // Attach employee name to each request
        const requestsWithNames = requests.map(r => {
            const employee = employees.find(e => e.id === r.employeeId);
            return { ...r.toObject(), employeeName: employee ? employee.fullName : null };
        });

        res.json(requestsWithNames);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Approve Payment Request
================================ */
export const approvePaymentRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvedAmount, remarks } = req.body;
        const userId = req.user.id;

        // Get the payment request
        const paymentRequest = await PaymentRequest.findOne({ id });
        if (!paymentRequest) {
            return res.status(404).json({ message: 'Payment request not found' });
        }

        const finalApprovedAmount = approvedAmount || paymentRequest.amount;

        await PaymentRequest.findOneAndUpdate(
            { id },
            { 
                status: 'APPROVED', 
                approverId: userId,
                approvedAmount: finalApprovedAmount,
                approvedAt: new Date(),
                remarks: remarks
            }
        );

        // Send approval notification to worker
        try {
            await ApprovalStatusNotificationService.notifyPaymentRequestStatus(
                parseInt(id),
                'APPROVED',
                userId,
                {
                    employeeId: paymentRequest.employeeId,
                    amount: finalApprovedAmount,
                    currency: paymentRequest.currency,
                    requestType: paymentRequest.requestType
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending payment approval notification:', notificationError);
            // Don't fail the approval if notification fails
        }

        res.json({ message: 'Payment request approved successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Reject Payment Request
================================ */
export const rejectPaymentRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const userId = req.user.id;

        // Get the payment request
        const paymentRequest = await PaymentRequest.findOne({ id });
        if (!paymentRequest) {
            return res.status(404).json({ message: 'Payment request not found' });
        }

        await PaymentRequest.findOneAndUpdate(
            { id },
            { 
                status: 'REJECTED', 
                approverId: userId,
                approvedAt: new Date(),
                remarks: remarks
            }
        );

        // Send rejection notification to worker
        try {
            await ApprovalStatusNotificationService.notifyPaymentRequestStatus(
                parseInt(id),
                'REJECTED',
                userId,
                {
                    employeeId: paymentRequest.employeeId,
                    amount: paymentRequest.amount,
                    currency: paymentRequest.currency,
                    requestType: paymentRequest.requestType
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending payment rejection notification:', notificationError);
            // Don't fail the rejection if notification fails
        }

        res.json({ message: 'Payment request rejected' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Mark Payment as Processed
================================ */
export const markPaymentProcessed = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await PaymentRequest.findOneAndUpdate(
            { id },
            { 
                status: 'PROCESSED',
                processedAt: new Date()
            }
        );

        res.json({ message: 'Payment marked as processed' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};