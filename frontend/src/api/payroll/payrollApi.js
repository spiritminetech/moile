// src/api/payrollApi.js
import API from "../axios";

/**
 * Fetch list of companies
 */
export const fetchCompanies = (params) => {
  return API.get("/companies", { params });
};

/**
 * Fetch projects by company
 * @param {number} companyId
 */
export const fetchProjects = (companyId) => {
  if (!companyId) {
    return Promise.resolve({ data: [] });
  }

  return API.get(`/projects`, {
    params: { companyId },
  });
};

/**
 * Fetch payroll preview for a company + project + month
 * @param {number} companyId
 * @param {number} projectId
 * @param {string} month - format "YYYY-MM"
 */
export const fetchPayrollPreview = (companyId, projectId, month) => {
  if (!companyId || !month) {
    return Promise.resolve({ data: { payrolls: [] } });
  }

  return API.get(`/payroll/preview/company/${companyId}`, {
    params: {
      projectId,
      month,
    },
  });
};

/**
 * Attendance drill-down for an employee
 * @param {string} employeeId
 * @param {string} month - format "YYYY-MM"
 */
export const fetchAttendanceBreakdown = (employeeId, month) => {
  if (!employeeId || !month) {
    return Promise.resolve({ data: [] });
  }

 return API.get(`/payroll/attendance/breakdown/${employeeId}`, {
    params: { month },
  });
};
