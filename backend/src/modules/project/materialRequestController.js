import MaterialRequest from './models/MaterialRequest.js';
import Employee from '../employee/Employee.js';
import Project from './models/Project.js';
import ApprovalStatusNotificationService from '../notification/services/ApprovalStatusNotificationService.js';

/**
 * Material Request Controller
 * Handles material and tool request operations and approval workflow
 */

/* ===============================
   Create Material/Tool Request (Worker)
================================ */
export const createMaterialRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            projectId,
            requestType,
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
            requestType,
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
            message: `${requestType.toLowerCase()} request submitted successfully`,
            materialRequestId: materialRequest.id
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Get My Material/Tool Requests (Worker)
================================ */
export const getMyMaterialRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        const requests = await MaterialRequest.find({
            employeeId: employee.id
        }).sort({ createdAt: -1 });

        // Get project names
        const projectIds = [...new Set(requests.map(r => r.projectId))];
        const projects = await Project.find({ id: { $in: projectIds } });

        const requestsWithProjects = requests.map(r => {
            const project = projects.find(p => p.id === r.projectId);
            return { ...r.toObject(), projectName: project ? project.projectName : null };
        });

        res.json(requestsWithProjects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Get Pending Material/Tool Requests (Supervisor)
================================ */
export const getPendingMaterialRequests = async (req, res) => {
    try {
        const requests = await MaterialRequest.find({ status: 'PENDING' });

        // Get all unique employee IDs and project IDs
        const employeeIds = [...new Set(requests.map(r => r.employeeId).filter(Boolean))];
        const projectIds = [...new Set(requests.map(r => r.projectId).filter(Boolean))];

        // Fetch employee and project details
        const [employees, projects] = await Promise.all([
            Employee.find({ id: { $in: employeeIds } }),
            Project.find({ id: { $in: projectIds } })
        ]);

        // Attach employee and project names to each request
        const requestsWithDetails = requests.map(r => {
            const employee = employees.find(e => e.id === r.employeeId);
            const project = projects.find(p => p.id === r.projectId);
            return { 
                ...r.toObject(), 
                employeeName: employee ? employee.fullName : null,
                projectName: project ? project.projectName : null
            };
        });

        res.json(requestsWithDetails);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Approve Material/Tool Request
================================ */
export const approveMaterialRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            approvedQuantity, 
            pickupLocation, 
            pickupInstructions, 
            pickupContactPerson, 
            pickupContactPhone,
            remarks 
        } = req.body;
        const userId = req.user.id;

        // Get the material request
        const materialRequest = await MaterialRequest.findOne({ id });
        if (!materialRequest) {
            return res.status(404).json({ message: 'Material request not found' });
        }

        const finalApprovedQuantity = approvedQuantity || materialRequest.quantity;

        await MaterialRequest.findOneAndUpdate(
            { id },
            { 
                status: 'APPROVED', 
                approverId: userId,
                approvedQuantity: finalApprovedQuantity,
                approvedAt: new Date(),
                pickupLocation: pickupLocation || 'Site storage area',
                pickupInstructions: pickupInstructions || 'Contact site supervisor for collection',
                pickupContactPerson,
                pickupContactPhone,
                remarks: remarks
            }
        );

        // Send approval notification to worker
        try {
            await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
                parseInt(id),
                'APPROVED',
                userId,
                {
                    employeeId: materialRequest.employeeId,
                    requestType: materialRequest.requestType,
                    itemName: materialRequest.itemName,
                    quantity: finalApprovedQuantity,
                    unit: materialRequest.unit,
                    projectId: materialRequest.projectId,
                    pickupLocation: pickupLocation || 'Site storage area',
                    pickupInstructions: pickupInstructions || 'Contact site supervisor for collection'
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending material request approval notification:', notificationError);
            // Don't fail the approval if notification fails
        }

        res.json({ message: `${materialRequest.requestType.toLowerCase()} request approved successfully` });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Reject Material/Tool Request
================================ */
export const rejectMaterialRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const userId = req.user.id;

        // Get the material request
        const materialRequest = await MaterialRequest.findOne({ id });
        if (!materialRequest) {
            return res.status(404).json({ message: 'Material request not found' });
        }

        await MaterialRequest.findOneAndUpdate(
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
            await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
                parseInt(id),
                'REJECTED',
                userId,
                {
                    employeeId: materialRequest.employeeId,
                    requestType: materialRequest.requestType,
                    itemName: materialRequest.itemName,
                    quantity: materialRequest.quantity,
                    unit: materialRequest.unit,
                    projectId: materialRequest.projectId
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending material request rejection notification:', notificationError);
            // Don't fail the rejection if notification fails
        }

        res.json({ message: `${materialRequest.requestType.toLowerCase()} request rejected` });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Mark Material/Tool Request as Fulfilled
================================ */
export const markMaterialRequestFulfilled = async (req, res) => {
    try {
        const { id } = req.params;
        const { actualCost, supplier } = req.body;
        const userId = req.user.id;

        await MaterialRequest.findOneAndUpdate(
            { id },
            { 
                status: 'FULFILLED',
                fulfilledAt: new Date(),
                actualCost,
                supplier
            }
        );

        res.json({ message: 'Material request marked as fulfilled' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};