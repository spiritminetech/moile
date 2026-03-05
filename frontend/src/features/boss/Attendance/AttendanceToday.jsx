import React, { useEffect, useState } from "react";
import { Card, Table, Spin, Alert, Tag } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // ⬅ add this

const AttendanceToday = () => {
  const { user } = useAuth(); // get logged-in user
  const company = { id: user?.companyId, name: user?.companyName || "" };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_URL || "http://localhost:5000/api";

  const businessDate = new Date().toISOString().split("T")[0]; // today

  const fetchAttendance = async () => {
    if (!company.id) {
      setError("No company context found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ⬅ Pass companyId and date as query params
    const res = await axios.get(
  `${API_URL}/attendance/today/projects`,
  {
    params: {
      companyId: company.id,
      date: businessDate
    }
  }
);


      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load today's attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [company.id]); // only run when company id is available

  const columns = [
    {
      title: "Project",
      dataIndex: "projectName",
      key: "projectName",
      render: (_, record) => (
        <span
          className="text-blue-600 font-medium cursor-pointer hover:underline"
          onClick={() =>
            navigate(`/attendance/projects/${record.projectId}`)
          }
        >
          {record.projectCode} – {record.projectName}
        </span>
      )
    },
    {
      title: "Present",
      dataIndex: "present",
      key: "present",
      align: "center",
      render: val => <Tag color="green">{val}</Tag>
    },
    {
      title: "Absent",
      dataIndex: "absent",
      key: "absent",
      align: "center",
      render: val => <Tag color="red">{val}</Tag>
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
    return (
      <Alert type="error" message={error} className="m-6" />
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <Card className="shadow-sm">
        <h1 className="text-xl font-bold mb-4"> Attendance</h1>

        <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase">
          Today’s Attendance
        </h2>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="projectId"
          pagination={false}
          bordered
        />

        <div className="text-xs text-gray-500 mt-3">
          Click on a project to view worker attendance list
        </div>
      </Card>
    </div>
  );
};

export default AttendanceToday;
