import FleetTask from "../fleetTask/models/FleetTaskModel.js";
import FleetTaskPassenger from "../fleetTaskPassenger/FleetTaskPassengerModel.js";
import Project from "../project/models/ProjectModel.js";
import Driver from "../driver/DriverModel.js";
import FleetVehicle from "../fleetVehicle/FleetVehicleModel.js";
import WorkerTaskAssignment from "../workerTaskAssignment/WorkerTaskAssignmentModel.js";
import Employee from "../employees/EmployeeModel.js";

/**
 * INIT DATA
 */
export const initTransportAssignment = async (req, res) => {
  const { date, projectId } = req.query;

  const project = await Project.findOne({ id: Number(projectId) }).lean();
  if (!project) return res.status(404).json({ message: "Project not found" });

 const workers = await WorkerTaskAssignment.aggregate([
  {
    $match: {
      projectId: Number(projectId),
      date: date
    }
  },
  {
    $lookup: {
      from: "employees",          // MongoDB collection name for Employee
      localField: "employeeId", // field in WorkerTaskAssignment
      foreignField: "id",         // field in Employee
      as: "employee"
    }
  },
  {
    $unwind: "$employee" // convert array from $lookup into single object
  },
  {
    $project: {
      _id: 0,
      id: 1,
      projectId: 1,
      employeeId: 1,
      date: 1,
      status: 1,
      fullName: "$employee.fullName", // include employee name
      jobTitle: "$employee.jobTitle"  // optional: include more fields
    }
  }
]).exec();

  const drivers = await Driver.aggregate([
  {
    $match: { status: "ACTIVE" }
  },
  {
    $lookup: {
      from: "employees",
      localField: "employeeId",
      foreignField: "id",
      as: "employee"
    }
  },
  {
    $unwind: "$employee"
  },
  {
    $project: {
      _id: 0,
      id: 1,
      employeeId: 1,
      driverName: "$employee.fullName",
      phone: "$employee.phone",
      jobTitle: "$employee.jobTitle"
    }
  }
]).exec();

  const vehicles = await FleetVehicle.find({ status: "ACTIVE" }).lean();

  res.json({
    project: {
      id: project.id,
      projectName: project.projectName,
      siteName: project.projectName,
      address: project.address,
      supervisor: {
        id: project.supervisorId,
        name: project.supervisorName || "Supervisor"
      },
      geofenceEnabled: true
    },
    workers,
    drivers,
    vehicles
  });
};

/**
 * VALIDATE CAPACITY
 */
export const validateTransport = async (req, res) => {
  const { vehicleId, workerCount } = req.body;

  const vehicle = await FleetVehicle.findOne({ id: vehicleId }).lean();
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  res.json({
    vehicleCapacity: vehicle.capacity,
    assignedWorkers: workerCount,
    capacityExceeded: workerCount > vehicle.capacity,
    suggestion: workerCount > vehicle.capacity ? "Split trip required" : "OK"
  });
};

/**
 * ASSIGN TRIP
 */
export const assignTransport = async (req, res) => {
  try {
    const {
      companyId,
      projectId,
      taskDate,
      driverId,
      vehicleId,
      pickupLocation,
      pickupAddress,
      dropLocation,
      dropAddress,
      plannedPickupTime,
      plannedDropTime,
      expectedPassengers,
      workerEmployeeIds = [],
      notes
    } = req.body;

    /* ================= BASIC VALIDATION ================= */

    if (!taskDate || !plannedPickupTime || !plannedDropTime) {
      return res.status(400).json({
        message: "taskDate, plannedPickupTime and plannedDropTime are required"
      });
    }

    if (!Array.isArray(workerEmployeeIds)) {
      return res.status(400).json({
        message: "workerEmployeeIds must be an array"
      });
    }

    /* ================= LOCAL HELPER ================= */

    const combineDateAndTime = (date, time) => {
      const baseDate = new Date(date);
      if (Number.isNaN(baseDate.getTime())) {
        throw new Error("Invalid taskDate");
      }

      const [hours, minutes] = time.split(":").map(Number);
      if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        hours > 23 ||
        minutes > 59
      ) {
        throw new Error("Invalid time format (HH:mm)");
      }

      baseDate.setHours(hours, minutes, 0, 0);
      return baseDate;
    };

    /* ================= TIME CONVERSION ================= */

    const pickupDateTime = combineDateAndTime(taskDate, plannedPickupTime);
    const dropDateTime = combineDateAndTime(taskDate, plannedDropTime);

    if (dropDateTime <= pickupDateTime) {
      return res.status(400).json({
        message: "Drop time must be after pickup time"
      });
    }

    /* ================= ID GENERATION ================= */

    const lastTask = await FleetTask
      .findOne({})
      .sort({ id: -1 })
      .select("id")
      .lean();

    const nextId = lastTask ? lastTask.id + 1 : 1;

    /* ================= CREATE FLEET TASK ================= */

    const fleetTask = await FleetTask.create({
      id: nextId,
      companyId,
      projectId,
      driverId,
      vehicleId,
      taskDate,
      pickupLocation,
      pickupAddress,
      dropLocation,
      dropAddress,
      plannedPickupTime: pickupDateTime,
      plannedDropTime: dropDateTime,
      expectedPassengers,
      status: "PLANNED",
      notes,
      createdBy: req.user.id
    });

    /* ================= CREATE PASSENGERS ================= */

    if (workerEmployeeIds.length > 0) {
      const passengers = workerEmployeeIds.map(empId => ({
        companyId,
        fleetTaskId: fleetTask.id,
        workerEmployeeId: empId,
        status: "ASSIGNED"
      }));

      await FleetTaskPassenger.insertMany(passengers);
    }

    /* ================= RESPONSE ================= */

    return res.json({
      message: "Transport assigned successfully",
      fleetTaskId: fleetTask.id
    });

  } catch (error) {
    console.error("assignTransport error:", error);
    return res.status(500).json({
      message: "Failed to assign transport",
      error: error.message
    });
  }
};


