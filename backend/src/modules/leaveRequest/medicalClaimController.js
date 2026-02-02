import MedicalClaim from './models/MedicalClaim.js';
import Employee from '../employee/Employee.js';
import ApprovalStatusNotificationService from '../notification/services/ApprovalStatusNotificationService.js';

/**
 * Medical Claim Controller
 * Handles medical claim operations and approval workflow
 */

/* ===============================
   Create Medical Claim (Worker)
================================ */
export const createMedicalClaim = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const {
            claimType,
            claimAmount,
            currency = 'SGD',
            treatmentDate,
            treatmentType,
            hospitalClinic,
            doctorName,
            diagnosis,
            description,
            isWorkRelated = false,
            workIncidentId
        } = req.body;

        const medicalClaim = await MedicalClaim.create({
            id: Date.now(),
            companyId: employee.companyId,
            employeeId: employee.id,
            claimType,
            claimAmount,
            currency,
            treatmentDate,
            treatmentType,
            hospitalClinic,
            doctorName,
            diagnosis,
            description,
            isWorkRelated,
            workIncidentId,
            status: 'PENDING',
            createdBy: userId
        });

        // Handle file uploads if present
        if (req.files) {
            const receipts = [];
            const medicalReports = [];

            req.files.forEach(file => {
                const fileData = {
                    fileName: file.originalname,
                    filePath: file.path.replace(/^.*[\\\/]uploads/, '/uploads'),
                    fileType: file.mimetype,
                    uploadedAt: new Date()
                };

                // Categorize files based on filename or field name
                if (file.fieldname === 'receipts' || file.originalname.toLowerCase().includes('receipt')) {
                    receipts.push(fileData);
                } else if (file.fieldname === 'medicalReports' || file.originalname.toLowerCase().includes('report')) {
                    medicalReports.push(fileData);
                } else {
                    // Default to receipts
                    receipts.push(fileData);
                }
            });

            if (receipts.length > 0 || medicalReports.length > 0) {
                await MedicalClaim.findOneAndUpdate(
                    { id: medicalClaim.id },
                    { 
                        receipts: receipts,
                        medicalReports: medicalReports
                    }
                );
            }
        }

        res.status(201).json({
            message: 'Medical claim submitted successfully',
            medicalClaimId: medicalClaim.id
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Get My Medical Claims (Worker)
================================ */
export const getMyMedicalClaims = async (req, res) => {
    try {
        const userId = req.user.id;
        const employee = await Employee.findOne({ userId }).lean();

        const claims = await MedicalClaim.find({
            employeeId: employee.id
        }).sort({ createdAt: -1 });

        res.json(claims);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Get Pending Medical Claims (Supervisor)
================================ */
export const getPendingMedicalClaims = async (req, res) => {
    try {
        const claims = await MedicalClaim.find({ status: 'PENDING' });

        // Get all unique employee IDs
        const employeeIds = [...new Set(claims.map(c => c.employeeId).filter(Boolean))];

        // Fetch employee details
        const employees = await Employee.find({ id: { $in: employeeIds } });

        // Attach employee name to each claim
        const claimsWithNames = claims.map(c => {
            const employee = employees.find(e => e.id === c.employeeId);
            return { ...c.toObject(), employeeName: employee ? employee.fullName : null };
        });

        res.json(claimsWithNames);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Approve Medical Claim
================================ */
export const approveMedicalClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvedAmount, remarks } = req.body;
        const userId = req.user.id;

        // Get the medical claim
        const medicalClaim = await MedicalClaim.findOne({ id });
        if (!medicalClaim) {
            return res.status(404).json({ message: 'Medical claim not found' });
        }

        const finalApprovedAmount = approvedAmount || medicalClaim.claimAmount;

        await MedicalClaim.findOneAndUpdate(
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
            await ApprovalStatusNotificationService.notifyMedicalClaimStatus(
                parseInt(id),
                'APPROVED',
                userId,
                {
                    employeeId: medicalClaim.employeeId,
                    claimAmount: finalApprovedAmount,
                    currency: medicalClaim.currency,
                    claimType: medicalClaim.claimType,
                    treatmentDate: medicalClaim.treatmentDate
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending medical claim approval notification:', notificationError);
            // Don't fail the approval if notification fails
        }

        res.json({ message: 'Medical claim approved successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Reject Medical Claim
================================ */
export const rejectMedicalClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const userId = req.user.id;

        // Get the medical claim
        const medicalClaim = await MedicalClaim.findOne({ id });
        if (!medicalClaim) {
            return res.status(404).json({ message: 'Medical claim not found' });
        }

        await MedicalClaim.findOneAndUpdate(
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
            await ApprovalStatusNotificationService.notifyMedicalClaimStatus(
                parseInt(id),
                'REJECTED',
                userId,
                {
                    employeeId: medicalClaim.employeeId,
                    claimAmount: medicalClaim.claimAmount,
                    currency: medicalClaim.currency,
                    claimType: medicalClaim.claimType,
                    treatmentDate: medicalClaim.treatmentDate
                },
                remarks
            );
        } catch (notificationError) {
            console.error('❌ Error sending medical claim rejection notification:', notificationError);
            // Don't fail the rejection if notification fails
        }

        res.json({ message: 'Medical claim rejected' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ===============================
   Mark Medical Claim as Processed
================================ */
export const markMedicalClaimProcessed = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await MedicalClaim.findOneAndUpdate(
            { id },
            { 
                status: 'PROCESSED',
                processedAt: new Date()
            }
        );

        res.json({ message: 'Medical claim marked as processed' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};