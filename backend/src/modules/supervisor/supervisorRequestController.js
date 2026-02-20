import LeaveRequest from '../leaveRequest/models/LeaveRequest.js';
import PaymentRequest from '../leaveRequest/models/PaymentRequest.js';
import MaterialRequest from '../project/models/MaterialRequest.js';
import ProjectDailyProgress from '../project/models/ProjectDailyProgress.js';
import Employee from '../employee/Employee.js';
import Project from '../project/models/Project.js';
import ApprovalStatusNotificationService from '../notification/services/ApprovalStatusNotificationService.js';

/**
 * Supervisor Request Management Controller
 * Handles all supervisor-specific request approval operations
 */

/* ===============================
   Get Pending Leave Requests (Supervisor)
   GET /api/supervisor/pending-leave-requests
================================ */
export const getPendingLeaveRequests = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        
        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Get supervisor's projects
        const projects = await Project.find({ supervisorId: supervisor.id }).lean();
        const projectIds = projects.map(p => p.id);

        // Get employees assigned to supervisor's projects
        const employees = await Employee.find({ 
            'currentProject.id': { $in: projectIds } 
        }).lean();
        const employeeIds = employees.map(e => e.id);

        // Get pending leave requests for these employees
        const requests = await LeaveRequest.find({ 
            employeeId: { $in: employeeIds },
            status: 'PENDING' 
        }).sort({ requestedAt: -1 });

        // Attach employee and project details
        const requestsWithDetails = requests.map(r => {
            const employee = employees.find(e => e.id === r.employeeId);
            const project = projects.find(p => p.id === employee?.currentProject?.id);
            return { 
                ...r.toObject(), 
                employeeName: employee?.fullName || 'Unknown',
                employeeId: employee?.id,
                projectName: project?.projectName || 'N/A',
                projectId: project?.id
            };
        });

        res.json({
            success: true,
            count: requestsWithDetails.length,
            requests: requestsWithDetails
        });

    } catch (err) {
        console.error('❌ Error getting pending leave requests:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Approve/Reject Leave Request (Supervisor)
   POST /api/supervisor/approve-leave/:requestId
================================ */
export const approveLeaveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action, remarks } = req.body; // action: 'approve' or 'reject'
        const userId = req.user?.id || req.user?.userId;

        // Validate action
        if (!action || !['approve', 'reject'].includes(action.toLowerCase())) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"' 
            });
        }

        // Get the leave request
        const leaveRequest = await LeaveRequest.findOne({ id: requestId });
        if (!leaveRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Leave request not found' 
            });
        }

        // Check if already processed
        if (leaveRequest.status !== 'PENDING') {
            return res.status(400).json({ 
                success: false,
                message: `Leave request already ${leaveRequest.status.toLowerCase()}` 
            });
        }

        const newStatus = action.toLowerCase() === 'approve' ? 'APPROVED' : 'REJECTED';

        // Update leave request
        await LeaveRequest.findOneAndUpdate(
            { id: requestId },
            { 
                status: newStatus, 
                currentApproverId: userId,
                approvedAt: new Date(),
                remarks: remarks
            }
        );

        // Send notification to worker
        try {
            await ApprovalStatusNotificationService.notifyLeaveRequestStatus(
                parseInt(requestId),
                newStatus,
                userId,
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending leave approval notification:', notificationError);
        }

        res.json({ 
            success: true,
            message: `Leave request ${action.toLowerCase()}d successfully`,
            requestId: requestId,
            status: newStatus
        });

    } catch (err) {
        console.error('❌ Error approving/rejecting leave request:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Get Pending Advance Payment Requests (Supervisor)
   GET /api/supervisor/pending-advance-requests
================================ */
export const getPendingAdvanceRequests = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        
        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Get supervisor's projects
        const projects = await Project.find({ supervisorId: supervisor.id }).lean();
        const projectIds = projects.map(p => p.id);

        // Get employees assigned to supervisor's projects
        const employees = await Employee.find({ 
            'currentProject.id': { $in: projectIds } 
        }).lean();
        const employeeIds = employees.map(e => e.id);

        // Get pending payment requests for these employees
        const requests = await PaymentRequest.find({ 
            employeeId: { $in: employeeIds },
            status: 'PENDING' 
        }).sort({ createdAt: -1 });

        // Attach employee and project details
        const requestsWithDetails = requests.map(r => {
            const employee = employees.find(e => e.id === r.employeeId);
            const project = projects.find(p => p.id === employee?.currentProject?.id);
            return { 
                ...r.toObject(), 
                employeeName: employee?.fullName || 'Unknown',
                employeeId: employee?.id,
                projectName: project?.projectName || 'N/A',
                projectId: project?.id
            };
        });

        res.json({
            success: true,
            count: requestsWithDetails.length,
            requests: requestsWithDetails
        });

    } catch (err) {
        console.error('❌ Error getting pending advance requests:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Approve/Reject Advance Payment Request (Supervisor)
   POST /api/supervisor/approve-advance/:requestId
================================ */
export const approveAdvanceRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action, approvedAmount, remarks } = req.body; // action: 'approve' or 'reject'
        const userId = req.user?.id || req.user?.userId;

        // Validate action
        if (!action || !['approve', 'reject'].includes(action.toLowerCase())) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"' 
            });
        }

        // Get the payment request
        const paymentRequest = await PaymentRequest.findOne({ id: requestId });
        if (!paymentRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Payment request not found' 
            });
        }

        // Check if already processed
        if (paymentRequest.status !== 'PENDING') {
            return res.status(400).json({ 
                success: false,
                message: `Payment request already ${paymentRequest.status.toLowerCase()}` 
            });
        }

        const newStatus = action.toLowerCase() === 'approve' ? 'APPROVED' : 'REJECTED';
        const finalApprovedAmount = action.toLowerCase() === 'approve' 
            ? (approvedAmount || paymentRequest.amount) 
            : null;

        // Update payment request
        await PaymentRequest.findOneAndUpdate(
            { id: requestId },
            { 
                status: newStatus, 
                approverId: userId,
                approvedAmount: finalApprovedAmount,
                approvedAt: new Date(),
                remarks: remarks
            }
        );

        // Send notification to worker
        try {
            await ApprovalStatusNotificationService.notifyPaymentRequestStatus(
                parseInt(requestId),
                newStatus,
                userId,
                {
                    employeeId: paymentRequest.employeeId,
                    amount: finalApprovedAmount || paymentRequest.amount,
                    currency: paymentRequest.currency,
                    requestType: paymentRequest.requestType
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending payment approval notification:', notificationError);
        }

        res.json({ 
            success: true,
            message: `Payment request ${action.toLowerCase()}d successfully`,
            requestId: requestId,
            status: newStatus,
            approvedAmount: finalApprovedAmount
        });

    } catch (err) {
        console.error('❌ Error approving/rejecting payment request:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Get Pending Material Requests (Supervisor)
   GET /api/supervisor/pending-material-requests
================================ */
export const getPendingMaterialRequests = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        
        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Get supervisor's projects
        const projects = await Project.find({ supervisorId: supervisor.id }).lean();
        const projectIds = projects.map(p => p.id);

        // Get pending material requests for supervisor's projects (excluding tools)
        const requests = await MaterialRequest.find({ 
            projectId: { $in: projectIds },
            requestType: 'MATERIAL',
            status: 'PENDING' 
        }).sort({ createdAt: -1 });

        // Get employee details
        const employeeIds = [...new Set(requests.map(r => r.employeeId))];
        const employees = await Employee.find({ id: { $in: employeeIds } }).lean();

        // Attach employee and project details
        const requestsWithDetails = requests.map(r => {
            const employee = employees.find(e => e.id === r.employeeId);
            const project = projects.find(p => p.id === r.projectId);
            return { 
                ...r.toObject(), 
                employeeName: employee?.fullName || 'Unknown',
                projectName: project?.projectName || 'N/A'
            };
        });

        res.json({
            success: true,
            count: requestsWithDetails.length,
            requests: requestsWithDetails
        });

    } catch (err) {
        console.error('❌ Error getting pending material requests:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Approve/Reject Material Request (Supervisor)
   POST /api/supervisor/approve-material/:requestId
================================ */
export const approveMaterialRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { 
            action, 
            approvedQuantity, 
            pickupLocation, 
            pickupInstructions, 
            pickupContactPerson, 
            pickupContactPhone,
            remarks 
        } = req.body; // action: 'approve' or 'reject'
        const userId = req.user?.id || req.user?.userId;

        // Validate action
        if (!action || !['approve', 'reject'].includes(action.toLowerCase())) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"' 
            });
        }

        // Get the material request
        const materialRequest = await MaterialRequest.findOne({ id: requestId });
        if (!materialRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Material request not found' 
            });
        }

        // Check if already processed
        if (materialRequest.status !== 'PENDING') {
            return res.status(400).json({ 
                success: false,
                message: `Material request already ${materialRequest.status.toLowerCase()}` 
            });
        }

        const newStatus = action.toLowerCase() === 'approve' ? 'APPROVED' : 'REJECTED';
        const finalApprovedQuantity = action.toLowerCase() === 'approve' 
            ? (approvedQuantity || materialRequest.quantity) 
            : null;

        // Update material request
        const updateData = { 
            status: newStatus, 
            approverId: userId,
            approvedAt: new Date(),
            remarks: remarks
        };

        if (action.toLowerCase() === 'approve') {
            updateData.approvedQuantity = finalApprovedQuantity;
            updateData.pickupLocation = pickupLocation || 'Site storage area';
            updateData.pickupInstructions = pickupInstructions || 'Contact site supervisor for collection';
            updateData.pickupContactPerson = pickupContactPerson;
            updateData.pickupContactPhone = pickupContactPhone;
        }

        await MaterialRequest.findOneAndUpdate({ id: requestId }, updateData);

        // Send notification to worker
        try {
            await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
                parseInt(requestId),
                newStatus,
                userId,
                {
                    employeeId: materialRequest.employeeId,
                    requestType: materialRequest.requestType,
                    itemName: materialRequest.itemName,
                    quantity: finalApprovedQuantity || materialRequest.quantity,
                    unit: materialRequest.unit,
                    projectId: materialRequest.projectId,
                    pickupLocation: pickupLocation || 'Site storage area',
                    pickupInstructions: pickupInstructions || 'Contact site supervisor for collection'
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending material request approval notification:', notificationError);
        }

        res.json({ 
            success: true,
            message: `Material request ${action.toLowerCase()}d successfully`,
            requestId: requestId,
            status: newStatus,
            approvedQuantity: finalApprovedQuantity
        });

    } catch (err) {
        console.error('❌ Error approving/rejecting material request:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Get Pending Tool Requests (Supervisor)
   GET /api/supervisor/pending-tool-requests
================================ */
export const getPendingToolRequests = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        
        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Get supervisor's projects
        const projects = await Project.find({ supervisorId: supervisor.id }).lean();
        const projectIds = projects.map(p => p.id);

        // Get pending tool requests for supervisor's projects
        const requests = await MaterialRequest.find({ 
            projectId: { $in: projectIds },
            requestType: 'TOOL',
            status: 'PENDING' 
        }).sort({ createdAt: -1 });

        // Get employee details
        const employeeIds = [...new Set(requests.map(r => r.employeeId))];
        const employees = await Employee.find({ id: { $in: employeeIds } }).lean();

        // Attach employee and project details
        const requestsWithDetails = requests.map(r => {
            const employee = employees.find(e => e.id === r.employeeId);
            const project = projects.find(p => p.id === r.projectId);
            return { 
                ...r.toObject(), 
                employeeName: employee?.fullName || 'Unknown',
                projectName: project?.projectName || 'N/A'
            };
        });

        res.json({
            success: true,
            count: requestsWithDetails.length,
            requests: requestsWithDetails
        });

    } catch (err) {
        console.error('❌ Error getting pending tool requests:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Approve/Reject Tool Request (Supervisor)
   POST /api/supervisor/approve-tool/:requestId
================================ */
export const approveToolRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { 
            action, 
            approvedQuantity, 
            pickupLocation, 
            pickupInstructions, 
            pickupContactPerson, 
            pickupContactPhone,
            remarks 
        } = req.body; // action: 'approve' or 'reject'
        const userId = req.user?.id || req.user?.userId;

        // Validate action
        if (!action || !['approve', 'reject'].includes(action.toLowerCase())) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"' 
            });
        }

        // Get the tool request
        const toolRequest = await MaterialRequest.findOne({ 
            id: requestId,
            requestType: 'TOOL'
        });
        
        if (!toolRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Tool request not found' 
            });
        }

        // Check if already processed
        if (toolRequest.status !== 'PENDING') {
            return res.status(400).json({ 
                success: false,
                message: `Tool request already ${toolRequest.status.toLowerCase()}` 
            });
        }

        const newStatus = action.toLowerCase() === 'approve' ? 'APPROVED' : 'REJECTED';
        const finalApprovedQuantity = action.toLowerCase() === 'approve' 
            ? (approvedQuantity || toolRequest.quantity) 
            : null;

        // Update tool request
        const updateData = { 
            status: newStatus, 
            approverId: userId,
            approvedAt: new Date(),
            remarks: remarks
        };

        if (action.toLowerCase() === 'approve') {
            updateData.approvedQuantity = finalApprovedQuantity;
            updateData.pickupLocation = pickupLocation || 'Tool storage area';
            updateData.pickupInstructions = pickupInstructions || 'Contact site supervisor for tool collection';
            updateData.pickupContactPerson = pickupContactPerson;
            updateData.pickupContactPhone = pickupContactPhone;
        }

        await MaterialRequest.findOneAndUpdate({ id: requestId }, updateData);

        // Send notification to worker
        try {
            await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
                parseInt(requestId),
                newStatus,
                userId,
                {
                    employeeId: toolRequest.employeeId,
                    requestType: 'TOOL',
                    itemName: toolRequest.itemName,
                    quantity: finalApprovedQuantity || toolRequest.quantity,
                    unit: toolRequest.unit,
                    projectId: toolRequest.projectId,
                    pickupLocation: pickupLocation || 'Tool storage area',
                    pickupInstructions: pickupInstructions || 'Contact site supervisor for tool collection'
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending tool request approval notification:', notificationError);
        }

        res.json({ 
            success: true,
            message: `Tool request ${action.toLowerCase()}d successfully`,
            requestId: requestId,
            status: newStatus,
            approvedQuantity: finalApprovedQuantity
        });

    } catch (err) {
        console.error('❌ Error approving/rejecting tool request:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Escalate Issue to Manager (Supervisor)
   POST /api/supervisor/escalate-issue/:issueId
   Uses ProjectDailyProgress model's issues field
================================ */
export const escalateIssue = async (req, res) => {
    try {
        const { issueId } = req.params;
        const { escalationReason, urgency, additionalNotes } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Get the daily progress record (which contains issues)
        const dailyProgress = await ProjectDailyProgress.findOne({ id: issueId });
        if (!dailyProgress) {
            return res.status(404).json({ 
                success: false,
                message: 'Daily progress record not found' 
            });
        }

        // Verify supervisor owns this project
        if (dailyProgress.supervisorId !== supervisor.id) {
            return res.status(403).json({ 
                success: false,
                message: 'You do not have permission to escalate this issue' 
            });
        }

        // Prepare escalation information
        const escalationInfo = `\n\n[ESCALATED TO MANAGER]\nDate: ${new Date().toISOString()}\nReason: ${escalationReason || 'Requires management attention'}\nUrgency: ${urgency || 'high'}\nAdditional Notes: ${additionalNotes || 'N/A'}\nEscalated By: Supervisor ID ${supervisor.id}`;

        // Update daily progress with escalation details
        const updatedIssues = (dailyProgress.issues || '') + escalationInfo;
        
        await ProjectDailyProgress.findOneAndUpdate(
            { id: issueId },
            { 
                issues: updatedIssues,
                remarks: (dailyProgress.remarks || '') + `\n[ESCALATED] Issue escalated to management for review.`,
                updatedAt: new Date()
            }
        );

        // TODO: Send notification to manager
        // This would require a manager notification service
        console.log(`📢 Issue ${issueId} escalated to manager by supervisor ${supervisor.id}`);

        res.json({ 
            success: true,
            message: 'Issue escalated to manager successfully',
            issueId: issueId,
            escalatedAt: new Date(),
            escalationReason: escalationReason || 'Requires management attention'
        });

    } catch (err) {
        console.error('❌ Error escalating issue:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};


/* ===============================
   Unified Approval Processing (Mobile App)
   POST /api/supervisor/approvals/:approvalId/process
   Body: { action: 'approve' | 'reject' | 'request_more_info', notes?, conditions?, escalate? }
================================ */
export const processApproval = async (req, res) => {
    try {
        const { approvalId } = req.params;
        const { action, notes, conditions, escalate } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Validate action
        if (!action || !['approve', 'reject', 'request_more_info'].includes(action)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid action. Must be "approve", "reject", or "request_more_info"' 
            });
        }

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Try to find the request in different collections
        let request = null;
        let requestType = null;
        let model = null;

        // Check LeaveRequest
        request = await LeaveRequest.findOne({ id: parseInt(approvalId) });
        if (request) {
            requestType = 'leave';
            model = LeaveRequest;
        }

        // Check PaymentRequest (advance payment)
        if (!request) {
            request = await PaymentRequest.findOne({ id: parseInt(approvalId) });
            if (request) {
                requestType = 'advance_payment';
                model = PaymentRequest;
            }
        }

        // Check MaterialRequest
        if (!request) {
            request = await MaterialRequest.findOne({ id: parseInt(approvalId) });
            if (request) {
                requestType = request.requestType === 'TOOL' ? 'tool' : 'material';
                model = MaterialRequest;
            }
        }

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Approval request not found' 
            });
        }

        // Check if already processed
        if (request.status !== 'PENDING') {
            return res.status(400).json({ 
                success: false,
                message: `Request already ${request.status.toLowerCase()}` 
            });
        }

        // Determine new status based on action
        let newStatus;
        let responseStatus;
        if (action === 'approve') {
            newStatus = 'APPROVED';
            responseStatus = 'approved';
        } else if (action === 'reject') {
            newStatus = 'REJECTED';
            responseStatus = 'rejected';
        } else if (action === 'request_more_info') {
            newStatus = 'PENDING';
            responseStatus = 'pending_info';
        }

        // Handle escalation
        if (escalate) {
            newStatus = 'ESCALATED';
            responseStatus = 'escalated';
        }

        // Update the request
        const updateData = {
            status: newStatus,
            currentApproverId: userId,
            remarks: notes || request.remarks
        };

        if (action === 'approve') {
            updateData.approvedAt = new Date();
        }

        if (conditions && conditions.length > 0) {
            updateData.conditions = conditions.join('; ');
        }

        await model.findOneAndUpdate(
            { id: parseInt(approvalId) },
            updateData
        );

        // Send notification to worker
        try {
            if (requestType === 'leave') {
                await ApprovalStatusNotificationService.notifyLeaveRequestStatus(
                    parseInt(approvalId),
                    newStatus,
                    userId,
                    notes
                );
            } else if (requestType === 'advance_payment') {
                await ApprovalStatusNotificationService.notifyAdvanceRequestStatus(
                    parseInt(approvalId),
                    newStatus,
                    userId,
                    notes
                );
            } else if (requestType === 'material' || requestType === 'tool') {
                await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
                    parseInt(approvalId),
                    newStatus,
                    userId,
                    notes
                );
            }
        } catch (notificationError) {
            console.error('❌ Error sending approval notification:', notificationError);
        }

        res.json({ 
            success: true,
            data: {
                approvalId: parseInt(approvalId),
                status: responseStatus,
                processedAt: new Date().toISOString(),
                message: `Request ${action}d successfully`,
                nextSteps: action === 'approve' 
                    ? 'Worker has been notified of approval' 
                    : action === 'reject'
                    ? 'Worker has been notified of rejection'
                    : 'Worker has been asked for more information'
            }
        });

    } catch (err) {
        console.error('❌ Error processing approval:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Batch Process Approvals (Mobile App)
   POST /api/supervisor/approvals/batch-process
   Body: { decisions: [{ approvalId, action, notes }] }
================================ */
export const batchProcessApprovals = async (req, res) => {
    try {
        const { decisions } = req.body;
        const userId = req.user?.id || req.user?.userId;

        if (!decisions || !Array.isArray(decisions) || decisions.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Decisions array is required' 
            });
        }

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        const results = [];
        let successful = 0;
        let failed = 0;

        for (const decision of decisions) {
            try {
                const { approvalId, action, notes } = decision;

                // Process each approval
                let request = null;
                let requestType = null;
                let model = null;

                // Check LeaveRequest
                request = await LeaveRequest.findOne({ id: parseInt(approvalId) });
                if (request) {
                    requestType = 'leave';
                    model = LeaveRequest;
                }

                // Check PaymentRequest
                if (!request) {
                    request = await PaymentRequest.findOne({ id: parseInt(approvalId) });
                    if (request) {
                        requestType = 'advance_payment';
                        model = PaymentRequest;
                    }
                }

                // Check MaterialRequest
                if (!request) {
                    request = await MaterialRequest.findOne({ id: parseInt(approvalId) });
                    if (request) {
                        requestType = request.requestType === 'TOOL' ? 'tool' : 'material';
                        model = MaterialRequest;
                    }
                }

                if (!request || request.status !== 'PENDING') {
                    results.push({
                        approvalId: parseInt(approvalId),
                        status: 'failed',
                        message: !request ? 'Request not found' : 'Request already processed'
                    });
                    failed++;
                    continue;
                }

                const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

                await model.findOneAndUpdate(
                    { id: parseInt(approvalId) },
                    { 
                        status: newStatus,
                        currentApproverId: userId,
                        approvedAt: action === 'approve' ? new Date() : undefined,
                        remarks: notes || request.remarks
                    }
                );

                // Send notification
                try {
                    if (requestType === 'leave') {
                        await ApprovalStatusNotificationService.notifyLeaveRequestStatus(
                            parseInt(approvalId), newStatus, userId, notes
                        );
                    } else if (requestType === 'advance_payment') {
                        await ApprovalStatusNotificationService.notifyAdvanceRequestStatus(
                            parseInt(approvalId), newStatus, userId, notes
                        );
                    } else if (requestType === 'material' || requestType === 'tool') {
                        await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
                            parseInt(approvalId), newStatus, userId, notes
                        );
                    }
                } catch (notificationError) {
                    console.error('❌ Error sending batch approval notification:', notificationError);
                }

                results.push({
                    approvalId: parseInt(approvalId),
                    status: 'success',
                    message: `Request ${action}d successfully`
                });
                successful++;

            } catch (error) {
                console.error(`❌ Error processing approval ${decision.approvalId}:`, error);
                results.push({
                    approvalId: parseInt(decision.approvalId),
                    status: 'failed',
                    message: error.message
                });
                failed++;
            }
        }

        res.json({ 
            success: true,
            data: {
                processed: decisions.length,
                successful,
                failed,
                results
            }
        });

    } catch (err) {
        console.error('❌ Error batch processing approvals:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Get Approval History (Mobile App)
   GET /api/supervisor/approvals/history
   Query: { requesterId?, type?, status?, dateFrom?, dateTo?, limit?, offset? }
================================ */
export const getApprovalHistory = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        const { requesterId, type, status, dateFrom, dateTo, limit = 20, offset = 0 } = req.query;

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Get supervisor's projects
        const projects = await Project.find({ supervisorId: supervisor.id }).lean();
        const projectIds = projects.map(p => p.id);

        // Get employees assigned to supervisor's projects
        const employees = await Employee.find({ 
            currentProjectId: { $in: projectIds } 
        }).lean();
        const employeeIds = employees.map(e => e.id);

        // Build query filter
        const baseFilter = {
            employeeId: { $in: employeeIds }
        };

        if (requesterId) {
            baseFilter.employeeId = parseInt(requesterId);
        }

        if (status && status !== 'all') {
            baseFilter.status = status.toUpperCase();
        } else {
            baseFilter.status = { $in: ['APPROVED', 'REJECTED', 'ESCALATED'] };
        }

        if (dateFrom || dateTo) {
            baseFilter.approvedAt = {};
            if (dateFrom) baseFilter.approvedAt.$gte = new Date(dateFrom);
            if (dateTo) baseFilter.approvedAt.$lte = new Date(dateTo);
        }

        // Collect approvals from all sources
        const approvals = [];

        // Get leave requests
        if (!type || type === 'leave') {
            const leaveRequests = await LeaveRequest.find(baseFilter)
                .sort({ approvedAt: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(offset))
                .lean();

            leaveRequests.forEach(req => {
                const employee = employees.find(e => e.id === req.employeeId);
                approvals.push({
                    id: req.id,
                    requestType: 'leave',
                    requesterName: employee?.fullName || 'Unknown',
                    requestDate: req.requestedAt || req.createdAt,
                    status: req.status.toLowerCase(),
                    processedDate: req.approvedAt,
                    approverNotes: req.remarks,
                    amount: null
                });
            });
        }

        // Get payment requests
        if (!type || type === 'advance_payment') {
            const paymentRequests = await PaymentRequest.find(baseFilter)
                .sort({ approvedAt: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(offset))
                .lean();

            paymentRequests.forEach(req => {
                const employee = employees.find(e => e.id === req.employeeId);
                approvals.push({
                    id: req.id,
                    requestType: 'advance_payment',
                    requesterName: employee?.fullName || 'Unknown',
                    requestDate: req.createdAt,
                    status: req.status.toLowerCase(),
                    processedDate: req.approvedAt,
                    approverNotes: req.remarks,
                    amount: req.amount
                });
            });
        }

        // Get material/tool requests
        if (!type || type === 'material' || type === 'tool') {
            const materialFilter = { ...baseFilter };
            if (type === 'material') {
                materialFilter.requestType = 'MATERIAL';
            } else if (type === 'tool') {
                materialFilter.requestType = 'TOOL';
            }

            const materialRequests = await MaterialRequest.find(materialFilter)
                .sort({ approvedAt: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(offset))
                .lean();

            materialRequests.forEach(req => {
                const employee = employees.find(e => e.id === req.employeeId);
                approvals.push({
                    id: req.id,
                    requestType: req.requestType === 'TOOL' ? 'tool' : 'material',
                    requesterName: employee?.fullName || 'Unknown',
                    requestDate: req.createdAt,
                    status: req.status.toLowerCase(),
                    processedDate: req.approvedAt,
                    approverNotes: req.remarks,
                    amount: req.estimatedCost
                });
            });
        }

        // Sort by processed date
        approvals.sort((a, b) => {
            const dateA = a.processedDate ? new Date(a.processedDate) : new Date(0);
            const dateB = b.processedDate ? new Date(b.processedDate) : new Date(0);
            return dateB - dateA;
        });

        res.json({ 
            success: true,
            data: {
                approvals: approvals.slice(0, parseInt(limit)),
                total: approvals.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (err) {
        console.error('❌ Error getting approval history:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   Get Approval Details (Mobile App)
   GET /api/supervisor/approvals/:approvalId/details
================================ */
export const getApprovalDetails = async (req, res) => {
    try {
        const { approvalId } = req.params;
        const userId = req.user?.id || req.user?.userId;

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Try to find the request in different collections
        let request = null;
        let requestType = null;
        let employee = null;

        // Check LeaveRequest
        request = await LeaveRequest.findOne({ id: parseInt(approvalId) }).lean();
        if (request) {
            requestType = 'leave';
            employee = await Employee.findOne({ id: request.employeeId }).lean();
        }

        // Check PaymentRequest
        if (!request) {
            request = await PaymentRequest.findOne({ id: parseInt(approvalId) }).lean();
            if (request) {
                requestType = 'advance_payment';
                employee = await Employee.findOne({ id: request.employeeId }).lean();
            }
        }

        // Check MaterialRequest
        if (!request) {
            request = await MaterialRequest.findOne({ id: parseInt(approvalId) }).lean();
            if (request) {
                requestType = request.requestType === 'TOOL' ? 'tool' : 'material';
                employee = await Employee.findOne({ id: request.employeeId }).lean();
            }
        }

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Approval request not found' 
            });
        }

        // Get project info
        const project = employee ? await Project.findOne({ id: employee.currentProjectId }).lean() : null;

        // Build response
        const details = {
            requestId: request.id,
            requestType,
            status: request.status,
            requesterInfo: {
                id: employee?.id,
                name: employee?.fullName || 'Unknown',
                department: project?.projectName || 'N/A',
                position: employee?.position || 'Worker'
            },
            requestDetails: request,
            approvalHistory: [],
            requesterInfo: {
                ...details.requesterInfo,
                recentPerformance: {
                    attendanceRate: 0.95,
                    taskCompletionRate: 0.88,
                    qualityScore: 0.92
                }
            }
        };

        res.json({ 
            success: true,
            data: details
        });

    } catch (err) {
        console.error('❌ Error getting approval details:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};
