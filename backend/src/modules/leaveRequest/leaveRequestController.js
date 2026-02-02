import LeaveRequest from './models/LeaveRequest.js';
import LeaveRequestDocument from './models/LeaveRequestDocument.js';
import LeaveApproval from './models/LeaveApproval.js';
import Notification from './models/Notification.js';
import Employee from '../employee/Employee.js';
import ApprovalStatusNotificationService from '../notification/services/ApprovalStatusNotificationService.js';


/* ===============================
   4.1 Raise Leave Request (Worker)
================================ */
export const raiseLeaveRequest = async (req, res) => {
    try {
        const userId = req.user.id; // from auth middleware
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            leaveType,
            fromDate,
            toDate,
            reason
        } = req.body;

        const leaveRequest = await LeaveRequest.create({
            id: Date.now(),
            companyId: employee.companyId,
            employeeId: employee.id,
            leaveType,
            fromDate,
            toDate,
            reason,
            createdBy: userId,
            status: 'PENDING'
        });

        /* Save documents */
        if (req.files && req.files.length > 0) {
            const docs = req.files.map(file => ({
                leaveRequestId: leaveRequest.id,
                documentType: 'SUPPORTING_DOC',
                filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
                uploadedBy: userId
            }));

            try {
                const savedDocs = await LeaveRequestDocument.insertMany(docs);
                // console.log('Documents saved:', savedDocs);
            } catch (err) {
                console.error('Error saving documents:', err);
                return res.status(500).json({ message: 'Failed to save uploaded documents' });
            }
        }

        /* Create approval record (Supervisor – demo) */
        await LeaveApproval.create({
            leaveRequestId: leaveRequest.id,
            approverRole: 'SUPERVISOR',
            action: 'PENDING'
        });

        res.status(201).json({
            message: 'Leave request submitted successfully',
            leaveRequestId: leaveRequest.id
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   View My Requests (Worker)
================================ */
export const getMyLeaveRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        const requests = await LeaveRequest.find({
            employeeId: employee.id
        }).sort({ requestedAt: -1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   4.2 Pending Requests (Supervisor)
================================ */
export const getPendingLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest.find({ status: 'PENDING' });

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
   Approve Leave
================================ */
export const approveLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Get the leave request to find the employee
        const leaveRequest = await LeaveRequest.findOne({ id });
        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        await LeaveRequest.findOneAndUpdate(
            { id },
            { status: 'APPROVED', currentApproverId: userId }
        );

        await LeaveApproval.findOneAndUpdate(
            { leaveRequestId: id },
            { action: 'APPROVED', approverId: userId, actionAt: new Date() }
        );

        await Notification.create({
            recipientUserId: userId,
            referenceType: 'LEAVE_REQUEST',
            referenceId: id,
            title: 'Leave Approved',
            message: 'Your leave request has been approved'
        });

        // Send approval notification to worker
        try {
            await ApprovalStatusNotificationService.notifyLeaveRequestStatus(
                parseInt(id),
                'APPROVED',
                userId
            );
        } catch (notificationError) {
            console.error('❌ Error sending leave approval notification:', notificationError);
            // Don't fail the approval if notification fails
        }

        res.json({ message: 'Leave approved successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Reject Leave
================================ */
export const rejectLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const userId = req.user.id;

        // Get the leave request to find the employee
        const leaveRequest = await LeaveRequest.findOne({ id });
        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        await LeaveRequest.findOneAndUpdate(
            { id },
            { status: 'REJECTED', currentApproverId: userId }
        );

        await LeaveApproval.findOneAndUpdate(
            { leaveRequestId: id },
            { action: 'REJECTED', remarks, approverId: userId, actionAt: new Date() }
        );

        // Send rejection notification to worker
        try {
            await ApprovalStatusNotificationService.notifyLeaveRequestStatus(
                parseInt(id),
                'REJECTED',
                userId,
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending leave rejection notification:', notificationError);
            // Don't fail the rejection if notification fails
        }

        res.json({ message: 'Leave rejected' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
