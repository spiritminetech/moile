import LeaveRequest from '../leaveRequest/models/LeaveRequest.js';
import MaterialRequest from '../project/models/MaterialRequest.js';
import PaymentRequest from '../leaveRequest/models/PaymentRequest.js';
import MedicalClaim from '../leaveRequest/models/MedicalClaim.js';
import Employee from '../employee/Employee.js';
import Project from '../project/models/Project.js';
import LeaveRequestDocument from '../leaveRequest/models/LeaveRequestDocument.js';
import ApprovalStatusNotificationService from '../notification/services/ApprovalStatusNotificationService.js';

/**
 * Unified Worker Request Controller
 * Handles all worker request types through a single API interface
 */

/* ===============================
   Submit Leave Request
================================ */
export const submitLeaveRequest = async (req, res) => {
    try {
        const userId = req.user.id;
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

        const leaveRequestData = {
            id: Date.now(),
            companyId: employee.companyId,
            employeeId: employee.id,
            leaveType,
            fromDate,
            toDate,
            reason,
            createdBy: userId,
            status: 'PENDING'
        };

        const leaveRequest = await LeaveRequest.create(leaveRequestData);

        // Handle file attachments if present
        if (req.files && req.files.length > 0) {
            const docs = req.files.map(file => ({
                leaveRequestId: leaveRequest.id,
                documentType: 'SUPPORTING_DOC',
                filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
                uploadedBy: userId
            }));

            await LeaveRequestDocument.insertMany(docs);
        }

        res.status(201).json({
            message: 'Leave request submitted successfully',
            requestId: leaveRequest.id,
            requestType: 'leave'
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Submit Material Request
================================ */
export const submitMaterialRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            projectId,
            itemName,
            itemCategory = 'other',
            quantity,
            unit = 'pieces',
            urgency = 'NORMAL',
            requiredDate,
            purpose,
            justification,
            specifications,
            estimatedCost
        } = req.body;

        // Validate project exists
        const project = await Project.findOne({ id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const materialRequest = await MaterialRequest.create({
            id: Date.now(),
            companyId: employee.companyId,
            projectId,
            employeeId: employee.id,
            requestType: 'MATERIAL',
            itemName,
            itemCategory,
            quantity,
            unit,
            urgency,
            requiredDate,
            purpose,
            justification,
            specifications,
            estimatedCost,
            status: 'PENDING',
            createdBy: userId
        });

        // Handle file attachments if present
        if (req.files && req.files.length > 0) {
            const attachments = req.files.map(file => ({
                fileName: file.originalname,
                filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
                fileType: file.mimetype,
                uploadedAt: new Date()
            }));

            await MaterialRequest.findOneAndUpdate(
                { id: materialRequest.id },
                { attachments: attachments }
            );
        }

        res.status(201).json({
            message: 'Material request submitted successfully',
            requestId: materialRequest.id,
            requestType: 'material'
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Submit Tool Request
================================ */
export const submitToolRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            projectId,
            itemName,
            itemCategory = 'tool',
            quantity,
            unit = 'pieces',
            urgency = 'NORMAL',
            requiredDate,
            purpose,
            justification,
            specifications,
            estimatedCost
        } = req.body;

        // Validate project exists
        const project = await Project.findOne({ id: projectId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const toolRequest = await MaterialRequest.create({
            id: Date.now(),
            companyId: employee.companyId,
            projectId,
            employeeId: employee.id,
            requestType: 'TOOL',
            itemName,
            itemCategory,
            quantity,
            unit,
            urgency,
            requiredDate,
            purpose,
            justification,
            specifications,
            estimatedCost,
            status: 'PENDING',
            createdBy: userId
        });

        // Handle file attachments if present
        if (req.files && req.files.length > 0) {
            const attachments = req.files.map(file => ({
                fileName: file.originalname,
                filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
                fileType: file.mimetype,
                uploadedAt: new Date()
            }));

            await MaterialRequest.findOneAndUpdate(
                { id: toolRequest.id },
                { attachments: attachments }
            );
        }

        res.status(201).json({
            message: 'Tool request submitted successfully',
            requestId: toolRequest.id,
            requestType: 'tool'
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Submit Reimbursement Request
================================ */
export const submitReimbursementRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            amount,
            currency = 'USD',
            description,
            category = 'OTHER',
            urgency = 'NORMAL',
            requiredDate,
            justification
        } = req.body;

        const paymentRequest = await PaymentRequest.create({
            id: Date.now(),
            companyId: employee.companyId,
            employeeId: employee.id,
            requestType: 'REIMBURSEMENT',
            amount,
            currency,
            description,
            category,
            urgency,
            requiredDate,
            justification,
            status: 'PENDING',
            createdBy: userId
        });

        // Handle file attachments if present
        if (req.files && req.files.length > 0) {
            const attachments = req.files.map(file => ({
                fileName: file.originalname,
                filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
                fileType: file.mimetype,
                uploadedAt: new Date()
            }));

            await PaymentRequest.findOneAndUpdate(
                { id: paymentRequest.id },
                { attachments: attachments }
            );
        }

        res.status(201).json({
            message: 'Reimbursement request submitted successfully',
            requestId: paymentRequest.id,
            requestType: 'reimbursement'
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Submit Advance Payment Request
================================ */
export const submitAdvancePaymentRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            amount,
            currency = 'USD',
            description,
            category = 'ADVANCE',
            urgency = 'NORMAL',
            requiredDate,
            justification
        } = req.body;

        const paymentRequest = await PaymentRequest.create({
            id: Date.now(),
            companyId: employee.companyId,
            employeeId: employee.id,
            requestType: 'ADVANCE_PAYMENT',
            amount,
            currency,
            description,
            category,
            urgency,
            requiredDate,
            justification,
            status: 'PENDING',
            createdBy: userId
        });

        // Handle file attachments if present
        if (req.files && req.files.length > 0) {
            const attachments = req.files.map(file => ({
                fileName: file.originalname,
                filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
                fileType: file.mimetype,
                uploadedAt: new Date()
            }));

            await PaymentRequest.findOneAndUpdate(
                { id: paymentRequest.id },
                { attachments: attachments }
            );
        }

        res.status(201).json({
            message: 'Advance payment request submitted successfully',
            requestId: paymentRequest.id,
            requestType: 'advance-payment'
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Upload Request Attachments
================================ */
export const uploadRequestAttachments = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { requestType } = req.body;
        const userId = req.user.id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const attachments = req.files.map(file => ({
            fileName: file.originalname,
            filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
            fileType: file.mimetype,
            uploadedAt: new Date()
        }));

        let updateResult;

        // Update the appropriate request type with attachments
        switch (requestType) {
            case 'leave':
                const docs = req.files.map(file => ({
                    leaveRequestId: parseInt(requestId),
                    documentType: 'SUPPORTING_DOC',
                    filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
                    uploadedBy: userId
                }));
                await LeaveRequestDocument.insertMany(docs);
                updateResult = { acknowledged: true };
                break;

            case 'material':
            case 'tool':
                updateResult = await MaterialRequest.findOneAndUpdate(
                    { id: parseInt(requestId) },
                    { $push: { attachments: { $each: attachments } } }
                );
                break;

            case 'reimbursement':
            case 'advance-payment':
                updateResult = await PaymentRequest.findOneAndUpdate(
                    { id: parseInt(requestId) },
                    { $push: { attachments: { $each: attachments } } }
                );
                break;

            default:
                return res.status(400).json({ message: 'Invalid request type' });
        }

        if (!updateResult) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json({
            message: 'Attachments uploaded successfully',
            attachments: attachments.map(att => ({
                fileName: att.fileName,
                filePath: att.filePath
            }))
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Get All Requests with Filtering
================================ */
export const getRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            type,
            status,
            fromDate,
            toDate,
            limit = 50,
            offset = 0
        } = req.query;

        let allRequests = [];

        // Fetch leave requests
        if (!type || type === 'leave') {
            const leaveRequests = await LeaveRequest.find({
                employeeId: employee.id,
                ...(status && { status: status.toUpperCase() }),
                ...(fromDate && { createdAt: { $gte: new Date(fromDate) } }),
                ...(toDate && { createdAt: { $lte: new Date(toDate) } })
            }).sort({ createdAt: -1 });

            allRequests.push(...leaveRequests.map(req => ({
                ...req.toObject(),
                requestType: 'leave'
            })));
        }

        // Fetch material requests
        if (!type || type === 'material') {
            const materialRequests = await MaterialRequest.find({
                employeeId: employee.id,
                requestType: 'MATERIAL',
                ...(status && { status: status.toUpperCase() }),
                ...(fromDate && { createdAt: { $gte: new Date(fromDate) } }),
                ...(toDate && { createdAt: { $lte: new Date(toDate) } })
            }).sort({ createdAt: -1 });

            allRequests.push(...materialRequests.map(req => ({
                ...req.toObject(),
                requestType: 'material'
            })));
        }

        // Fetch tool requests
        if (!type || type === 'tool') {
            const toolRequests = await MaterialRequest.find({
                employeeId: employee.id,
                requestType: 'TOOL',
                ...(status && { status: status.toUpperCase() }),
                ...(fromDate && { createdAt: { $gte: new Date(fromDate) } }),
                ...(toDate && { createdAt: { $lte: new Date(toDate) } })
            }).sort({ createdAt: -1 });

            allRequests.push(...toolRequests.map(req => ({
                ...req.toObject(),
                requestType: 'tool'
            })));
        }

        // Fetch payment requests (reimbursement and advance payment)
        if (!type || type === 'reimbursement' || type === 'advance-payment') {
            const paymentRequests = await PaymentRequest.find({
                employeeId: employee.id,
                ...(type === 'reimbursement' && { requestType: 'REIMBURSEMENT' }),
                ...(type === 'advance-payment' && { requestType: 'ADVANCE_PAYMENT' }),
                ...(status && { status: status.toUpperCase() }),
                ...(fromDate && { createdAt: { $gte: new Date(fromDate) } }),
                ...(toDate && { createdAt: { $lte: new Date(toDate) } })
            }).sort({ createdAt: -1 });

            allRequests.push(...paymentRequests.map(req => ({
                ...req.toObject(),
                requestType: req.requestType === 'REIMBURSEMENT' ? 'reimbursement' : 'advance-payment'
            })));
        }

        // Sort all requests by creation date
        allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const paginatedRequests = allRequests.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        res.json({
            requests: paginatedRequests,
            total: allRequests.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Get Specific Request
================================ */
export const getSpecificRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        let request = null;
        let requestType = null;

        // Try to find in leave requests
        const leaveRequest = await LeaveRequest.findOne({ 
            id: parseInt(requestId),
            employeeId: employee.id 
        });
        if (leaveRequest) {
            request = leaveRequest.toObject();
            requestType = 'leave';
        }

        // Try to find in material requests
        if (!request) {
            const materialRequest = await MaterialRequest.findOne({ 
                id: parseInt(requestId),
                employeeId: employee.id 
            });
            if (materialRequest) {
                request = materialRequest.toObject();
                requestType = materialRequest.requestType === 'MATERIAL' ? 'material' : 'tool';
            }
        }

        // Try to find in payment requests
        if (!request) {
            const paymentRequest = await PaymentRequest.findOne({ 
                id: parseInt(requestId),
                employeeId: employee.id 
            });
            if (paymentRequest) {
                request = paymentRequest.toObject();
                requestType = paymentRequest.requestType === 'REIMBURSEMENT' ? 'reimbursement' : 'advance-payment';
            }
        }

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json({
            ...request,
            requestType
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Cancel Request
================================ */
export const cancelRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        let updateResult = null;
        let requestType = null;

        // Try to cancel leave request
        const leaveRequest = await LeaveRequest.findOneAndUpdate(
            { 
                id: parseInt(requestId),
                employeeId: employee.id,
                status: 'PENDING'
            },
            { 
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: reason || 'Cancelled by worker'
            }
        );

        if (leaveRequest) {
            updateResult = leaveRequest;
            requestType = 'leave';
        }

        // Try to cancel material/tool request
        if (!updateResult) {
            const materialRequest = await MaterialRequest.findOneAndUpdate(
                { 
                    id: parseInt(requestId),
                    employeeId: employee.id,
                    status: 'PENDING'
                },
                { 
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelReason: reason || 'Cancelled by worker'
                }
            );

            if (materialRequest) {
                updateResult = materialRequest;
                requestType = materialRequest.requestType === 'MATERIAL' ? 'material' : 'tool';
            }
        }

        // Try to cancel payment request
        if (!updateResult) {
            const paymentRequest = await PaymentRequest.findOneAndUpdate(
                { 
                    id: parseInt(requestId),
                    employeeId: employee.id,
                    status: 'PENDING'
                },
                { 
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelReason: reason || 'Cancelled by worker'
                }
            );

            if (paymentRequest) {
                updateResult = paymentRequest;
                requestType = paymentRequest.requestType === 'REIMBURSEMENT' ? 'reimbursement' : 'advance-payment';
            }
        }

        if (!updateResult) {
            return res.status(404).json({ 
                message: 'Request not found or cannot be cancelled (only pending requests can be cancelled)' 
            });
        }

        res.json({
            message: `${requestType} request cancelled successfully`,
            requestId: parseInt(requestId),
            requestType
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};