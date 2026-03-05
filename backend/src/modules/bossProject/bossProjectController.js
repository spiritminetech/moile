import Project from '../project/models/ProjectModel.js';
import Client from '../client/ClientModel.js';
import ProjectManpowerRequirement from '../project/models/ProjectManpowerRequirementModel.js';
import Attendance from '../attendance/AttendanceModel.js';
import ProjectDailyProgress from '../project/models/ProjectDailyProgressModel.js';


/* 1️⃣ GET PROJECT OVERVIEW (CORE) */
export const getProjectOverview = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid projectId' });
    }

    /* ---------------- PROJECT ---------------- */
    const project = await Project.findOne({ id: projectId }).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    /* ---------------- CLIENT ---------------- */
    const client = await Client.findOne({ id: project.clientId }).lean();

    /* ---------------- MANPOWER ---------------- */
    const manpowerAgg = await ProjectManpowerRequirement.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: null,
          required: { $sum: '$requiredWorkers' }
        }
      }
    ]);

    /* ---------------- ATTENDANCE (TODAY) ---------------- */
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const attendanceAgg = await Attendance.aggregate([
      {
        $match: {
          projectId,
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          present: {
            $sum: {
              $cond: [
                { $and: ['$checkIn', '$insideGeofenceAtCheckin'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    /* ---------------- LATEST PROGRESS (FIX) ---------------- */
    const latestProgress = await ProjectDailyProgress
      .findOne({ projectId })
      .sort({ date: -1 })
      .lean();

    const actualProgress = latestProgress?.overallProgress ?? 0;

    /* ---------------- PLANNED PROGRESS ---------------- */
    const plannedProgress =
      project.startDate &&
      project.expectedEndDate &&
      project.expectedEndDate > project.startDate
        ? Math.min(
            100,
            Math.round(
              ((Date.now() - new Date(project.startDate)) /
                (new Date(project.expectedEndDate) -
                  new Date(project.startDate))) *
                100
            )
          )
        : 0;

    /* ---------------- RESPONSE ---------------- */
    res.json({
      project: {
        id: project.id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        clientName: client?.name || null,
        status: project.status,
        startDate: project.startDate,
        plannedEndDate: project.
actualEndDate,
        expectedEndDate: project.expectedEndDate,
        overallProgress: actualProgress
      },
      plannedVsActual: {
        plannedProgress,
        actualProgress,
        variance: actualProgress - plannedProgress
      },
      manpower: {
        required: manpowerAgg[0]?.required || 0,
        present: attendanceAgg[0]?.present || 0,
        absent:
          (manpowerAgg[0]?.required || 0) -
          (attendanceAgg[0]?.present || 0)
      }
    });
  } catch (error) {
    console.error('getProjectOverview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



/* 2️⃣ GET PROJECT PROGRESS TIMELINE */
export const getProjectProgressTimeline = async (req, res) => {
  try {
    const { projectId } = req.params;

    const timeline = await ProjectDailyProgress.find({ projectId })
      .sort({ date: 1 })
      .select('date overallProgress')
      .lean();

    res.json({
      timeline: timeline.map(p => ({
        date: p.date,
        progress: p.overallProgress
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* 3️⃣ GET ATTENDANCE SNAPSHOT */
export const getAttendanceSnapshot = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const date = req.query.date;

    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid projectId' });
    }

    const required = await ProjectManpowerRequirement.aggregate([
      { $match: { projectId } },
      { $group: { _id: null, count: { $sum: '$requiredWorkers' } } }
    ]);

    const attendance = await Attendance.aggregate([
      { $match: { projectId, date } },
      {
        $group: {
          _id: null,
          present: {
            $sum: {
              $cond: [
                { $and: ['$checkIn', '$insideGeofenceAtCheckin'] },
                1,
                0
              ]
            }
          },
          late: {
            $sum: {
              $cond: [
                { $gt: ['$checkIn', new Date(`${date}T08:00:00`)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      required: required[0]?.count || 0,
      present: attendance[0]?.present || 0,
      absent:
        (required[0]?.count || 0) -
        (attendance[0]?.present || 0),
      late: attendance[0]?.late || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* 4️⃣ GET FLEET STATUS */
// export const getFleetStatus = async (req, res) => {
//   try {
//     const { projectId } = req.params;
//     const date = req.query.date;

//     const tasks = await FleetTask.find({ projectId, taskDate: date }).lean();
//     const delayed = tasks.filter(t => t.status === 'DELAYED');

//     res.json({
//       transportRequired: tasks.length > 0,
//       totalTasks: tasks.length,
//       completed: tasks.filter(t => t.status === 'COMPLETED').length,
//       delayed: delayed.length,
//       issues: delayed.map(d => ({
//         taskId: d.id,
//         reason: d.notes || 'Delayed',
//         delayMinutes: 30
//       }))
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
