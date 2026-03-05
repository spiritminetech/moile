import React, { useEffect, useState } from "react";
import {
  Select,
  DatePicker,
  Table,
  Button,
  Breadcrumb,
  Card,
  message,
  Checkbox,
  Spin,
  Popconfirm
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

const DailyManpowerDeployment = () => {
  const [projects, setProjects] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  const [projectId, setProjectId] = useState(null);
  const [supervisorId, setSupervisorId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [date, setDate] = useState(dayjs().add(1, "day"));

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const API_URL = process.env.REACT_APP_URL || "http://localhost:5000";

  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    setFetching(true);

    axios.get(`${API_URL}/projects?status=ongoing`)
      .then(res => setProjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => message.error("Failed to load projects"));

    axios.get(`${API_URL}/company-users/supervisors`)
      .then(res => setSupervisors(res.data.success ? res.data.data : []))
      .catch(() => message.error("Failed to load supervisors"));

    axios.get(`${API_URL}/fleet-vehicles?status=available`)
      .then(res => setVehicles(res.data.success ? res.data.data : []))
      .catch(() => message.error("Failed to load vehicles"))
      .finally(() => setFetching(false));
  }, [API_URL]);

  const loadAvailableWorkers = () => {
    if (!date) return;
    setFetching(true);
   axios.get(`${API_URL}/workers-assignments/workers/available`, {
  params: { date: date.format("YYYY-MM-DD") }
})

      .then(res => {
        let availableWorkers = res.data.success ? res.data.data : [];

        if (isEditMode && editingAssignment) {
          const assignedWorkerIds = assignments
            .filter(a => a.projectId === projectId && a.date === date.format("YYYY-MM-DD"))
            .map(a => a.employeeId);

          assignedWorkerIds.forEach(id => {
            if (!availableWorkers.some(w => w.id === id)) {
              const assignedWorker = assignments.find(a => a.employeeId === id);
              if (assignedWorker) {
                availableWorkers.push({
                  id: assignedWorker.employeeId,
                  fullName: assignedWorker.employeeName,
                  trade: assignedWorker.trade || "Unknown",
                  employeeCode: assignedWorker.employeeCode || "",
                  status: assignedWorker.status || "active"
                });
              }
            }
          });
        }

        setWorkers(availableWorkers);

        if (isEditMode && editingAssignment) {
          const selectedIds = assignments
            .filter(a => a.projectId === projectId && a.date === date.format("YYYY-MM-DD"))
            .map(a => a.employeeId);
          setSelectedWorkers(selectedIds);
        }

      })
      .catch(() => message.error("Failed to load workers"))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    loadAvailableWorkers();
  }, [date, API_URL, isEditMode, editingAssignment]);

  const fetchAssignments = async () => {
    try {
      const params = {};
      if (projectId) params.projectId = projectId;
      const res = await axios.get(`${API_URL}/workers-assignments/assignments`, { params });
      if (res.data.success) setAssignments(res.data.data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [projectId]);

  const workerColumns = [
    {
      title: "Select",
      render: (_, record) => (
        <Checkbox
          checked={selectedWorkers.includes(record.id)}
          onChange={e =>
            setSelectedWorkers(e.target.checked
              ? [...selectedWorkers, record.id]
              : selectedWorkers.filter(id => id !== record.id)
            )
          }
        />
      )
    },
    { title: "Worker Name", dataIndex: "fullName" },
    
    { title: "Employee Code", dataIndex: "employeeCode", render: c => c || "—" },
    {
      title: "Status",
      dataIndex: "status",
      render: s => (
        <span className={`px-2 py-1 rounded text-xs ${s === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {s || 'unknown'}
        </span>
      )
    }
  ];

  const assignWorkers = async () => {
    if (!projectId || !supervisorId || selectedWorkers.length === 0) {
      message.error("Project, supervisor & workers required");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/workers-assignments/bulk-assign`, {
        projectId,
        supervisorId,
        vehicleId,
        date: date.format("YYYY-MM-DD"),
        employeeIds: selectedWorkers
      });
      message.success("Workers assigned");
      resetForm();
      fetchAssignments();
    } catch (err) {
      message.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async () => {
    if (!projectId || !supervisorId || selectedWorkers.length === 0) {
      message.error("Project, supervisor & workers required");
      return;
    }
    setUpdating(true);
    try {
      const assignedIds = assignments
        .filter(a => a.projectId === projectId && a.date === date.format("YYYY-MM-DD"))
        .map(a => a.employeeId);

      const newWorkers = selectedWorkers.filter(id => !assignedIds.includes(id));
      const removedWorkers = assignedIds.filter(id => !selectedWorkers.includes(id));

      if (newWorkers.length > 0) {
        await axios.post(`${API_URL}/workers-assignments/bulk-assign`, {
          projectId,
          supervisorId,
          vehicleId,
          date: date.format("YYYY-MM-DD"),
          employeeIds: newWorkers
        });
      }

      if (removedWorkers.length > 0) {
        const assignmentsToDelete = assignments.filter(
          a => a.projectId === projectId &&
            a.date === date.format("YYYY-MM-DD") &&
            removedWorkers.includes(a.employeeId)
        );

        for (let assignment of assignmentsToDelete) {
          await axios.delete(`${API_URL}/workers-assignments/assignments/${assignment.id}`);
        }
      }

      message.success("Assignment updated successfully");
      resetForm();
      fetchAssignments();

    } catch (err) {
      message.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAssignment = async (assignmentIds) => {
    try {
      const deletePromises = assignmentIds.map(id =>
        axios.delete(`${API_URL}/workers-assignments/assignments/${id}`)
      );
      await Promise.all(deletePromises);
      message.success("Assignments deleted successfully");
      fetchAssignments();
    } catch {
      message.error("Failed to delete assignments");
    }
  };

  const handleEditAssignment = (record) => {
    setIsEditMode(true);
    setEditingAssignment(record);
    setProjectId(record.projectId);
    setSupervisorId(record.supervisorId);
    setVehicleId(record.vehicleId || null);
    setDate(dayjs(record.date));

    const assignmentGroup = assignments
      .filter(a => a.projectId === record.projectId &&
        a.date === record.date &&
        a.supervisorId === record.supervisorId);

    const assignedWorkers = assignmentGroup.map(a => a.employeeId);
    setSelectedWorkers(assignedWorkers);
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingAssignment(null);
    setSelectedWorkers([]);
    setProjectId(null);
    setSupervisorId(null);
    setVehicleId(null);
    setDate(dayjs().add(1, "day"));
  };

  const groupedAssignments = assignments.reduce((acc, curr) => {
    const key = `${curr.projectId}-${curr.date}-${curr.supervisorId}`;
    if (!acc[key]) {
      acc[key] = {
        key: key,
        projectId: curr.projectId,
        supervisorId: curr.supervisorId,
        vehicleId: curr.vehicleId,
        projectName: curr.projectName,
        supervisorName: curr.supervisorName,
        vehicleCode: curr.vehicleCode,
        date: curr.date,
        workers: [{ id: curr.id, employeeId: curr.employeeId, employeeName: curr.employeeName }],
        assignmentIds: [curr.id]
      };
    } else {
      acc[key].workers.push({
        id: curr.id,
        employeeId: curr.employeeId,
        employeeName: curr.employeeName
      });
      acc[key].assignmentIds.push(curr.id);
    }
    return acc;
  }, {});

  const tableData = Object.values(groupedAssignments).map(item => ({
    ...item,
    workerNames: item.workers.map(w => w.employeeName).join(", "),
    workerDetails: item.workers
  }));

  const assignmentColumns = [
    {
      title: "Workers",
      dataIndex: "workerNames",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {record.workers.length} worker{record.workers.length !== 1 ? 's' : ''}
          </div>
        </div>
      )
    },
    { title: "Supervisor", dataIndex: "supervisorName" },
    { title: "Project", dataIndex: "projectName" },
    { title: "Vehicle", dataIndex: "vehicleCode", render: v => v || "—" },
    { title: "Date", dataIndex: "date", render: d => dayjs(d).format("YYYY-MM-DD") },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button type="link" size="small" onClick={() => handleEditAssignment(record)}>
            Edit
          </Button>
          <Popconfirm
            title={`Delete ${record.workers.length} assignment${record.workers.length !== 1 ? 's' : ''}?`}
            description="This action cannot be undone."
            onConfirm={() => handleDeleteAssignment(record.assignmentIds)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button type="link" danger size="small">Delete</Button>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item>Execution</Breadcrumb.Item>
        <Breadcrumb.Item>Task Management</Breadcrumb.Item>
        <Breadcrumb.Item>Daily Worker Deployment</Breadcrumb.Item>
      </Breadcrumb>

      {isEditMode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-1">Edit Mode</h3>
              <p className="text-blue-600">
                Editing assignment for <strong>{editingAssignment?.projectName}</strong> on {dayjs(editingAssignment?.date).format('MMM D, YYYY')}
              </p>
            </div>
            <Button type="default" onClick={resetForm}>
              Cancel Edit
            </Button>
          </div>
        </div>
      )}

      <Card className="mb-6 shadow-sm" title="Project & Date">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
            <Select
              className="w-full"
              placeholder="Select Project"
              value={projectId}
              onChange={setProjectId}
              size="large"
              allowClear
              loading={fetching}
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.projectName} {p.projectCode ? `(${p.projectCode})` : ''}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deployment Date *</label>
            <DatePicker
              className="w-full"
              value={date}
              onChange={setDate}
              format="YYYY-MM-DD"
              size="large"
              disabledDate={current => current && current < dayjs().startOf('day')}
            />
          </div>
        </div>
      </Card>

      <Card className="mb-6 shadow-sm" title="Deployment Setup">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor *</label>
            <Select
              className="w-full"
              placeholder="Select Supervisor"
              value={supervisorId}
              onChange={setSupervisorId}
              size="large"
              allowClear
              loading={fetching}
            >
              {supervisors.map(s => <Option key={s.id} value={s.id}>{s.fullName}</Option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transport (Optional)</label>
            <Select
              className="w-full"
              placeholder="Select Transport"
              value={vehicleId}
              onChange={setVehicleId}
              size="large"
              allowClear
              loading={fetching}
            >
              {vehicles.map(v => <Option key={v.id} value={v.id}>{v.vehicleCode} {v.registrationNo ? `(${v.registrationNo})` : ''}</Option>)}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="mb-6 shadow-sm" title={`Available Workers for ${date.format('MMM D, YYYY')}`}>
        <div className="mb-4 flex justify-between items-center">
          <div>
            Selected: <strong>{selectedWorkers.length}</strong> worker{selectedWorkers.length !== 1 ? 's' : ''}
            {isEditMode && editingAssignment && (
              <span className="ml-2 text-sm text-blue-600">
                (Editing: {editingAssignment.projectName})
              </span>
            )}
          </div>
          <Button
            type="link"
            size="small"
            onClick={() => setSelectedWorkers([])}
            disabled={selectedWorkers.length === 0}
          >
            Clear Selection
          </Button>
        </div>

        {fetching ? (
          <Spin tip="Loading available workers..." />
        ) : workers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No workers available</div>
        ) : (
          <Table
            rowKey="id"
            columns={workerColumns}
            dataSource={workers}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}   // <--- ⭐ HORIZONTAL SCROLL ENABLED HERE
            rowClassName={(record) =>
              selectedWorkers.includes(record.id) ? 'bg-blue-50' : ''
            }
          />
        )}
      </Card>

      <div className="flex justify-between items-center mb-6">
        <div>
          {isEditMode ? (
            <>
              <Button
                type="primary"
                size="large"
                loading={updating}
                onClick={updateAssignment}
                disabled={!projectId || !supervisorId || selectedWorkers.length === 0}
                className="px-8 bg-green-600 hover:bg-green-700"
              >
                {updating ? 'Updating...' : `Update Assignment`}
              </Button>
              <Button
                type="default"
                size="large"
                onClick={resetForm}
                className="ml-4 px-8"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={assignWorkers}
              disabled={!projectId || !supervisorId || selectedWorkers.length === 0 || fetching}
              className="px-8"
            >
              {loading ? 'Assigning...' : `Assign ${selectedWorkers.length > 0 ? `(${selectedWorkers.length}) ` : ''}to Project`}
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6 shadow-sm" title="All Assigned Workers">
        <Table
          rowKey="key"
          columns={assignmentColumns}
          dataSource={tableData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}   // <--- ⭐ HORIZONTAL SCROLL ENABLED HERE
          rowClassName={(record) =>
            isEditMode && editingAssignment?.key === record.key
              ? 'bg-blue-50'
              : ''
          }
        />
      </Card>
    </div>
  );
};

export default DailyManpowerDeployment;
