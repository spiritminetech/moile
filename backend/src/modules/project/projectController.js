import Project from './models/Project.js';
import WorkerTaskAssignment from "../worker/models/WorkerTaskAssignment.js";
// import SiteChangeNotificationService from '../notification/services/SiteChangeNotificationService.js';
// ✅ Get all projects (with pagination + filters)
export const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, companyId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (companyId) filter.companyId = parseInt(companyId);

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: projects,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects',
      error: error.message,
    });
  }
};

// ✅ Get projects by company ID
export const getProjectsByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
      return res.status(400).json({ success: false, message: 'Invalid company ID format' });
    }

    const { page = 1, limit = 10, status } = req.query;

    const filter = { companyId };
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: projects,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching projects by company:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company projects',
      error: error.message,
    });
  }
};

// ✅ Get single project by numeric ID
export const getProjectById = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project',
      error: error.message,
    });
  }
};

// ✅ Create new project
export const createProject = async (req, res) => {
  try {
    const lastProject = await Project.findOne().sort({ id: -1 });
    const newId = lastProject ? lastProject.id + 1 : 1;

    const projectData = {
      id: newId,
      ...req.body,
    };

    if (!projectData.name || !projectData.companyId) {
      return res.status(400).json({
        success: false,
        message: 'Project name and company ID are required',
      });
    }

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    console.error('❌ Error creating project:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Project code already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating project',
      error: error.message,
    });
  }
};

// ✅ Update project
export const updateProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData._id;

    // Get the current project data before update to detect changes
    const currentProject = await Project.findOne({ id: projectId });
    if (!currentProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = await Project.findOneAndUpdate(
      { id: projectId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // Check for site changes that require notifications
    await handleSiteChangeNotifications(currentProject, project, updateData);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    console.error('❌ Error updating project:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Project code already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating project',
      error: error.message,
    });
  }
};

/**
 * Handle site change notifications when project is updated
 * Implements Requirements 2.1, 2.2, 2.3, 2.4
 */
async function handleSiteChangeNotifications(currentProject, updatedProject, updateData) {
  try {
    // Get all workers assigned to this project
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });
    
    const assignments = await WorkerTaskAssignment.find({
      projectId: updatedProject.id,
      date: today
    });
    
    const affectedWorkerIds = assignments.map(a => a.employeeId);

    // Check for location changes (Requirement 2.1)
    const locationChanged = hasLocationChanged(currentProject, updatedProject);
    if (locationChanged && affectedWorkerIds.length > 0) {
      const oldLocation = {
        latitude: currentProject.latitude,
        longitude: currentProject.longitude,
        address: currentProject.address
      };
      const newLocation = {
        latitude: updatedProject.latitude,
        longitude: updatedProject.longitude,
        address: updatedProject.address
      };

      // Send location change notifications to all affected workers
      for (const workerId of affectedWorkerIds) {
        try {
          await SiteChangeNotificationService.notifyLocationChange(
            workerId,
            oldLocation,
            newLocation,
            updatedProject.id
          );
        } catch (error) {
          console.error(`Failed to send location change notification to worker ${workerId}:`, error);
        }
      }
    }

    // Check for supervisor reassignment (Requirement 2.2)
    if (currentProject.supervisorId !== updatedProject.supervisorId && affectedWorkerIds.length > 0) {
      // Send supervisor reassignment notifications to all affected workers
      for (const workerId of affectedWorkerIds) {
        try {
          await SiteChangeNotificationService.notifySupervisorReassignment(
            workerId,
            currentProject.supervisorId,
            updatedProject.supervisorId,
            updatedProject.id
          );
        } catch (error) {
          console.error(`Failed to send supervisor reassignment notification to worker ${workerId}:`, error);
        }
      }
    }

    // Check for geofence updates (Requirement 2.3)
    const geofenceChanged = hasGeofenceChanged(currentProject, updatedProject);
    if (geofenceChanged && affectedWorkerIds.length > 0) {
      const geofenceChanges = {
        oldGeofence: currentProject.geofence,
        newGeofence: updatedProject.geofence,
        oldRadius: currentProject.geofenceRadius,
        newRadius: updatedProject.geofenceRadius
      };

      try {
        await SiteChangeNotificationService.notifyGeofenceUpdate(
          updatedProject.id,
          affectedWorkerIds,
          geofenceChanges
        );
      } catch (error) {
        console.error('Failed to send geofence update notifications:', error);
      }
    }

  } catch (error) {
    console.error('Error handling site change notifications:', error);
    // Don't throw error to prevent project update from failing
  }
}

/**
 * Check if project location has changed
 */
function hasLocationChanged(currentProject, updatedProject) {
  return (
    currentProject.latitude !== updatedProject.latitude ||
    currentProject.longitude !== updatedProject.longitude ||
    currentProject.address !== updatedProject.address
  );
}

/**
 * Check if project geofence has changed
 */
function hasGeofenceChanged(currentProject, updatedProject) {
  // Check basic geofence radius
  if (currentProject.geofenceRadius !== updatedProject.geofenceRadius) {
    return true;
  }

  // Check enhanced geofence structure
  const oldGeofence = currentProject.geofence;
  const newGeofence = updatedProject.geofence;

  if (!oldGeofence && !newGeofence) {
    return false;
  }

  if (!oldGeofence || !newGeofence) {
    return true;
  }

  return (
    oldGeofence.center?.latitude !== newGeofence.center?.latitude ||
    oldGeofence.center?.longitude !== newGeofence.center?.longitude ||
    oldGeofence.radius !== newGeofence.radius ||
    oldGeofence.strictMode !== newGeofence.strictMode ||
    oldGeofence.allowedVariance !== newGeofence.allowedVariance
  );
}

// ✅ Delete project
export const deleteProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    const project = await Project.findOneAndDelete({ id: projectId });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
      data: { id: projectId },
    });
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project',
      error: error.message,
    });
  }
};

// ✅ Get project statistics
export const getProjectStats = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
      return res.status(400).json({ success: false, message: 'Invalid company ID format' });
    }

    const stats = await Project.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
        },
      },
    ]);

    const totalProjects = await Project.countDocuments({ companyId });
    const totalBudgetResult = await Project.aggregate([
      { $match: { companyId } },
      { $group: { _id: null, total: { $sum: '$budget' } } },
    ]);

    res.json({
      success: true,
      data: {
        stats,
        totalProjects,
        totalBudget: totalBudgetResult[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project statistics',
      error: error.message,
    });
  }
};


export const getAssignedProjects = async (req, res) => {
  try {
    const employeeId = Number(req.query.employeeId);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required"
      });
    }

    // ✅ India-safe today date (avoid UTC mistakes)
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    // 1️⃣ Get today's assignments from correct collection
    const assignments = await WorkerTaskAssignment.find({
      employeeId,
      date: today
    });

    if (!assignments.length) {
      return res.status(200).json({
        success: true,
        projects: []
      });
    }

    // 2️⃣ Remove duplicate project IDs
    const projectIds = [...new Set(assignments.map(a => a.projectId))];

    // 3️⃣ Fetch project details
    const projects = await Project.find({
      id: { $in: projectIds }
    }).select("id projectName");

    return res.status(200).json({
      success: true,
      projects
    });

  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}