import Employee from "../../employees/EmployeeModel.js";
import CompanyUser from "../../companyUser/CompanyUserModel.js";
import Role from "../../role/RoleModel.js";
import EmployeeWorkPass from "../../employees/submodules/employeeWorkPass/EmployeeWorkPassModel.js";
import WorkerTaskAssignment from "../../workerTaskAssignment/WorkerTaskAssignmentModel.js";
import Project from "../../project/models/ProjectModel.js";

/**
 * GET /api/workers?companyId=1&search=ram
 * Returns all workers for a company (RBAC-safe)
 */
export const getWorkerList = async (req, res) => {
  try {
    const { companyId, search } = req.query;
    if (!companyId)
      return res.status(400).json({ message: "companyId is required" });

    /* 1️⃣ Resolve worker roles */
    const workerRoles = await Role.find({
      $or: [{ name: { $in: ["WORKER", "STAFF"] } }, { level: 1 }],
      isSystemRole: true,
    }).lean();

    const workerRoleIds = workerRoles.map(r => r.id);
    if (!workerRoleIds.length) return res.json([]);

    /* 2️⃣ Active company users with worker roles */
    const companyUsers = await CompanyUser.find({
      companyId: Number(companyId),
      roleId: { $in: workerRoleIds },
      isActive: true,
    }).lean();

    const userIds = companyUsers.map(u => u.userId);
    if (!userIds.length) return res.json([]);

    /* 3️⃣ Employees */
    const employeeFilter = {
      companyId: Number(companyId),
      userId: { $in: userIds },
    };

    if (search) {
      employeeFilter.fullName = { $regex: search, $options: "i" };
    }

    const employees = await Employee.find(employeeFilter).lean();
    if (!employees.length) return res.json([]);

    const employeeIds = employees.map(e => e.id);

    /* 4️⃣ Work pass */
    const workPassDocs = await EmployeeWorkPass.find({
      employeeId: { $in: employeeIds },
    }).lean();

    const workPassMap = new Map();
    workPassDocs.forEach(wp => {
      let status = "UNKNOWN";

      if (wp.status === "PENDING") status = "Pending";
      else if (wp.expiryDate && wp.expiryDate < new Date()) status = "Expired";
      else if (wp.status === "ISSUED") status = "Valid";

      workPassMap.set(wp.employeeId, {
        status,
        expiryDate: wp.expiryDate,
      });
    });

    /* 5️⃣ Response */
    const result = employees.map(e => ({
      employeeId: e.id,
      name: e.fullName,
      trade: e.jobTitle || "UNKNOWN",
      status: e.status,
      workPass: workPassMap.get(e.id) || {
        status: "N/A",
        expiryDate: null,
      },
    }));

    return res.json(result);

  } catch (err) {
    console.error("❌ getWorkerList error:", err);
    return res.status(500).json({
      message: "Failed to fetch workers",
      error: err.message,
    });
  }
};

/**
 * GET /api/workers/:workerId?companyId=1
 * Returns worker profile (company + role safe)
 */
export const getWorkerProfile = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { companyId } = req.query;

    if (!workerId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "workerId and companyId are required",
      });
    }

    /* 1️⃣ Employee */
    const employee = await Employee.findOne({
      id: Number(workerId),
      companyId: Number(companyId),
      status: { $regex: /^active$/i },
    }).lean();

    if (!employee)
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });

    /* 2️⃣ Company user + role */
    const companyUser = await CompanyUser.findOne({
      userId: employee.userId,
      companyId: Number(companyId),
      isActive: true,
    }).lean();

    if (!companyUser)
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });

    const role = await Role.findOne({
      id: companyUser.roleId,
      $or: [{ name: { $in: ["WORKER", "STAFF"] } }, { level: 1 }],
    }).lean();

    if (!role)
      return res.status(403).json({
        success: false,
        message: "Not a worker role",
      });

    /* 3️⃣ Task assignments */
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      companyId: Number(companyId),
    }).lean();

    const projectIds = [...new Set(assignments.map(a => a.projectId))];

    /* 4️⃣ Projects */
    const projects = await Project.find({
      id: { $in: projectIds },
      companyId: Number(companyId),
    }).lean();

    const assignedProjects = projects.map(p => ({
      projectId: p.id,
      projectName: p.projectName,
    }));

    /* 5️⃣ Work pass */
    const workPass = await EmployeeWorkPass.findOne({
      employeeId: employee.id,
    }).lean();

    let workPassStatus = "N/A";
    let workPassExpiry = null;

    if (workPass) {
      workPassExpiry = workPass.expiryDate;
      if (workPass.status === "PENDING") workPassStatus = "Pending";
      else if (workPass.expiryDate && workPass.expiryDate < new Date())
        workPassStatus = "Expired";
      else if (workPass.status === "ISSUED") workPassStatus = "Valid";
    }

    /* 6️⃣ Response */
    return res.json({
      success: true,
      data: {
        employeeId: employee.id,
        name: employee.fullName,
        trade: employee.jobTitle || "UNKNOWN",
        status: employee.status,
        role: role.name,
        workPassStatus,
        workPassExpiry,
        assignedProjects,
      },
    });

  } catch (err) {
    console.error("❌ getWorkerProfile error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch worker profile",
      error: err.message,
    });
  }
};
