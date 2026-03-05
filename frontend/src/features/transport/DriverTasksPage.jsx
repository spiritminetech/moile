import React, { useEffect, useState } from "react";
import { Table, Button, Segmented, Space, Breadcrumb, Tag, Spin, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getDriverTasks } from "../../api/admin/driverTasksApi";
import { useAuth } from "../../context/AuthContext";

export default function DriverTasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [dateType, setDateType] = useState("today");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resolvedDate =
    dateType === "today"
      ? dayjs().format("YYYY-MM-DD")
      : dayjs().add(1, "day").format("YYYY-MM-DD");

  useEffect(() => {
    if (companyId) fetchTasks();
  }, [dateType, companyId]);

const fetchTasks = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await getDriverTasks({
      companyId,
      date: resolvedDate
    });
    setTasks(res.data);
  } catch (err) {
    console.error("Failed to load driver tasks", err);
    setError("Failed to load driver tasks");
  } finally {
    setLoading(false);
  }
};


  const columns = [
    { title: "Driver", dataIndex: "driver", key: "driver" },
    { title: "Project", dataIndex: "projectName", key: "projectName" },
    // { title: "Site", dataIndex: "site", key: "site" },
    { title: "Workers", dataIndex: "workers", key: "workers" },
    { title: "Pickup", dataIndex: "pickup", key: "pickup" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status === "COMPLETED" ? "green" : status === "ASSIGNED" ? "blue" : "orange";
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  if (!companyId) {
    return <Alert message="No company context found" type="error" className="m-6" />;
  }

  if (loading) return <div className="flex justify-center items-center min-h-[300px]"><Spin size="large" /></div>;
  if (error) return <Alert type="error" message={error} className="m-6" />;

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Transport</Breadcrumb.Item>
        <Breadcrumb.Item>Driver Tasks</Breadcrumb.Item>
      </Breadcrumb>

      <Space className="w-full justify-between">
        <Segmented
          value={dateType}
          onChange={setDateType}
          options={[
            { label: "Today", value: "today" },
            { label: "Tomorrow", value: "tomorrow" },
          ]}
        />

        <Button type="primary" onClick={() => navigate("/transport/assignment")}>
          + Assign Driver Task
        </Button>
      </Space>

      <Table rowKey="taskId" columns={columns} dataSource={tasks} pagination={false} />
    </div>
  );
}
