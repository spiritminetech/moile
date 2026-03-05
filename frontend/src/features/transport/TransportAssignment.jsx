import React, { useEffect, useState, useMemo } from "react";
import {
  Breadcrumb,
  Card,
  DatePicker,
  Radio,
  Select,
  Checkbox,
  Button,
  Alert,
  Input,
  Divider,
  TimePicker
} from "antd";
import dayjs from "dayjs";
import {
  fetchTransportInit,
  validateTransport,
  assignTransport
} from "../../api/admin/transportApi";

import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

export default function TransportAssignment() {
  const [date, setDate] = useState(dayjs());
  const [tripType, setTripType] = useState("MORNING_PICKUP");

  const [projects, setProjects] = useState([]);      
  const [projectId, setProjectId] = useState(null);
  const [initData, setInitData] = useState(null);

  const [driverId, setDriverId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);

  const [workers, setWorkers] = useState([]);
  const [capacityWarning, setCapacityWarning] = useState(false);
  const [notes, setNotes] = useState("");

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [pickupTime, setPickupTime] = useState(null);
  const [dropTime, setDropTime] = useState(null);

  /* =======================
     LOAD ALL PROJECTS
  ======================= */
  useEffect(() => {
    fetch(`${process.env.REACT_APP_URL}/projects`)


      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(console.error);
  }, []);



  /* =======================
     LOAD INIT DATA (after project select)
  ======================= */
  useEffect(() => {
    if (!projectId) return;

    fetchTransportInit(date.format("YYYY-MM-DD"), projectId)
      .then(res => {
        setInitData(res.data);
        setWorkers(res.data.workers.map(w => w.employeeId));
      })
      .catch(console.error);
  }, [projectId, date]);

  /* =======================
     CAPACITY VALIDATION
  ======================= */
  useEffect(() => {
    if (!vehicleId) return;

    validateTransport({
      vehicleId,
      workerCount: workers.length
    })
      .then(res => setCapacityWarning(res.data.capacityExceeded))
      .catch(console.error);
  }, [vehicleId, workers]);

  /* =======================
     DERIVED DATA
  ======================= */
  const selectedVehicle = useMemo(() => {
    if (!initData || !vehicleId) return null;
    return initData.vehicles.find(v => v.id === vehicleId);
  }, [initData, vehicleId]);

  let { user } = useAuth();
  let company = { id: user.companyId };
  /* =======================
     ASSIGN TRIP
  ======================= */
  const handleAssign = async () => {
    await assignTransport({
      companyId: company.id,
      projectId,
      taskDate: date.format("YYYY-MM-DD"),
      tripType,
      driverId,
      vehicleId,
      pickupLocation,
      pickupAddress: pickupLocation,
      dropLocation,
      dropAddress: dropLocation,
      plannedPickupTime: pickupTime?.format("HH:mm"),
      plannedDropTime: dropTime?.format("HH:mm"),
      expectedPassengers: workers.length,
      workerEmployeeIds: workers,
      notes
    });

    alert("Transport Assigned Successfully");
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="p-6 space-y-4 text-sm">
      <Breadcrumb>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Transport</Breadcrumb.Item>
        <Breadcrumb.Item>Transport Assignment</Breadcrumb.Item>
      </Breadcrumb>

      {/* TRIP INFO */}
      <Card title="📅 Trip Information">
        <div className="grid grid-cols-2 gap-4">
          <DatePicker value={date} onChange={setDate} />
          <Radio.Group
            value={tripType}
            onChange={e => setTripType(e.target.value)}
          >
            <Radio value="MORNING_PICKUP">Morning Pickup</Radio>
            <Radio value="EVENING_DROP">Evening Drop</Radio>
            <Radio value="MATERIAL">Material Trip</Radio>
            <Radio value="EMERGENCY">Emergency</Radio>
          </Radio.Group>
        </div>
      </Card>

      {/* PROJECT */}
      <Card title="📁 Project Details">
        <Select
          placeholder="Select Project"
          className="w-full"
          onChange={setProjectId}
          value={projectId}
        >
          {projects.map(p => (
            <Option key={p.id} value={p.id}>
              {p.projectName}
            </Option>
          ))}
        </Select>

        {initData && (
          <div className="mt-3 space-y-1">
            <p><b>Site Name:</b> {initData.project.siteName}</p>
            <p><b>Geo-Fence:</b> {initData.project.geofenceEnabled ? "Enabled ✔" : "Disabled"}</p>
            <p><b>Supervisor:</b> {initData.project.supervisor.name}</p>
          </div>
        )}
      </Card>

      {/* DRIVER & VEHICLE */}
      {initData && (
        <Card title="🚗 Driver & Vehicle">
          <div className="grid grid-cols-2 gap-4">
            <Select placeholder="Select Driver" onChange={setDriverId}>
              {initData.drivers.map(d => (
                <Option key={d.id} value={d.id}>
                  {d.driverName}
                </Option>
              ))}
            </Select>

            <Select placeholder="Select Vehicle" onChange={setVehicleId}>
              {initData.vehicles.map(v => (
                <Option key={v.id} value={v.id}>
                  {v.registrationNo}
                </Option>
              ))}
            </Select>
          </div>

          {selectedVehicle && (
            <div className="mt-3 space-y-1">
              <p><b>Vehicle Number:</b> {selectedVehicle.registrationNo}</p>
              <p><b>Vehicle Type:</b> {selectedVehicle.vehicleType}</p>
              <p><b>Vehicle Capacity:</b> {selectedVehicle.capacity}</p>
            </div>
          )}

          {capacityWarning && (
            <Alert
              type="warning"
              className="mt-2"
              message="Capacity Exceeded"
              description="Split trip or remove workers"
            />
          )}
        </Card>
      )}

      {/* PICKUP & DROP */}
      {initData && (
        <Card title="📍 Pickup & Drop Details">
          <div className="grid grid-cols-2 gap-4">
            <Input
              value={pickupLocation}
              onChange={e => setPickupLocation(e.target.value)}
              placeholder="Pickup Location"
            />
            <TimePicker
              className="w-full"
              value={pickupTime}
              format="hh:mm A"
              onChange={setPickupTime}
            />
            <Input
              value={dropLocation}
              onChange={e => setDropLocation(e.target.value)}
              placeholder="Drop Location"
            />
            <TimePicker
              className="w-full"
              value={dropTime}
              format="hh:mm A"
              onChange={setDropTime}
            />
          </div>
        </Card>
      )}

      {/* WORKERS */}
      {initData && (
        <Card title={`👷 Workers Assigned (${workers.length})`}>
          <div className="grid grid-cols-2 gap-2">
            {initData.workers.map((w, idx) => (
              <Checkbox
                key={w.employeeId}
                checked={workers.includes(w.employeeId)}
                onChange={e =>
                  e.target.checked
                    ? setWorkers(p => [...p, w.employeeId])
                    : setWorkers(p => p.filter(id => id !== w.employeeId))
                }
              >
                Worker {String(idx + 1).padStart(3, "0")} – {w.fullName}
              </Checkbox>
            ))}
          </div>
        </Card>
      )}

      {/* NOTES */}
      <Card title="📝 Notes">
        <TextArea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </Card>

      <Divider />

      <div className="flex gap-4">
        <Button type="primary" onClick={handleAssign}>
          Assign Trip
        </Button>
      </div>
    </div>
  );
}
