import Project from '../project/models/ProjectModel.js';
import ProjectDailyProgress from '../project/models/ProjectDailyProgressModel.js';
import ProjectDailyProgressPhoto from '../project/models/ProjectDailyProgressPhotoModel.js';

/**
 * GET /api/boss/progress-reports?companyId=1&date=YYYY-MM-DD
 * Returns boss view: per-project daily progress with photos, remarks, and issues.
 */
export const getBossProgressReports = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }

    // ================= DATE RANGE =================
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // ================= FETCH ALL ACTIVE PROJECTS =================
    const projects = await Project.find({
      status: { $regex: /^active$/i }
    }).lean();

    const projectIds = projects.map(p => p.id);

    // ================= FETCH DAILY PROGRESS =================
    const dailyProgress = await ProjectDailyProgress.find({
      projectId: { $in: projectIds },
      date: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    const dailyProgressIds = dailyProgress.map(dp => dp.id);

    // ================= FETCH PHOTOS =================
    const photos = await ProjectDailyProgressPhoto.find({
      dailyProgressId: { $in: dailyProgressIds }
    }).lean();

    // Map photos by dailyProgressId
    const photoMap = new Map();
    photos.forEach(p => {
      if (!photoMap.has(p.dailyProgressId)) photoMap.set(p.dailyProgressId, []);
      photoMap.get(p.dailyProgressId).push(p.photoUrl);
    });

    // ================= BUILD RESPONSE =================
    const reports = dailyProgress.map(dp => {
      const project = projects.find(p => p.id === dp.projectId);
      return {
        projectId: dp.projectId,
        projectName: project?.projectName || 'Unknown',
        date: dp.date,
        progress: dp.overallProgress,
        remarks: dp.remarks || '',
        issues: dp.issues || '',
        photos: photoMap.get(dp.id) || []
      };
    });

    return res.json({
      date,
      reports
    });

  } catch (error) {
    console.error('Boss Progress Reports Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch progress reports',
      error: error.message
    });
  }
};
