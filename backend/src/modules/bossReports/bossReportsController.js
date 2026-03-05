import Employee from '../employees/EmployeeModel.js';
import Attendance from '../attendance/AttendanceModel.js';
import Project from '../project/models/ProjectModel.js';
import ProjectManpowerRequirement from '../project/models/ProjectManpowerRequirementModel.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import WorkerTaskProgress from '../worker/models/WorkerTaskProgressModel.js';

/* 1️⃣ ATTENDANCE SUMMARY */
export const getAttendanceSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: 'from & to dates are required' });
    }

    const start = new Date(from);
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);

    const totalWorkers = await Employee.countDocuments({ status: 'ACTIVE' });

    const stats = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
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
                { $gt: ['$checkIn', new Date(`${from}T08:00:00Z`)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const totalDays =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const present = stats[0]?.present || 0;
    const late = stats[0]?.late || 0;

    const attendancePercent =
      totalWorkers > 0
        ? Math.round((present / (totalWorkers * totalDays)) * 100)
        : 0;

    res.json({
      period: { from, to },
      totalWorkers,
      averageAttendancePercent: attendancePercent,
      absentRate: 100 - attendancePercent,
      lateOccurrences: late
    });
  } catch (error) {
    console.error('getAttendanceSummary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* 2️⃣ WORKER COMPARISON */
export const getWorkerComparison = async (req, res) => {
  try {
    const workers = await Employee.find({ status: 'ACTIVE' }).lean();

    const result = [];

    for (const w of workers) {
      const presentCount = await Attendance.countDocuments({
        employeeId: w.id,
        checkIn: { $ne: null }
      });

      result.push({
        employeeId: w.id,
        name: w.fullName,
        trade: w.jobTitle,
        attendancePercent: Math.min(100, presentCount), // intentional simplification
        taskCompletion: 0
      });
    }

    res.json({
      topPerformers: result
        .sort((a, b) => b.attendancePercent - a.attendancePercent)
        .slice(0, 5)
    });
  } catch (error) {
    console.error('getWorkerComparison:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* 3️⃣ PROJECT UTILIZATION */
export const getProjectUtilization = async (req, res) => {
  try {
    const projects = await Project.find().lean();
    const data = [];

    for (const p of projects) {
      const plannedAgg = await ProjectManpowerRequirement.aggregate([
        { $match: { projectId: p.id } },
        {
          $group: {
            _id: null,
            total: { $sum: '$requiredWorkers' }
          }
        }
      ]);

      const actual = await Attendance.countDocuments({
        projectId: p.id,
        checkIn: { $ne: null }
      });

      const planned = plannedAgg[0]?.total || 0;

      data.push({
        projectCode: p.projectCode,
        plannedManDays: planned,
        actualManDays: actual,
        variance: actual - planned
      });
    }

    res.json({ projects: data });
  } catch (error) {
    console.error('getProjectUtilization:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* 4️⃣ REPORT APPROVAL */
// export const approveReport = async (req, res) => {
//   try {
//     const { reportType, period } = req.body;

//     res.json({
//       status: 'APPROVED',
//       reportType,
//       period,
//       approvedBy: req.user.id,
//       approvedAt: new Date()
//     });
//   } catch (error) {
//     console.error('approveReport:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
export const approveReport = async (req, res) => {
  try {
    // read reportType & period from body
    const { reportType, period } = req.body;

    // if you don't have auth yet, use SYSTEM as fallback
    const approvedBy = req.user?.id || 'SYSTEM';

    res.json({
      status: 'APPROVED',
      reportType,
      period,
      approvedBy,
      approvedAt: new Date()
    });
  } catch (error) {
    console.error('approveReport:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const exportReport = async (req, res) => {
  try {
    const { format, period } = req.body;

    if (!format || !period?.from || !period?.to) {
      return res.status(400).json({ message: 'format and period required' });
    }

    const start = new Date(period.from);
    const end = new Date(period.to);
    end.setUTCHours(23, 59, 59, 999);

    /* ================= ATTENDANCE SUMMARY ================= */
    const totalWorkers = await Employee.countDocuments({ status: 'ACTIVE' });

    const attendanceAgg = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
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
                { $gt: ['$checkIn', new Date(`${period.from}T08:00:00Z`)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const totalDays =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const present = attendanceAgg[0]?.present || 0;
    const late = attendanceAgg[0]?.late || 0;

    const attendanceSummary = {
      totalWorkers,
      averageAttendancePercent:
        totalWorkers > 0
          ? Math.round((present / (totalWorkers * totalDays)) * 100)
          : 0,
      absentRate:
        totalWorkers > 0
          ? 100 -
            Math.round((present / (totalWorkers * totalDays)) * 100)
          : 0,
      lateOccurrences: late
    };

    /* ================= WORKER COMPARISON ================= */
    const workers = await Employee.find({ status: 'ACTIVE' }).lean();
    const workerComparison = [];

    for (const w of workers) {
      const presentCount = await Attendance.countDocuments({
        employeeId: w.id,
        checkIn: { $ne: null }
      });

      workerComparison.push({
        name: w.fullName,
        trade: w.jobTitle,
        attendancePercent: Math.min(100, presentCount)
      });
    }

    workerComparison.sort(
      (a, b) => b.attendancePercent - a.attendancePercent
    );

    /* ================= PROJECT UTILIZATION ================= */
    const projects = await Project.find().lean();
    const projectUtilization = [];

    for (const p of projects) {
      const plannedAgg = await ProjectManpowerRequirement.aggregate([
        { $match: { projectId: p.id } },
        { $group: { _id: null, total: { $sum: '$requiredWorkers' } } }
      ]);

      const actual = await Attendance.countDocuments({
        projectId: p.id,
        checkIn: { $ne: null }
      });

      projectUtilization.push({
        projectCode: p.projectCode,
        plannedManDays: plannedAgg[0]?.total || 0,
        actualManDays: actual,
        variance: actual - (plannedAgg[0]?.total || 0)
      });
    }

    /* ================= PDF EXPORT ================= */
    if (format === 'PDF') {
      const doc = new PDFDocument({ margin: 40 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Report_${period.from}_${period.to}.pdf`
      );

      doc.pipe(res);

      // TITLE
      doc.fontSize(20).text('Management Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(
        `Period: ${period.from} → ${period.to}`,
        { align: 'center' }
      );
      doc.moveDown(2);

      // ATTENDANCE SUMMARY
      doc.fontSize(16).text('Attendance Summary', { underline: true });
      doc.moveDown(1);
      doc.fontSize(12);
      doc.text(`Total Workers           : ${attendanceSummary.totalWorkers}`);
      doc.text(`Average Attendance (%)  : ${attendanceSummary.averageAttendancePercent}`);
      doc.text(`Absent Rate (%)         : ${attendanceSummary.absentRate}`);
      doc.text(`Late Occurrences        : ${attendanceSummary.lateOccurrences}`);
      doc.moveDown(2);

      // WORKERS
      doc.fontSize(16).text('Top Workers', { underline: true });
      doc.moveDown(1);
      workerComparison.slice(0, 5).forEach((w, i) => {
        doc.fontSize(12).text(
          `${i + 1}. ${w.name} | ${w.trade} | ${w.attendancePercent}%`
        );
      });
      doc.moveDown(2);

      // PROJECTS
      doc.fontSize(16).text('Project Utilization', { underline: true });
      doc.moveDown(1);
      projectUtilization.forEach(p => {
        doc.fontSize(12);
        doc.text(`Project Code   : ${p.projectCode}`);
        doc.text(`Planned Man-Days: ${p.plannedManDays}`);
        doc.text(`Actual Man-Days : ${p.actualManDays}`);
        doc.text(`Variance       : ${p.variance}`);
        doc.moveDown(1);
      });

      doc.moveDown(2);
      doc.fontSize(9).text(
        `Generated on ${new Date().toLocaleString()}`,
        { align: 'right' }
      );

      doc.end();
      return;
    }

    /* ================= EXCEL (OPTIONAL) ================= */
    if (format === 'EXCEL') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report');

      sheet.addRow(['Attendance Summary']);
      sheet.addRow(['Total Workers', attendanceSummary.totalWorkers]);
      sheet.addRow(['Attendance %', attendanceSummary.averageAttendancePercent]);
      sheet.addRow(['Absent %', attendanceSummary.absentRate]);
      sheet.addRow(['Late', attendanceSummary.lateOccurrences]);
      sheet.addRow([]);

      sheet.addRow(['Top Workers']);
      workerComparison.slice(0, 5).forEach(w =>
        sheet.addRow([w.name, w.trade, `${w.attendancePercent}%`])
      );
      sheet.addRow([]);

      sheet.addRow(['Project Utilization']);
      projectUtilization.forEach(p =>
        sheet.addRow([
          p.projectCode,
          p.plannedManDays,
          p.actualManDays,
          p.variance
        ])
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Report_${period.from}_${period.to}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    return res.status(400).json({ message: 'Invalid format' });
  } catch (error) {
    console.error('exportReport:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


