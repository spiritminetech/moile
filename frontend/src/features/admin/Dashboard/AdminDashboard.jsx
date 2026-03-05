import React, { useEffect, useState } from "react";
import {
  Card,
  Statistic,
  Row,
  Col,
  Spin,
  Alert,
  Typography,
  Space,
  Divider
} from "antd";
import {
  TeamOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_URL;
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_URL}/admin/dashboard`, {
        params: { date: today }
      });

      setDashboard(res.data.dashboard || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} className="m-6" />;
  }

  if (!dashboard) {
    return <Alert type="info" message="No dashboard data found" className="m-6" />;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <Card className="shadow-sm">
        {/* Header */}
        <Space direction="vertical" size={0} className="w-full">
          <Title level={4}>Admin Dashboard</Title>
          <Text type="secondary">Overview for {today}</Text>
        </Space>

        <Divider />

        {/* Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title="Today's Deployment"
                value={dashboard.todaysDeployment}
                prefix={<TeamOutlined />}
                suffix="workers"
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title="Attendance Issues"
                value={dashboard.attendanceIssues}
                prefix={<WarningOutlined />}
                suffix="workers"
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title="Pending Task Assignments"
                value={dashboard.pendingTaskAssignments}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#d48806" }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminDashboard;
