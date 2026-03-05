import express from "express";
import {
  getCompanyPayrollPreview,
  getAttendanceBreakdown,
} from "./payrollController.js";

const router = express.Router();

/* ----------------------------------------------------
   COMPANY PAYROLL PREVIEW (MAIN SCREEN)
   /api/payroll/preview/company/:companyId
   ?projectId=&month=&year=
---------------------------------------------------- */
router.get(
  "/preview/company/:companyId",
  getCompanyPayrollPreview
);

/* ----------------------------------------------------
   ATTENDANCE → SALARY DRILL-DOWN
   /api/payroll/attendance/:employeeId
   ?month=&year=
---------------------------------------------------- */
router.get("/attendance/breakdown/:employeeId", getAttendanceBreakdown);


export default router;