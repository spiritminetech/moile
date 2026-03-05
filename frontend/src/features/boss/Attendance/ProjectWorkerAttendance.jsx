import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Spin, Alert } from "antd";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // ⬅ get logged-in user

const ProjectWorkerAttendance = () => {
  const { user } = useAuth(); // get logged-in user
  const companyId = user?.companyId;

  const { projectId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_URL || "http://localhost:5000/api";

 // const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const today = new Date().toLocaleDateString("en-CA");


  const fetchWorkers = async () => {
    if (!companyId) {
      setError("Company ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `${API_URL}/attendance/today/projects/${projectId}/workers`,
        {
          params: {
            companyId,
            date: today
          },
        }
      );

      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load worker attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [companyId, projectId]); // refetch if companyId or projectId changes

  const columns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      render: (_, r) => (
        <div>
          <div className="font-medium">{r.employeeName}</div>
          <div className="text-xs text-gray-500">{r.employeeCode}</div>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: status =>
        status === "PRESENT" ? (
          <Tag color="green">Present</Tag>
        ) : (
          <Tag color="red">Absent</Tag>
        )
    },
    {
      title: "Check In",
      dataIndex: "checkIn",
      key: "checkIn",
      render: v => (v ? new Date(v).toLocaleTimeString() : "-")
    },
    {
      title: "Check Out",
      dataIndex: "checkOut",
      key: "checkOut",
      render: v => (v ? new Date(v).toLocaleTimeString() : "-")
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} className="m-6" />;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-bold">Worker Attendance</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </button>
        </div>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="employeeId"
          bordered
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default ProjectWorkerAttendance;
