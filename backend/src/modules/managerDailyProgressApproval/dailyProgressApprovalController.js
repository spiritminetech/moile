import ProjectDailyProgress from "../project/models/ProjectDailyProgressModel.js";
import ProjectDailyProgressPhoto from "../project/models/ProjectDailyProgressPhotoModel.js";
import Project from "../project/models/ProjectModel.js";
import Employee from "../employees/EmployeeModel.js";

/**
 * GET /api/daily-progress/pending
 * Manager: View pending approvals
 */
export const getPendingDailyProgress = async (req, res) => {
  try {
    const { projectId, date } = req.query;

    const filter = { approvalStatus: "PENDING" };

    if (projectId) filter.projectId = Number(projectId);

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      filter.date = d;
    }

  const data = await ProjectDailyProgress.aggregate([
  { $match: filter },

  {
    $lookup: {
      from: "projects",
      localField: "projectId",
      foreignField: "id",
      as: "project"
    }
  },
  { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

  {
    $lookup: {
      from: "employees",
      localField: "supervisorId",
      foreignField: "userId",
      as: "supervisor"
    }
  },
  { $unwind: { path: "$supervisor", preserveNullAndEmptyArrays: true } },

  {
    $project: {
      id: 1,
      date: 1,
      approvalStatus: 1,
      overallProgress: 1,       // <-- added
      projectId: 1,
      projectName: "$project.projectName",
      supervisorId: 1,
      supervisorName: "$supervisor.fullName",
      submittedAt: 1
    }
  },

  { $sort: { submittedAt: -1 } }
]);


    res.json({ count: data.length, data });
  } catch (error) {
    console.error("getPendingDailyProgress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/daily-progress/:id
 * Manager: View single progress
 */
 // make sure you have this

export const getDailyProgressDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const progress = await ProjectDailyProgress.findOne({ id }).lean();
    if (!progress) {
      return res.status(404).json({ message: "Daily progress not found" });
    }

    // Fetch project and supervisor in parallel
    const [photos, project, supervisor] = await Promise.all([
      ProjectDailyProgressPhoto.find({ dailyProgressId: id }).lean(),
      Project.findOne({ id: progress.projectId }).lean(),
      Employee.findOne({ userId: progress.supervisorId }).lean()
    ]);

    res.json({ 
      progress, 
      project, 
      supervisorName: supervisor?.fullName || "-" , 
      photos 
    });
  } catch (error) {
    console.error("getDailyProgressDetail:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * POST /api/daily-progress/:id/approve
 */
export const approveDailyProgress = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const managerId = req.user.id;

    const progress = await ProjectDailyProgress.findOne({ id });
    if (!progress) {
      return res.status(404).json({ message: "Daily progress not found" });
    }

    if (progress.approvalStatus !== "PENDING") {
      return res.status(400).json({ message: "Progress already processed" });
    }

    progress.approvalStatus = "APPROVED";
    progress.approvedBy = managerId;
    progress.approvedAt = new Date();
    progress.rejectionReason = null;

    await progress.save();

    res.json({
      message: "Daily progress approved",
      progress
    });
  } catch (error) {
    console.error("approveDailyProgress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/daily-progress/:id/reject
 */
export const rejectDailyProgress = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    const managerId = req.user.id;

    if (!reason?.trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const progress = await ProjectDailyProgress.findOne({ id });
    if (!progress) {
      return res.status(404).json({ message: "Daily progress not found" });
    }

    if (progress.approvalStatus !== "PENDING") {
      return res.status(400).json({ message: "Progress already processed" });
    }

    progress.approvalStatus = "REJECTED";
    progress.approvedBy = managerId;
    progress.approvedAt = new Date();
    progress.rejectionReason = reason;

    await progress.save();

    res.json({
      message: "Daily progress rejected",
      progress
    });
  } catch (error) {
    console.error("rejectDailyProgress:", error);
    res.status(500).json({ message: "Server error" });
  }
};
