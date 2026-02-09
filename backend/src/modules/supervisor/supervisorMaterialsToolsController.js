import MaterialRequest from '../project/models/MaterialRequest.js';
import Material from '../project/models/Material.js';
import Tool from '../project/models/Tool.js';
import Employee from '../employee/Employee.js';
import Project from '../project/models/Project.js';
import Counter from '../counter/Counter.js';

/**
 * Supervisor Materials & Tools Controller
 * Handles material requests, delivery acknowledgment, material returns, and tool usage logging
 * Uses existing models without creating new ones
 */

/* ===============================
   REQUEST MATERIALS
   POST /api/supervisor/request-materials
================================ */
export const requestMaterials = async (req, res) => {
    try {
        const {
            projectId,
            requestType, // 'MATERIAL' or 'TOOL'
            itemName,
            itemCategory,
            quantity,
            unit = 'pieces',
            urgency = 'NORMAL',
            requiredDate,
            purpose,
            justification,
            specifications,
            estimatedCost
        } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Validate required fields
        if (!projectId || !requestType || !itemName || !quantity || !requiredDate || !purpose) {
            return res.status(400).json({
                success: false,
                message: 'projectId, requestType, itemName, quantity, requiredDate, and purpose are required'
            });
        }

        // Validate requestType
        if (!['MATERIAL', 'TOOL'].includes(requestType)) {
            return res.status(400).json({
                success: false,
                message: 'requestType must be either "MATERIAL" or "TOOL"'
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

        // Verify supervisor owns this project
        const project = await Project.findOne({ id: projectId });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (project.supervisorId !== supervisor.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to request materials for this project'
            });
        }

        // Generate unique ID for material request
        const counter = await Counter.findOneAndUpdate(
            { name: 'materialRequest' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        );

        // Create material request
        const materialRequest = new MaterialRequest({
            id: counter.value,
            companyId: project.companyId,
            projectId: projectId,
            employeeId: supervisor.id,
            requestType: requestType,
            itemName: itemName,
            itemCategory: itemCategory || 'other',
            quantity: quantity,
            unit: unit,
            urgency: urgency,
            requiredDate: new Date(requiredDate),
            purpose: purpose,
            justification: justification,
            specifications: specifications,
            estimatedCost: estimatedCost,
            status: 'PENDING',
            createdBy: supervisor.id
        });

        await materialRequest.save();

        res.status(201).json({
            success: true,
            message: `${requestType.toLowerCase()} request submitted successfully`,
            requestId: materialRequest.id,
            request: {
                id: materialRequest.id,
                requestType: materialRequest.requestType,
                itemName: materialRequest.itemName,
                quantity: materialRequest.quantity,
                unit: materialRequest.unit,
                urgency: materialRequest.urgency,
                requiredDate: materialRequest.requiredDate,
                status: materialRequest.status,
                createdAt: materialRequest.createdAt
            }
        });

    } catch (err) {
        console.error('❌ Error requesting materials:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/* ===============================
   ACKNOWLEDGE DELIVERY
   POST /api/supervisor/acknowledge-delivery/:requestId
================================ */
export const acknowledgeDelivery = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { 
            deliveredQuantity, 
            deliveryCondition = 'good',
            receivedBy,
            deliveryNotes 
        } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
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

        // Verify request is approved
        if (materialRequest.status !== 'APPROVED') {
            return res.status(400).json({ 
                success: false,
                message: `Cannot acknowledge delivery. Request status is ${materialRequest.status}` 
            });
        }

        // Verify supervisor owns this project
        const project = await Project.findOne({ id: materialRequest.projectId });
        if (!project || project.supervisorId !== supervisor.id) {
            return res.status(403).json({ 
                success: false,
                message: 'You do not have permission to acknowledge delivery for this project' 
            });
        }

        const finalDeliveredQuantity = deliveredQuantity || materialRequest.approvedQuantity || materialRequest.quantity;

        // Update material request to FULFILLED
        await MaterialRequest.findOneAndUpdate(
            { id: requestId },
            { 
                status: 'FULFILLED',
                fulfilledAt: new Date(),
                actualCost: materialRequest.estimatedCost, // Can be updated later
                remarks: materialRequest.remarks 
                    ? `${materialRequest.remarks}\n[DELIVERY] Delivered: ${finalDeliveredQuantity} ${materialRequest.unit}. Condition: ${deliveryCondition}. Received by: ${receivedBy || 'Supervisor'}. Notes: ${deliveryNotes || 'N/A'}`
                    : `[DELIVERY] Delivered: ${finalDeliveredQuantity} ${materialRequest.unit}. Condition: ${deliveryCondition}. Received by: ${receivedBy || 'Supervisor'}. Notes: ${deliveryNotes || 'N/A'}`
            }
        );

        // Update Material or Tool inventory if exists
        if (materialRequest.requestType === 'MATERIAL') {
            // Try to find existing material in inventory
            const existingMaterial = await Material.findOne({
                projectId: materialRequest.projectId,
                name: materialRequest.itemName
            });

            if (existingMaterial) {
                // Update existing material quantity
                await Material.findOneAndUpdate(
                    { id: existingMaterial.id },
                    { 
                        $inc: { 
                            quantity: finalDeliveredQuantity,
                            allocated: finalDeliveredQuantity 
                        },
                        status: 'allocated'
                    }
                );
            }
        } else if (materialRequest.requestType === 'TOOL') {
            // Try to find existing tool in inventory
            const existingTool = await Tool.findOne({
                projectId: materialRequest.projectId,
                name: materialRequest.itemName
            });

            if (existingTool) {
                // Update existing tool quantity
                await Tool.findOneAndUpdate(
                    { id: existingTool.id },
                    { 
                        $inc: { quantity: finalDeliveredQuantity },
                        status: 'available'
                    }
                );
            }
        }

        res.json({ 
            success: true,
            message: `${materialRequest.requestType.toLowerCase()} delivery acknowledged successfully`,
            requestId: requestId,
            deliveredQuantity: finalDeliveredQuantity,
            deliveryCondition: deliveryCondition
        });

    } catch (err) {
        console.error('❌ Error acknowledging delivery:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   RETURN MATERIALS
   POST /api/supervisor/return-materials
================================ */
export const returnMaterials = async (req, res) => {
    try {
        const { 
            requestId,
            returnQuantity,
            returnReason,
            returnCondition = 'unused',
            returnNotes 
        } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Validate required fields
        if (!requestId || !returnQuantity || !returnReason) {
            return res.status(400).json({ 
                success: false,
                message: 'requestId, returnQuantity, and returnReason are required' 
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

        // Get the material request
        const materialRequest = await MaterialRequest.findOne({ id: requestId });
        if (!materialRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Material request not found' 
            });
        }

        // Verify request is fulfilled
        if (materialRequest.status !== 'FULFILLED') {
            return res.status(400).json({ 
                success: false,
                message: `Cannot return materials. Request status is ${materialRequest.status}` 
            });
        }

        // Verify supervisor owns this project
        const project = await Project.findOne({ id: materialRequest.projectId });
        if (!project || project.supervisorId !== supervisor.id) {
            return res.status(403).json({ 
                success: false,
                message: 'You do not have permission to process returns for this project' 
            });
        }

        // Add return information to remarks
        const returnInfo = `\n[RETURN] Date: ${new Date().toISOString()}, Quantity: ${returnQuantity} ${materialRequest.unit}, Reason: ${returnReason}, Condition: ${returnCondition}, Notes: ${returnNotes || 'N/A'}, Returned by: Supervisor ID ${supervisor.id}`;
        
        await MaterialRequest.findOneAndUpdate(
            { id: requestId },
            { 
                remarks: (materialRequest.remarks || '') + returnInfo,
                // Keep status as FULFILLED but add return info
                updatedAt: new Date()
            }
        );

        // Update Material or Tool inventory
        if (materialRequest.requestType === 'MATERIAL') {
            const existingMaterial = await Material.findOne({
                projectId: materialRequest.projectId,
                name: materialRequest.itemName
            });

            if (existingMaterial) {
                // Decrease allocated quantity based on return condition
                if (returnCondition === 'unused') {
                    await Material.findOneAndUpdate(
                        { id: existingMaterial.id },
                        { 
                            $inc: { 
                                allocated: -returnQuantity,
                                quantity: -returnQuantity 
                            }
                        }
                    );
                } else if (returnCondition === 'damaged') {
                    await Material.findOneAndUpdate(
                        { id: existingMaterial.id },
                        { 
                            $inc: { allocated: -returnQuantity },
                            status: 'damaged'
                        }
                    );
                }
            }
        } else if (materialRequest.requestType === 'TOOL') {
            const existingTool = await Tool.findOne({
                projectId: materialRequest.projectId,
                name: materialRequest.itemName
            });

            if (existingTool) {
                if (returnCondition === 'unused') {
                    await Tool.findOneAndUpdate(
                        { id: existingTool.id },
                        { 
                            $inc: { quantity: -returnQuantity },
                            status: 'available'
                        }
                    );
                } else if (returnCondition === 'damaged') {
                    await Tool.findOneAndUpdate(
                        { id: existingTool.id },
                        { 
                            $inc: { quantity: -returnQuantity },
                            status: 'damaged',
                            condition: 'needs_repair'
                        }
                    );
                }
            }
        }

        res.json({ 
            success: true,
            message: `${materialRequest.requestType.toLowerCase()} return processed successfully`,
            requestId: requestId,
            returnQuantity: returnQuantity,
            returnCondition: returnCondition
        });

    } catch (err) {
        console.error('❌ Error processing material return:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   GET TOOL USAGE LOG
   GET /api/supervisor/tool-usage-log
================================ */
export const getToolUsageLog = async (req, res) => {
    try {
        const { projectId, toolId, status } = req.query;
        const userId = req.user?.id || req.user?.userId;

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Build query
        const query = {};
        
        if (projectId) {
            // Verify supervisor owns this project
            const project = await Project.findOne({ id: parseInt(projectId) });
            if (!project || project.supervisorId !== supervisor.id) {
                return res.status(403).json({ 
                    success: false,
                    message: 'You do not have permission to view this project' 
                });
            }
            query.projectId = parseInt(projectId);
        } else {
            // Get all supervisor's projects
            const projects = await Project.find({ supervisorId: supervisor.id }).lean();
            const projectIds = projects.map(p => p.id);
            query.projectId = { $in: projectIds };
        }

        if (toolId) {
            query.id = parseInt(toolId);
        }

        if (status) {
            query.status = status;
        }

        // Get tools with usage information
        const tools = await Tool.find(query).sort({ updatedAt: -1 });

        // Get related material requests for tool allocation history
        const toolRequests = await MaterialRequest.find({
            projectId: query.projectId,
            requestType: 'TOOL',
            status: { $in: ['APPROVED', 'FULFILLED'] }
        }).sort({ createdAt: -1 });

        // Combine tool inventory with request history
        const toolUsageLog = tools.map(tool => {
            const relatedRequests = toolRequests.filter(req => 
                req.itemName.toLowerCase().includes(tool.name.toLowerCase()) ||
                tool.name.toLowerCase().includes(req.itemName.toLowerCase())
            );

            return {
                toolId: tool.id,
                toolName: tool.name,
                category: tool.category,
                totalQuantity: tool.quantity,
                status: tool.status,
                condition: tool.condition,
                location: tool.location,
                allocated: tool.allocated,
                serialNumber: tool.serialNumber,
                lastMaintenanceDate: tool.lastMaintenanceDate,
                nextMaintenanceDate: tool.nextMaintenanceDate,
                allocationHistory: relatedRequests.map(req => ({
                    requestId: req.id,
                    employeeId: req.employeeId,
                    quantity: req.approvedQuantity || req.quantity,
                    requestedDate: req.createdAt,
                    approvedDate: req.approvedAt,
                    fulfilledDate: req.fulfilledAt,
                    status: req.status,
                    purpose: req.purpose,
                    pickupLocation: req.pickupLocation
                })),
                updatedAt: tool.updatedAt
            };
        });

        res.json({
            success: true,
            count: toolUsageLog.length,
            projectId: projectId ? parseInt(projectId) : 'all',
            tools: toolUsageLog
        });

    } catch (err) {
        console.error('❌ Error getting tool usage log:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   LOG TOOL USAGE (Check-out/Check-in)
   POST /api/supervisor/log-tool-usage
================================ */
export const logToolUsage = async (req, res) => {
    try {
        const { 
            toolId,
            action, // 'check_out' or 'check_in'
            employeeId,
            quantity = 1,
            condition,
            location,
            notes 
        } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Validate required fields
        if (!toolId || !action || !employeeId) {
            return res.status(400).json({ 
                success: false,
                message: 'toolId, action, and employeeId are required' 
            });
        }

        if (!['check_out', 'check_in'].includes(action)) {
            return res.status(400).json({ 
                success: false,
                message: 'action must be either "check_out" or "check_in"' 
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

        // Get the tool
        const tool = await Tool.findOne({ id: toolId });
        if (!tool) {
            return res.status(404).json({ 
                success: false,
                message: 'Tool not found' 
            });
        }

        // Verify supervisor owns this project
        const project = await Project.findOne({ id: tool.projectId });
        if (!project || project.supervisorId !== supervisor.id) {
            return res.status(403).json({ 
                success: false,
                message: 'You do not have permission to manage tools for this project' 
            });
        }

        // Get employee details
        const employee = await Employee.findOne({ id: employeeId }).lean();
        if (!employee) {
            return res.status(404).json({ 
                success: false,
                message: 'Employee not found' 
            });
        }

        // Process check-out or check-in
        if (action === 'check_out') {
            // Check if enough tools available
            if (tool.quantity < quantity) {
                return res.status(400).json({ 
                    success: false,
                    message: `Insufficient tools available. Available: ${tool.quantity}, Requested: ${quantity}` 
                });
            }

            // Update tool status
            await Tool.findOneAndUpdate(
                { id: toolId },
                { 
                    status: 'in_use',
                    allocated: true,
                    location: location || `Assigned to ${employee.fullName}`,
                    notes: (tool.notes || '') + `\n[CHECK-OUT] ${new Date().toISOString()} - ${quantity} unit(s) checked out to ${employee.fullName} (ID: ${employeeId}). ${notes || ''}`
                }
            );

            res.json({ 
                success: true,
                message: `Tool checked out successfully to ${employee.fullName}`,
                action: 'check_out',
                toolId: toolId,
                toolName: tool.name,
                employeeName: employee.fullName,
                quantity: quantity
            });

        } else if (action === 'check_in') {
            // Update tool status
            const updateData = {
                status: 'available',
                allocated: false,
                location: location || tool.location,
                notes: (tool.notes || '') + `\n[CHECK-IN] ${new Date().toISOString()} - ${quantity} unit(s) returned by ${employee.fullName} (ID: ${employeeId}). Condition: ${condition || 'good'}. ${notes || ''}`
            };

            if (condition) {
                updateData.condition = condition;
                if (condition === 'needs_repair' || condition === 'poor') {
                    updateData.status = 'maintenance';
                }
            }

            await Tool.findOneAndUpdate({ id: toolId }, updateData);

            res.json({ 
                success: true,
                message: `Tool checked in successfully from ${employee.fullName}`,
                action: 'check_in',
                toolId: toolId,
                toolName: tool.name,
                employeeName: employee.fullName,
                quantity: quantity,
                condition: condition || 'good'
            });
        }

    } catch (err) {
        console.error('❌ Error logging tool usage:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   GET MATERIAL INVENTORY
   GET /api/supervisor/materials/inventory
================================ */
export const getMaterialInventory = async (req, res) => {
    try {
        const { projectId, lowStock } = req.query;
        const userId = req.user?.id || req.user?.userId;

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Build query for projects
        let projectQuery = {};
        if (projectId) {
            // Verify supervisor owns this project
            const project = await Project.findOne({ id: parseInt(projectId) });
            if (!project || project.supervisorId !== supervisor.id) {
                return res.status(403).json({ 
                    success: false,
                    message: 'You do not have permission to view this project' 
                });
            }
            projectQuery = { id: parseInt(projectId) };
        } else {
            // Get all supervisor's projects
            projectQuery = { supervisorId: supervisor.id };
        }

        const projects = await Project.find(projectQuery).lean();
        const projectIds = projects.map(p => p.id);

        // Get materials and tools for these projects
        const [materials, tools] = await Promise.all([
            Material.find({ projectId: { $in: projectIds } }).lean(),
            Tool.find({ projectId: { $in: projectIds } }).lean()
        ]);

        // Build inventory data
        const inventory = [];
        const alerts = [];

        // Process materials
        materials.forEach(material => {
            const project = projects.find(p => p.id === material.projectId);
            const isLowStock = material.quantity < (material.minQuantity || 10);
            
            const item = {
                id: material.id,
                type: 'MATERIAL',
                name: material.name,
                category: material.category || 'other',
                quantity: material.quantity,
                unit: material.unit || 'pieces',
                allocated: material.allocated || 0,
                available: material.quantity - (material.allocated || 0),
                status: material.status,
                projectId: material.projectId,
                projectName: project?.projectName || 'Unknown',
                location: material.location,
                minQuantity: material.minQuantity || 10,
                isLowStock: isLowStock,
                lastUpdated: material.updatedAt
            };

            // Filter by lowStock if requested
            if (!lowStock || (lowStock === 'true' && isLowStock)) {
                inventory.push(item);
            }

            // Add to alerts if low stock
            if (isLowStock) {
                alerts.push({
                    type: 'LOW_STOCK',
                    itemType: 'MATERIAL',
                    itemId: material.id,
                    itemName: material.name,
                    projectName: project?.projectName || 'Unknown',
                    currentQuantity: material.quantity,
                    minQuantity: material.minQuantity || 10,
                    message: `Low stock alert: ${material.name} has only ${material.quantity} ${material.unit} remaining`
                });
            }
        });

        // Process tools
        tools.forEach(tool => {
            const project = projects.find(p => p.id === tool.projectId);
            const isLowStock = tool.quantity < (tool.minQuantity || 2);
            
            const item = {
                id: tool.id,
                type: 'TOOL',
                name: tool.name,
                category: tool.category || 'other',
                quantity: tool.quantity,
                unit: 'pieces',
                allocated: tool.allocated ? 1 : 0,
                available: tool.allocated ? 0 : tool.quantity,
                status: tool.status,
                condition: tool.condition,
                projectId: tool.projectId,
                projectName: project?.projectName || 'Unknown',
                location: tool.location,
                serialNumber: tool.serialNumber,
                minQuantity: tool.minQuantity || 2,
                isLowStock: isLowStock,
                lastMaintenanceDate: tool.lastMaintenanceDate,
                nextMaintenanceDate: tool.nextMaintenanceDate,
                lastUpdated: tool.updatedAt
            };

            // Filter by lowStock if requested
            if (!lowStock || (lowStock === 'true' && isLowStock)) {
                inventory.push(item);
            }

            // Add to alerts if low stock or needs maintenance
            if (isLowStock) {
                alerts.push({
                    type: 'LOW_STOCK',
                    itemType: 'TOOL',
                    itemId: tool.id,
                    itemName: tool.name,
                    projectName: project?.projectName || 'Unknown',
                    currentQuantity: tool.quantity,
                    minQuantity: tool.minQuantity || 2,
                    message: `Low stock alert: ${tool.name} has only ${tool.quantity} units remaining`
                });
            }

            if (tool.status === 'maintenance' || tool.condition === 'needs_repair') {
                alerts.push({
                    type: 'MAINTENANCE_REQUIRED',
                    itemType: 'TOOL',
                    itemId: tool.id,
                    itemName: tool.name,
                    projectName: project?.projectName || 'Unknown',
                    condition: tool.condition,
                    message: `Maintenance required: ${tool.name} needs repair or maintenance`
                });
            }
        });

        res.json({
            success: true,
            data: {
                inventory: inventory,
                alerts: alerts,
                summary: {
                    totalMaterials: materials.length,
                    totalTools: tools.length,
                    lowStockItems: alerts.filter(a => a.type === 'LOW_STOCK').length,
                    maintenanceRequired: alerts.filter(a => a.type === 'MAINTENANCE_REQUIRED').length
                }
            }
        });

    } catch (err) {
        console.error('❌ Error getting material inventory:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   GET MATERIAL RETURNS HISTORY
   GET /api/supervisor/material-returns
================================ */
export const getMaterialReturns = async (req, res) => {
    try {
        const { projectId, startDate, endDate } = req.query;
        const userId = req.user?.id || req.user?.userId;

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Build query
        const query = {
            status: 'FULFILLED',
            remarks: { $regex: /\[RETURN\]/, $options: 'i' } // Find requests with return info
        };
        
        if (projectId) {
            // Verify supervisor owns this project
            const project = await Project.findOne({ id: parseInt(projectId) });
            if (!project || project.supervisorId !== supervisor.id) {
                return res.status(403).json({ 
                    success: false,
                    message: 'You do not have permission to view this project' 
                });
            }
            query.projectId = parseInt(projectId);
        } else {
            // Get all supervisor's projects
            const projects = await Project.find({ supervisorId: supervisor.id }).lean();
            const projectIds = projects.map(p => p.id);
            query.projectId = { $in: projectIds };
        }

        if (startDate || endDate) {
            query.updatedAt = {};
            if (startDate) query.updatedAt.$gte = new Date(startDate);
            if (endDate) query.updatedAt.$lte = new Date(endDate);
        }

        // Get material requests with returns
        const returns = await MaterialRequest.find(query).sort({ updatedAt: -1 });

        // Get employee and project details
        const employeeIds = [...new Set(returns.map(r => r.employeeId))];
        const projectIds = [...new Set(returns.map(r => r.projectId))];
        
        const [employees, projects] = await Promise.all([
            Employee.find({ id: { $in: employeeIds } }).lean(),
            Project.find({ id: { $in: projectIds } }).lean()
        ]);

        // Parse return information from remarks
        const returnsWithDetails = returns.map(r => {
            const employee = employees.find(e => e.id === r.employeeId);
            const project = projects.find(p => p.id === r.projectId);
            
            // Extract return info from remarks
            const returnMatch = r.remarks?.match(/\[RETURN\]([^\[]*)/);
            const returnInfo = returnMatch ? returnMatch[1].trim() : '';

            return {
                requestId: r.id,
                requestType: r.requestType,
                itemName: r.itemName,
                originalQuantity: r.approvedQuantity || r.quantity,
                unit: r.unit,
                employeeName: employee?.fullName || 'Unknown',
                projectName: project?.projectName || 'Unknown',
                returnInfo: returnInfo,
                fulfilledDate: r.fulfilledAt,
                returnDate: r.updatedAt,
                remarks: r.remarks
            };
        });

        res.json({
            success: true,
            count: returnsWithDetails.length,
            returns: returnsWithDetails
        });

    } catch (err) {
        console.error('❌ Error getting material returns:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   GET MATERIALS AND TOOLS (Combined endpoint for mobile app)
   GET /api/supervisor/materials-tools
================================ */
export const getMaterialsAndTools = async (req, res) => {
    try {
        const { projectId } = req.query;
        const userId = req.user?.id || req.user?.userId;

        // Find supervisor
        const supervisor = await Employee.findOne({ userId }).lean();
        if (!supervisor) {
            return res.status(404).json({ 
                success: false,
                message: 'Supervisor not found' 
            });
        }

        // Build query for projects
        let projectQuery = {};
        if (projectId) {
            // Verify supervisor owns this project
            const project = await Project.findOne({ id: parseInt(projectId) });
            if (!project || project.supervisorId !== supervisor.id) {
                return res.status(403).json({ 
                    success: false,
                    message: 'You do not have permission to view this project' 
                });
            }
            projectQuery = { id: parseInt(projectId) };
        } else {
            // Get all supervisor's projects
            projectQuery = { supervisorId: supervisor.id };
        }

        const projects = await Project.find(projectQuery).lean();
        const projectIds = projects.map(p => p.id);

        // Get material requests for these projects
        const materialRequests = await MaterialRequest.find({
            projectId: { $in: projectIds }
        }).sort({ createdAt: -1 }).lean();

        // Get employee details for requests
        const employeeIds = [...new Set(materialRequests.map(r => r.employeeId))];
        const employees = await Employee.find({ id: { $in: employeeIds } }).lean();

        // Format material requests for mobile app
        const formattedMaterialRequests = materialRequests.map(req => {
            const employee = employees.find(e => e.id === req.employeeId);
            const project = projects.find(p => p.id === req.projectId);

            return {
                id: req.id,
                projectId: req.projectId,
                projectName: project?.projectName || 'Unknown',
                itemName: req.itemName,
                category: req.itemCategory || req.category || 'other',
                quantity: req.quantity,
                unit: req.unit || 'pieces',
                urgency: req.urgency?.toLowerCase() || 'normal',
                requiredDate: req.requiredDate,
                purpose: req.purpose,
                justification: req.justification,
                estimatedCost: req.estimatedCost,
                status: req.status?.toLowerCase() || 'pending',
                requestType: req.requestType,
                requestedBy: employee?.fullName || 'Unknown',
                requestedById: req.employeeId,
                approvedQuantity: req.approvedQuantity,
                approvedAt: req.approvedAt,
                fulfilledAt: req.fulfilledAt,
                createdAt: req.createdAt,
                updatedAt: req.updatedAt
            };
        });

        // For tool allocations, we'll use the material requests with type TOOL
        // and format them as allocations
        const toolAllocations = materialRequests
            .filter(req => req.requestType === 'TOOL' && req.status === 'FULFILLED')
            .map(req => {
                const employee = employees.find(e => e.id === req.employeeId);
                const project = projects.find(p => p.id === req.projectId);

                return {
                    id: req.id,
                    toolId: req.id, // Using request ID as tool ID
                    toolName: req.itemName,
                    projectId: req.projectId,
                    projectName: project?.projectName || 'Unknown',
                    allocatedTo: req.employeeId,
                    allocatedToName: employee?.fullName || 'Unknown',
                    quantity: req.approvedQuantity || req.quantity,
                    allocationDate: req.fulfilledAt || req.approvedAt,
                    expectedReturnDate: req.requiredDate,
                    actualReturnDate: null, // Would need separate tracking
                    condition: 'good', // Default condition
                    location: req.pickupLocation || 'Site',
                    purpose: req.purpose,
                    status: 'allocated'
                };
            });

        res.json({
            success: true,
            data: {
                materialRequests: formattedMaterialRequests,
                toolAllocations: toolAllocations
            }
        });

    } catch (err) {
        console.error('❌ Error getting materials and tools:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};


/* ===============================
   ALLOCATE TOOL
   POST /api/supervisor/allocate-tool
================================ */
export const allocateTool = async (req, res) => {
    try {
        const {
            toolId,
            toolName,
            allocatedTo,
            allocatedToName,
            allocationDate,
            expectedReturnDate,
            condition,
            location
        } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Validate required fields
        if (!toolId || !toolName || !allocatedTo || !allocationDate) {
            return res.status(400).json({
                success: false,
                message: 'toolId, toolName, allocatedTo, and allocationDate are required'
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

        // Find the tool
        const tool = await Tool.findOne({ id: toolId });
        if (!tool) {
            return res.status(404).json({
                success: false,
                message: 'Tool not found'
            });
        }

        // Check if tool is already allocated
        if (tool.allocated) {
            return res.status(400).json({
                success: false,
                message: 'Tool is already allocated to another worker'
            });
        }

        // Update tool allocation status
        tool.allocated = true;
        tool.allocatedTo = allocatedTo;
        tool.allocatedToName = allocatedToName;
        tool.allocationDate = new Date(allocationDate);
        tool.expectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate) : null;
        tool.condition = condition || tool.condition;
        tool.location = location || tool.location;
        tool.status = 'in_use';

        await tool.save();

        // Log the tool usage
        const nextId = await Counter.getNextSequence('toolUsageLog');
        
        // Create a simple tool usage log entry (you may need to create this model)
        // For now, we'll just return success

        res.json({
            success: true,
            data: {
                allocationId: tool.id,
                toolName: tool.toolName,
                allocatedTo: allocatedToName,
                message: 'Tool allocated successfully'
            }
        });

    } catch (err) {
        console.error('❌ Error allocating tool:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

/* ===============================
   RETURN TOOL
   POST /api/supervisor/return-tool/:allocationId
================================ */
export const returnTool = async (req, res) => {
    try {
        const { allocationId } = req.params;
        const { condition, notes } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Validate required fields
        if (!allocationId) {
            return res.status(400).json({
                success: false,
                message: 'allocationId is required'
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

        // Find the tool
        const tool = await Tool.findOne({ id: parseInt(allocationId) });
        if (!tool) {
            return res.status(404).json({
                success: false,
                message: 'Tool not found'
            });
        }

        // Check if tool is allocated
        if (!tool.allocated) {
            return res.status(400).json({
                success: false,
                message: 'Tool is not currently allocated'
            });
        }

        // Update tool return status
        tool.allocated = false;
        tool.allocatedTo = null;
        tool.allocatedToName = null;
        tool.actualReturnDate = new Date();
        tool.condition = condition || tool.condition;
        tool.status = 'available';
        tool.notes = notes || tool.notes;

        await tool.save();

        res.json({
            success: true,
            data: {
                toolId: tool.id,
                toolName: tool.toolName,
                returnDate: tool.actualReturnDate,
                condition: tool.condition,
                message: 'Tool returned successfully'
            }
        });

    } catch (err) {
        console.error('❌ Error returning tool:', err);
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};
