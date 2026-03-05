import Employee from '../employees/EmployeeModel.js';
import Attendance from "../attendance/AttendanceModel.js";
import WorkerTaskProgress from "../worker/models/WorkerTaskProgressModel.js";
import Project from "../../../src/modules/project/models/ProjectModel.js";



const getMonthRange = (month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return { startDate, endDate };
};

/* ====================================================
   GET: COMPANY PAYROLL PREVIEW (MAIN TABLE)
   Supports month=YYYY-MM format
   Uses actual employee allowances/deductions and join/left dates
==================================================== */
export const getCompanyPayrollPreview = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { projectId, month } = req.query;

        if (!companyId || !month) {
            return res.status(400).json({
                message: "companyId and month are required (month format: YYYY-MM)",
            });
        }

        // Parse YYYY-MM
        const [year, monthNumber] = month.split("-").map(Number);
        if (!year || !monthNumber) {
            return res.status(400).json({
                message: "Invalid month format. Use YYYY-MM",
            });
        }

        const { startDate, endDate } = getMonthRange(monthNumber, year);

        // Only active employees
        const employees = await Employee.find({
            companyId: Number(companyId),
            status: "ACTIVE",
        });

        const payrollPreview = await Promise.all(
            employees.map(async (emp) => {
                // Adjust payroll range based on join/left dates
                const employmentStart =
                    emp.joinDate > startDate ? emp.joinDate : startDate;
                const employmentEnd =
                    emp.leftDate && emp.leftDate < endDate ? emp.leftDate : endDate;

                /* ---------------- ATTENDANCE ---------------- */
                const start = new Date(employmentStart);
                start.setHours(0, 0, 0, 0); // start of day

                const end = new Date(employmentEnd);
                end.setHours(23, 59, 59, 999); // end of day

                const attendanceQuery = {
                    employeeId: Number(emp.id), // ensure type matches collection
                    date: { $gte: start, $lte: end },
                };
                if (projectId) attendanceQuery.projectId = Number(projectId);

                const attendance = await Attendance.find(attendanceQuery);
                const daysWorked = attendance.filter(a => a.checkIn && a.checkOut).length;


                /* ---------------- OT HOURS ---------------- */
                const otQuery = {
                    employeeId: emp.id,
                    submittedAt: { $gte: employmentStart, $lte: employmentEnd },
                    status: "APPROVED",
                };
                if (projectId) otQuery.projectId = Number(projectId);

                const otRecords = await WorkerTaskProgress.find(otQuery);
                const otHours = otRecords.reduce((sum, r) => sum + (r.otHours || 0), 0);

                /* ---------------- SALARY CALCULATION ---------------- */
                const monthlySalary = emp.basicSalary || 0;
                const workingDays = 30; // demo-safe fixed value
                const dailyRate = monthlySalary / workingDays;

                const basicPay = dailyRate * daysWorked;

                // OT pay using employee OT charges if defined, else hourly rate
                const hourlyRate = dailyRate / 8;
                const otRate = emp.otCharges || hourlyRate;
                const otPay = otRate * otHours;

                // Sum employee allowances/deductions
                const allowances =
                    (emp.housingAllowance || 0) +
                    (emp.transportAllowance || 0) +
                    (emp.otherAllowance || 0);

                const deductions =
                    (emp.housingDeduction || 0) +
                    (emp.transportDeduction || 0) +
                    (emp.otherDeduction || 0);

                const netPay = basicPay + otPay + allowances - deductions;

                return {
                    employeeId: emp.id,
                    employeeCode: emp.employeeCode,
                    employeeName: emp.fullName,
                    daysWorked,
                    otHours,
                    monthlySalary,
                    workingDays,
                    basicPay,
                    otRate,
                    otPay,
                    allowances,
                    deductions,
                    netPay,
                };
            })
        );

        res.json({
            companyId: Number(companyId),
            projectId: projectId ? Number(projectId) : null,
            month,
            payrolls: payrollPreview,
            note: "Preview only – final payroll not processed",
        });
    } catch (err) {
        console.error("Company payroll preview error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


/* ====================================================
   GET: ATTENDANCE DRILL-DOWN (PROVES ATTENDANCE → SALARY)
==================================================== */
export const getAttendanceBreakdown = async (req, res) => {
    try {
        const { employeeId } = req.params;
        let { month } = req.query; // format "YYYY-MM"

        if (!employeeId || !month) {
            return res.status(400).json({ message: "employeeId and month required" });
        }

        const [year, monthNumber] = month.split("-").map(Number);
        const { startDate, endDate } = getMonthRange(monthNumber, year);

        const attendance = await Attendance.find({
            employeeId: Number(employeeId),
            date: { $gte: startDate, $lte: endDate },
        });

        // get all unique projectIds
        const projectIds = [...new Set(attendance.map((a) => a.projectId))];
        const projects = await Project.find({ id: { $in: projectIds } });
        const projectMap = {};
        projects.forEach((p) => {
            projectMap[p.id] = p.projectCode || p.projectName;
        });

        const formatted = attendance.map((a) => ({
            date: a.date,
            checkIn: a.checkIn,
            checkOut: a.checkOut,
            hours: a.totalHours || 0,
            ot: a.otHours || 0,
            project: projectMap[a.projectId] || "-",
            geoValid: a.insideGeofenceAtCheckin && a.insideGeofenceAtCheckout,
        }));

        const totalDaysWorked = formatted.filter((a) => a.checkIn && a.checkOut).length;
        const totalOtHours = formatted.reduce((sum, a) => sum + (a.ot || 0), 0);

        res.json({
            employeeId: Number(employeeId),
            totalDaysWorked,
            totalOtHours,
            records: formatted,
        });
    } catch (err) {
        console.error("Attendance breakdown error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

