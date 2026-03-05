import React, { useEffect, useState } from "react";
import { Card, Table, Badge, Spin, Alert } from "antd";
import { getPmDashboard } from "../../api/manager/managerApi";

/* ================= TABLE COLUMNS ================= */
const projectColumns = [
  {
    title: "Project Name",
    dataIndex: "projectName",
    key: "projectName",
  },
  {
    title: "Site Address",
    dataIndex: "siteAddress",
    key: "siteAddress",
  },
  {
    title: "Supervisor ID",
    dataIndex: "supervisorId",
    key: "supervisorId",
  },
  {
    title: "Workers",
    dataIndex: "workersCount",
    key: "workersCount",
  },
  {
    title: "Progress",
    dataIndex: "progress",
    key: "progress",
    render: (p) => (
      <Badge
        status={p < 50 ? "error" : p < 80 ? "warning" : "success"}
        text={`${p}%`}
      />
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (s) => (
      <Badge status={s === "ONGOING" ? "processing" : "default"} text={s} />
    ),
  },
];

/* ================= COMPONENT ================= */
const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await getPmDashboard();
      setData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Spin size="large" />
      </div>
    );
  if (error)
    return (
      <div className="p-6">
        <Alert type="error" message={error} />
      </div>
    );

  const { summary, projects } = data;

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen font-sans">
      {/* HEADER */}
      <Card bordered className="shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <div>
            <h2 className="text-xl font-bold uppercase">Project Manager Dashboard</h2>
            <div className="text-sm text-gray-600">Projects Overview</div>
          </div>
        </div>
      </Card>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="My Projects" bordered className="text-center">
          <div className="text-xl font-bold">{summary.myProjects}</div>
        </Card>
        <Card title="Today's Manpower" bordered className="text-center">
          <div className="text-xl font-bold">{summary.todaysManpower}</div>
        </Card>
        <Card title="Present Workers" bordered className="text-center">
          <div className="text-xl font-bold">{summary.present}</div>
        </Card>
        <Card title="Progress Alerts" bordered className="text-center">
          <div className="text-xl font-bold">{summary.progressAlerts}</div>
        </Card>
      </div>

      {/* PROJECT TABLE */}
      {/* <Card title={`Projects (${projects.length})`} bordered className="shadow-sm">
        <Table
          rowKey="projectId"
          columns={projectColumns}
          dataSource={projects}
          pagination={{ pageSize: 5 }}
        />
      </Card> */}

      {/* WORKERS PER PROJECT
      {projects.map((p) => (
        <Card
          key={p.projectId}
          title={`Workers - ${p.projectName}`}
          bordered
          className="shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {p.workers && p.workers.length > 0 ? (
              p.workers.map((w) => (
                <Card key={w.id} className="text-center">
                  <strong>{w.name}</strong>
                  <div>{w.taskName || "Task Pending"}</div>
                  <Badge
                    status={
                      w.status === "PRESENT"
                        ? "success"
                        : w.status === "ASSIGNED"
                        ? "warning"
                        : "error"
                    }
                    text={w.status}
                  />
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                No workers assigned today.
              </div>
            )}
          </div>
        </Card>
      ))} */}
    </div>
  );
};

export default ManagerDashboard;
