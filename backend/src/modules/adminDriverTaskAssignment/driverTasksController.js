import FleetTask from "../fleetTask/models/FleetTaskModel.js";
import FleetTaskPassenger from "../fleetTaskPassenger/FleetTaskPassengerModel.js";
import Driver from "../driver/DriverModel.js";
import Employee from "../employees/EmployeeModel.js";
import Project from "../project/models/ProjectModel.js";

// GET /api/driver-tasks/tasks?companyId=1&date=2026-01-16
export const getDriverTasks = async (req, res) => {
  try {
    const { companyId, date, projectId } = req.query;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    // Build query
    const query = { companyId: Number(companyId) };
    if (date) query.taskDate = date;
    if (projectId) query.projectId = Number(projectId);

    // Fetch tasks
    const tasks = await FleetTask.find(query).lean();

    // Collect all numeric driverIds and projectIds
    const driverIds = [...new Set(tasks.map(t => t.driverId).filter(Boolean))];
    const projectIds = [...new Set(tasks.map(t => t.projectId).filter(Boolean))];

    // Fetch drivers and employees in bulk using numeric IDs
    const drivers = await Driver.find({ id: { $in: driverIds } }).lean();
    const employeeIds = drivers.map(d => d.employeeId);
    const employees = await Employee.find({ id: { $in: employeeIds } }).lean();

    // Map driverId → employee name
    const driverMap = {};
    drivers.forEach(d => {
      const emp = employees.find(e => e.id === d.employeeId);
      driverMap[d.id] = emp?.fullName || "Unassigned";
    });

    // Fetch projects in bulk using numeric IDs
    const projects = await Project.find({ id: { $in: projectIds } }).lean();
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p.id] = { name: p.projectName || "", site: p.address || "" };
    });

    // Build response
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const workerCount = await FleetTaskPassenger.countDocuments({
          fleetTaskId: task.id, // numeric task id
        });

        return {
          taskId: task.id,          // numeric id
          driver: driverMap[task.driverId] || "Unassigned",
          projectName: projectMap[task.projectId]?.name || "",
          site: projectMap[task.projectId]?.site || "",
          workers: workerCount,
          pickup: task.pickupLocation,
          drop: task.dropLocation,
          status: task.status,
        };
      })
    );

    res.json(tasksWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
