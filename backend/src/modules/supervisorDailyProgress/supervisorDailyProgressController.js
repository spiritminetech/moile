import WorkerTaskProgress from "../worker/models/WorkerTaskProgress.js";
import ProjectDailyProgress from "../project/models/ProjectDailyProgress.js";
import ProjectDailyProgressPhoto from "../project/models/ProjectDailyProgressPhoto.js";
import Project from "../project/models/Project.js";
import WorkerTaskAssignment from "../worker/models/WorkerTaskAssignment.js";
import ProjectManpowerRequirement from "../project/models/ProjectManpowerRequirement.js";
import ProjectMaterialRequirement from "../project/models/ProjectMaterialRequirement.js";

/* ----------------------------------------------------
   POST: Submit Daily Progress (SUPERVISOR)
---------------------------------------------------- */
export const submitDailyProgress = async (req, res) => {
    try {
        const { projectId, remarks = "", issues = "" } = req.body;

        if (!projectId) {
            return res.status(400).json({ message: "projectId is required" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayStr = new Date().toISOString().split("T")[0];

        const assignments = await WorkerTaskAssignment.find({
            projectId: Number(projectId),
            date: todayStr
        });



        if (!assignments.length) {
            return res.status(400).json({
                message: "No worker assignments today"
            });
        }

        const assignmentIds = assignments.map(a => a.id);

        // 2️⃣ Get APPROVED progress via assignmentId
        const approvedProgress = await WorkerTaskProgress.find({
            workerTaskAssignmentId: { $in: assignmentIds },
            status: "APPROVED",
            submittedAt: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!approvedProgress.length) {
            return res.status(400).json({
                message: "No approved worker progress found"
            });
        }

        // 3️⃣ Calculate progress
        const total = approvedProgress.reduce(
            (sum, p) => sum + p.progressPercent,
            0
        );

        const overallProgress = Math.round(total / approvedProgress.length);


        const lastProgress = await ProjectDailyProgress.findOne().sort({ id: -1 });
        const nextId = lastProgress && typeof lastProgress.id === "number" ? lastProgress.id + 1 : 1;

        // Get supervisorId from Project
        const project = await Project.findOne({ id: Number(projectId) });
        if (!project || !project.supervisorId) {
            return res.status(400).json({
                message: "Project not found or supervisor not assigned"
            });
        }
        const supervisorId = project.supervisorId;

        const dailyProgress = await ProjectDailyProgress.create({
            id: nextId,
            projectId: Number(projectId),
            supervisorId,             // <-- added supervisorId
            date: today,
            overallProgress,
            remarks,
            issues,
            submittedAt: new Date()
        });

        return res.status(201).json({
            message: "Daily progress submitted successfully",
            dailyProgress
        });


    } catch (err) {
        console.error("submitDailyProgress error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ----------------------------------------------------
   POST: Upload Daily Progress Photos
---------------------------------------------------- */


export const uploadDailyProgressPhotos = async (req, res) => {
  try {
    const { projectId, dailyProgressId, remarks = "", issues = "" } = req.body;

    const numericProjectId = Number(projectId);
    if (!numericProjectId || isNaN(numericProjectId)) {
      return res.status(400).json({ message: "projectId must be a valid number" });
    }

    if (!req.files?.length) {
      return res.status(400).json({ message: "No photos uploaded" });
    }

    // Get supervisorId from Project
    const project = await Project.findOne({ id: numericProjectId });
    if (!project || !project.supervisorId) {
      return res.status(400).json({ message: "Project not found or supervisor not assigned" });
    }
    const supervisorId = project.supervisorId;

    let numericDailyProgressId = Number(dailyProgressId);
    let dailyProgressRecord;

    // If dailyProgressId is invalid or missing, create a new daily progress record
    if (!numericDailyProgressId || isNaN(numericDailyProgressId)) {
      // Calculate overall progress from approved worker tasks today
      const todayStr = new Date().toISOString().split("T")[0];
      const assignments = await WorkerTaskAssignment.find({
        projectId: numericProjectId,
        date: todayStr
      });

      if (!assignments.length) {
        return res.status(400).json({ message: "No worker assignments today" });
      }

      const assignmentIds = assignments.map(a => a.id);

      const approvedProgress = await WorkerTaskProgress.find({
        workerTaskAssignmentId: { $in: assignmentIds },
        status: "APPROVED"
      });

      const overallProgress =
        approvedProgress.length > 0
          ? Math.round(approvedProgress.reduce((sum, p) => sum + p.progressPercent, 0) / approvedProgress.length)
          : 0;

      // Generate numeric id safely
      const lastProgress = await ProjectDailyProgress.findOne().sort({ id: -1 });
      numericDailyProgressId = lastProgress && typeof lastProgress.id === "number" ? lastProgress.id + 1 : 1;

      dailyProgressRecord = await ProjectDailyProgress.create({
        id: numericDailyProgressId,
        projectId: numericProjectId,
        supervisorId,
        date: new Date(),
        overallProgress,
        remarks,
        issues,
        submittedAt: new Date()
      });
    } else {
      // Fetch existing daily progress
      dailyProgressRecord = await ProjectDailyProgress.findOne({ id: numericDailyProgressId });
      if (!dailyProgressRecord) {
        return res.status(404).json({ message: "Daily progress not found" });
      }
    }

    // Generate numeric id for photos
    const lastPhoto = await ProjectDailyProgressPhoto.findOne().sort({ id: -1 });
    let nextId = lastPhoto && typeof lastPhoto.id === "number" ? lastPhoto.id + 1 : 1;

    const photos = req.files.map(file => ({
      id: nextId++,
      dailyProgressId: numericDailyProgressId,
      projectId: numericProjectId,
      supervisorId,
      photoUrl: `/uploads/${file.filename}`,
      uploadedAt: new Date()
    }));

    const insertedPhotos = await ProjectDailyProgressPhoto.insertMany(photos);

    return res.json({
      message: "Daily progress and photos uploaded successfully",
      dailyProgress: dailyProgressRecord,
      count: insertedPhotos.length,
      photos: insertedPhotos
    });
  } catch (err) {
    console.error("uploadDailyProgressPhotos error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



/* ----------------------------------------------------
   GET: Daily Progress (Single Day)
---------------------------------------------------- */
export const getDailyProgressByDate = async (req, res) => {
    try {
        const { projectId, date } = req.params;

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const progress = await ProjectDailyProgress.findOne({
            projectId: Number(projectId),
            date: targetDate
        });

        if (!progress) {
            return res.status(404).json({
                message: "Daily progress not found"
            });
        }

        const photos = await ProjectDailyProgressPhoto.find({
            dailyProgressId: progress.id
        });

        return res.json({
            projectId,
            date: targetDate,
            overallProgress: progress.overallProgress,
            remarks: progress.remarks,
            issues: progress.issues,
            photos: photos.map(p => p.photoUrl),
            submittedAt: progress.submittedAt
        });
    } catch (err) {
        console.error("getDailyProgressByDate error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/* ----------------------------------------------------
   GET: Daily Progress (DATE RANGE)
---------------------------------------------------- */
export const getDailyProgressRange = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({
                message: "from and to dates are required"
            });
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);

        const progressList = await ProjectDailyProgress.find({
            projectId: Number(projectId),
            date: { $gte: fromDate, $lte: toDate }
        }).sort({ date: 1 });

        return res.json({
            projectId,
            count: progressList.length,
            data: progressList
        });
    } catch (err) {
        console.error("getDailyProgressRange error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/* ----------------------------------------------------
   POST: Log Issues / Safety Observations (NEW ENDPOINT)
---------------------------------------------------- */
export const logIssuesAndSafety = async (req, res) => {
    try {
        const {
            projectId,
            dailyProgressId,
            date,
            issues = []
        } = req.body;

        if (!projectId) {
            return res.status(400).json({ message: "projectId is required" });
        }

        if (!issues || !Array.isArray(issues) || issues.length === 0) {
            return res.status(400).json({ message: "At least one issue is required" });
        }

        // Get supervisorId from Project
        const project = await Project.findOne({ id: Number(projectId) });
        if (!project || !project.supervisorId) {
            return res.status(400).json({
                message: "Project not found or supervisor not assigned"
            });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Find or create daily progress
        let dailyProgress;
        if (dailyProgressId) {
            dailyProgress = await ProjectDailyProgress.findOne({ id: Number(dailyProgressId) });
        } else {
            dailyProgress = await ProjectDailyProgress.findOne({
                projectId: Number(projectId),
                date: targetDate
            });
        }

        if (!dailyProgress) {
            // Create new daily progress if doesn't exist
            const lastProgress = await ProjectDailyProgress.findOne().sort({ id: -1 });
            const nextId = lastProgress && typeof lastProgress.id === "number" ? lastProgress.id + 1 : 1;

            dailyProgress = await ProjectDailyProgress.create({
                id: nextId,
                projectId: Number(projectId),
                supervisorId: project.supervisorId,
                date: targetDate,
                overallProgress: 0,
                submittedAt: new Date()
            });
        }

        // Format issues as text and append to existing issues
        const issuesText = issues.map(issue => 
            `[${issue.type?.toUpperCase() || 'GENERAL'}] [${issue.severity?.toUpperCase() || 'LOW'}] ${issue.description || ''} - Status: ${issue.status || 'open'}`
        ).join('\n');

        const updatedIssues = dailyProgress.issues 
            ? `${dailyProgress.issues}\n${issuesText}` 
            : issuesText;

        // Update daily progress with issues
        dailyProgress.issues = updatedIssues;
        await dailyProgress.save();

        // Count issues by severity
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        const highSeverity = issues.filter(i => i.severity === 'high').length;

        return res.status(201).json({
            success: true,
            message: "Issues logged successfully",
            data: {
                dailyProgressId: dailyProgress.id,
                issuesRecorded: issues.length,
                criticalIssues,
                highSeverity,
                issues: issues.map((issue, index) => ({
                    id: `${dailyProgress.id}-${index + 1}`,
                    ...issue,
                    reportedAt: new Date()
                }))
            }
        });

    } catch (err) {
        console.error("logIssuesAndSafety error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ----------------------------------------------------
   POST: Track Manpower Used (NEW)
---------------------------------------------------- */
export const trackManpowerUsage = async (req, res) => {
    try {
        const {
            projectId,
            dailyProgressId,
            date,
            totalWorkers = 0,
            activeWorkers = 0,
            productivity = 0,
            efficiency = 0,
            overtimeHours = 0,
            absentWorkers = 0,
            lateWorkers = 0,
            workerBreakdown = []
        } = req.body;

        if (!projectId) {
            return res.status(400).json({ message: "projectId is required" });
        }

        // Get supervisorId from Project
        const project = await Project.findOne({ id: Number(projectId) });
        if (!project || !project.supervisorId) {
            return res.status(400).json({
                message: "Project not found or supervisor not assigned"
            });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Find or create daily progress for this date
        let dailyProgress;
        if (dailyProgressId) {
            dailyProgress = await ProjectDailyProgress.findOne({ id: Number(dailyProgressId) });
        } else {
            dailyProgress = await ProjectDailyProgress.findOne({
                projectId: Number(projectId),
                date: targetDate
            });
        }

        if (!dailyProgress) {
            // Create new daily progress if doesn't exist
            const lastProgress = await ProjectDailyProgress.findOne().sort({ id: -1 });
            const nextId = lastProgress && typeof lastProgress.id === "number" ? lastProgress.id + 1 : 1;

            dailyProgress = await ProjectDailyProgress.create({
                id: nextId,
                projectId: Number(projectId),
                supervisorId: project.supervisorId,
                date: targetDate,
                overallProgress: 0,
                remarks: `Manpower tracking for ${targetDate.toISOString().split('T')[0]}`,
                submittedAt: new Date()
            });
        }

        // Update manpower usage in daily progress
        dailyProgress.manpowerUsage = {
            totalWorkers,
            activeWorkers,
            productivity,
            efficiency,
            overtimeHours,
            absentWorkers,
            lateWorkers,
            workerBreakdown
        };
        await dailyProgress.save();

        // Calculate utilization rate
        const utilizationRate = totalWorkers > 0 
            ? Math.round((activeWorkers / totalWorkers) * 100) 
            : 0;

        return res.status(201).json({
            success: true,
            message: "Manpower data recorded successfully",
            data: {
                id: dailyProgress.id,
                utilizationRate,
                productivityScore: productivity,
                manpowerUsage: dailyProgress.manpowerUsage
            }
        });

    } catch (err) {
        console.error("trackManpowerUsage error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ----------------------------------------------------
   POST: Log Issues / Safety Observations (NEW)
---------------------------------------------------- */
export const logIssues = async (req, res) => {
    try {
        const {
            projectId,
            dailyProgressId,
            date,
            issues = []
        } = req.body;

        if (!projectId) {
            return res.status(400).json({ message: "projectId is required" });
        }

        if (!issues || !Array.isArray(issues) || issues.length === 0) {
            return res.status(400).json({ message: "At least one issue is required" });
        }

        // Get supervisorId from Project
        const project = await Project.findOne({ id: Number(projectId) });
        if (!project || !project.supervisorId) {
            return res.status(400).json({
                message: "Project not found or supervisor not assigned"
            });
        }

        const issueDate = date ? new Date(date) : new Date();
        issueDate.setHours(0, 0, 0, 0);

        // Find or create daily progress record
        let dailyProgress;
        if (dailyProgressId) {
            dailyProgress = await ProjectDailyProgress.findOne({ id: Number(dailyProgressId) });
        } else {
            dailyProgress = await ProjectDailyProgress.findOne({
                projectId: Number(projectId),
                date: issueDate
            });
        }

        if (!dailyProgress) {
            return res.status(404).json({
                message: "Daily progress record not found. Please submit daily progress first."
            });
        }

        // Format issues as text and append to existing issues
        const issuesText = issues.map(issue => {
            return `[${issue.type?.toUpperCase() || 'ISSUE'}] [${issue.severity?.toUpperCase() || 'MEDIUM'}] ${issue.description}${issue.location ? ` - Location: ${issue.location}` : ''}${issue.actionTaken ? ` - Action: ${issue.actionTaken}` : ''}`;
        }).join('\n');

        const updatedIssues = dailyProgress.issues 
            ? `${dailyProgress.issues}\n${issuesText}` 
            : issuesText;

        dailyProgress.issues = updatedIssues;
        await dailyProgress.save();

        // Count severity levels
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        const highSeverity = issues.filter(i => i.severity === 'high').length;

        return res.status(201).json({
            success: true,
            message: "Issues logged successfully",
            data: {
                issuesRecorded: issues.length,
                criticalIssues,
                highSeverity,
                dailyProgressId: dailyProgress.id
            }
        });

    } catch (err) {
        console.error("logIssues error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ----------------------------------------------------
   POST: Track Material Consumption (NEW)
---------------------------------------------------- */
export const trackMaterialConsumption = async (req, res) => {
    try {
        const {
            projectId,
            dailyProgressId,
            date,
            materials = []
        } = req.body;

        if (!projectId) {
            return res.status(400).json({ message: "projectId is required" });
        }

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return res.status(400).json({ message: "At least one material is required" });
        }

        // Get supervisorId from Project
        const project = await Project.findOne({ id: Number(projectId) });
        if (!project || !project.supervisorId) {
            return res.status(400).json({
                message: "Project not found or supervisor not assigned"
            });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Find or create daily progress for this date
        let dailyProgress;
        if (dailyProgressId) {
            dailyProgress = await ProjectDailyProgress.findOne({ id: Number(dailyProgressId) });
        } else {
            dailyProgress = await ProjectDailyProgress.findOne({
                projectId: Number(projectId),
                date: targetDate
            });
        }

        if (!dailyProgress) {
            // Create new daily progress if doesn't exist
            const lastProgress = await ProjectDailyProgress.findOne().sort({ id: -1 });
            const nextId = lastProgress && typeof lastProgress.id === "number" ? lastProgress.id + 1 : 1;

            dailyProgress = await ProjectDailyProgress.create({
                id: nextId,
                projectId: Number(projectId),
                supervisorId: project.supervisorId,
                date: targetDate,
                overallProgress: 0,
                remarks: `Material tracking for ${targetDate.toISOString().split('T')[0]}`,
                submittedAt: new Date()
            });
        }

        // Update material consumption in daily progress
        dailyProgress.materialConsumption = materials.map(material => ({
            materialId: material.materialId || null,
            materialName: material.materialName,
            consumed: material.consumed || 0,
            remaining: material.remaining || 0,
            unit: material.unit,
            plannedConsumption: material.plannedConsumption || 0,
            wastage: material.wastage || 0,
            notes: material.notes || ''
        }));
        await dailyProgress.save();

        // Calculate metrics
        let totalWastage = 0;
        let overConsumption = 0;
        const lowStockAlerts = [];

        for (const material of materials) {
            totalWastage += material.wastage || 0;
            if (material.consumed > material.plannedConsumption) {
                overConsumption++;
            }
            if (material.remaining < (material.plannedConsumption * 0.2)) {
                lowStockAlerts.push({
                    materialName: material.materialName,
                    remaining: material.remaining,
                    unit: material.unit
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: "Material consumption recorded successfully",
            data: {
                materialsTracked: materials.length,
                totalWastage,
                overConsumption,
                lowStockAlerts,
                materials: dailyProgress.materialConsumption
            }
        });

    } catch (err) {
        console.error("trackMaterialConsumption error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
