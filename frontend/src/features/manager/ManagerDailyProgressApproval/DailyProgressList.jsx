import { useEffect, useState } from "react";
import { Table, Button, Tag, message } from "antd";
import DailyProgressDetail from "./DailyProgressDetail";
import { getPendingDailyProgress } from "../../../api/manager/dailyProgressApi";

export default function DailyProgressList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPendingDailyProgress();
      setData(res.data.data);
    } catch (err) {
      message.error("Failed to load pending progress");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    { title: "ProjectName", dataIndex: "projectName" },
    { title: "Supervisor", dataIndex: "supervisorName" },
    {
      title: "Date",
      dataIndex: "date",
      render: (d) => new Date(d).toLocaleDateString(),
    },
    {
      title: "Progress %",
      dataIndex: "overallProgress",
      render: (p) => <Tag color="blue">{p}%</Tag>,
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button type="primary" onClick={() => setSelectedId(record.id)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Pending Daily Progress Approval</h2>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {selectedId && (
        <DailyProgressDetail
          id={selectedId}
          onClose={() => {
            setSelectedId(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
