import Project from '../project/models/ProjectModel.js';
import Employee from '../employees/EmployeeModel.js';
import ProjectDailyProgress from '../project/models/ProjectDailyProgressModel.js';
import WorkerTaskAssignment from '../workerTaskAssignment/WorkerTaskAssignmentModel.js';

export const getFullProjectList = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        message: 'companyId is required'
      });
    }

    /* ================= PROJECTS ================= */
    const projects = await Project.find({ companyId }).lean();

    if (!projects.length) {
      return res.json({
        companyId,
        summary: {
          total: 0,
          onTrack: 0,
          delayed: 0,
          completed: 0
        },
        projects: []
      });
    }

    const projectIds = projects.map(p => p.id);

    /* ================= LATEST PROGRESS ================= */
    const progressDocs = await ProjectDailyProgress.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$projectId',
          overallProgress: { $first: '$overallProgress' }
        }
      }
    ]);

    const progressMap = new Map(
      progressDocs.map(p => [Number(p._id), p.overallProgress])
    );

    /* ================= MANAGER RESOLUTION ================= */
    const assignments = await WorkerTaskAssignment.find({
      projectId: { $in: projectIds },
      companyId
    }).lean();

    const projectManagerMap = {};
    assignments.forEach(a => {
      if (!projectManagerMap[a.projectId] && a.supervisorId) {
        projectManagerMap[a.projectId] = a.supervisorId;
      }
    });

    const managerIds = [...new Set(Object.values(projectManagerMap))];

    const managers = await Employee.find({
      id: { $in: managerIds },
      companyId
    }).lean();

    const managerMap = new Map(
      managers.map(m => [
        m.id,
        {
          id: m.id,
          name: m.fullName || m.name || 'Unknown'
        }
      ])
    );

    /* ================= PROJECT STATUS LOGIC ================= */
    const today = new Date();

    let delayed = 0;
    let completed = 0;
    let onTrack = 0;

    const projectList = projects.map(p => {
      const progress = progressMap.get(Number(p.id)) || 0;

      let status = 'ON_TRACK';

      if (p.actualEndDate) {
        status = 'COMPLETED';
        completed++;
      } else if (
        p.expectedEndDate &&
        new Date(p.expectedEndDate) < today &&
        progress < 100
      ) {
        status = 'DELAYED';
        delayed++;
      } else {
        onTrack++;
      }

      return {
        projectId: p.id,
        projectCode: p.projectCode,
        projectName: p.projectName,

        startDate: p.startDate || null,
        expectedEndDate: p.expectedEndDate || null,
        actualEndDate: p.actualEndDate || null,

        manager: managerMap.get(projectManagerMap[p.id]) || null,

        status,
        overallProgress: progress
      };
    });

    /* ================= RESPONSE ================= */
    return res.json({
      companyId,
      summary: {
        total: projects.length,
        onTrack,
        delayed,
        completed
      },
      projects: projectList
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Full project list fetch failed',
      error: error.message
    });
  }
};
