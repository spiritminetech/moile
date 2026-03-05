import { useEffect, useState } from 'react';
import { Card, Spin, Alert, Row, Col, Table, Tag, Progress, Button } from 'antd';
import {
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  fetchDashboardSummary
} from '../../../api/boss/dashboardApi';
import QuotationOverview from '../../../components/boss/QuotationOverview';

// 🔒 MUST come from auth context / JWT decode
import { useAuth } from '../../../context/AuthContext';

const ExecutiveDashboard = () => {
  let { user } = useAuth();
  let company = { id: user.companyId };
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // ⚠️ UI does NOT decide business date
  const businessDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!company?.id) return;
    loadDashboard();
  }, [company?.id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await fetchDashboardSummary({
        companyId: company.id,
        date: businessDate
      });

      setSummary(data);

    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (!company) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          message="No company context found"
          description="User is not associated with any company."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" message={error} />
      </div>
    );
  }

  const { kpis, projects } = summary;

  // Get alerts from summary
  const alerts = summary.alerts || [];

  // Calculate attendance percentage
  const totalWorkers = kpis.totalWorkers || 0;
  const presentWorkers = kpis.attendance.present || 0;
  const attendancePercentage = totalWorkers > 0 ? Math.round((presentWorkers / totalWorkers) * 100) : 0;

  // Project Status Table Columns
  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Manager',
      dataIndex: 'manager',
      key: 'manager',
      width: 120,
      render: (manager) => manager?.name || 'Unassigned',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        let color = 'blue';
        let icon = null;
        if (status === 'COMPLETED') {
          color = 'green';
          icon = '✅';
        } else if (status === 'DELAYED') {
          color = 'red';
          icon = '⚠️';
        }
        return <Tag color={color}>{icon} {status}</Tag>;
      },
    },
    {
      title: 'Progress',
      dataIndex: 'overallProgress',
      key: 'progress',
      width: 120,
      render: (progress) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: 'End Date',
      dataIndex: 'expectedEndDate',
      key: 'endDate',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/boss/projects/${record.projectId}`)}
        >
          View
        </Button>
      ),
    },
  ];

  // Mock alerts data (you can replace with real data from backend)
  // Get alert icon based on type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'attendance': return <WarningOutlined />;
      case 'workpass': return <ClockCircleOutlined />;
      case 'project': return <AlertOutlined />;
      case 'reports': return <FileTextOutlined />;
      default: return <AlertOutlined />;
    }
  };

  // Get navigation path based on alert type
  const getAlertNavigation = (type) => {
    switch (type) {
      case 'attendance': return '/attendance/today';
      case 'workpass': return '/employees';
      case 'project': return '/boss/projects';
      case 'reports': return '/progress-report';
      default: return '/';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      {/* <Card className="shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Executive Dashboard</h1>
            <div className="text-sm text-gray-600 mt-1">
              Company: <strong>{company.name}</strong> | Date: {businessDate}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2 sm:mt-0">
            Logged in as: {user?.name}
          </div>
        </div>
      </Card> */}

      {/* 🔹 TOP SUMMARY BAR (EXECUTIVE SNAPSHOT) */}
      <Card 
        title={
          <span className="text-lg font-bold text-blue-600">
            🔹 Executive Snapshot
          </span>
        }
        className="shadow-md"
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6} md={6} lg={6}>
            <div className="text-center p-4 bg-blue-50 rounded-lg border">
              <ProjectOutlined className="text-2xl text-blue-600 mb-2" />
              <div className="text-sm text-gray-600 mb-1">Active</div>
              <div className="text-sm text-gray-600 mb-2">Projects</div>
              <div className="text-3xl font-bold text-blue-600">{kpis.ongoingProjects}</div>
            </div>
          </Col>
          
          <Col xs={12} sm={6} md={6} lg={6}>
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <TeamOutlined className="text-2xl text-green-600 mb-2" />
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-sm text-gray-600 mb-2">Workers</div>
              <div className="text-3xl font-bold text-green-600">{totalWorkers}</div>
            </div>
          </Col>
          
          <Col xs={12} sm={6} md={6} lg={6}>
            <div className="text-center p-4 bg-orange-50 rounded-lg border">
              <UserOutlined className="text-2xl text-orange-600 mb-2" />
              <div className="text-sm text-gray-600 mb-1">Workers</div>
              <div className="text-sm text-gray-600 mb-2">Deployed</div>
              <div className="text-3xl font-bold text-orange-600">{kpis.manpowerDeployed.total}</div>
            </div>
          </Col>
          
          <Col xs={12} sm={6} md={6} lg={6}>
            <div className="text-center p-4 bg-purple-50 rounded-lg border">
              <CheckCircleOutlined className="text-2xl text-purple-600 mb-2" />
              <div className="text-sm text-gray-600 mb-1">Attendance</div>
              <div className="text-sm text-gray-600 mb-2">Today</div>
              <div className="text-3xl font-bold text-purple-600">{attendancePercentage}%</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 🔹 PROJECT STATUS OVERVIEW */}
      <Card 
        title={
          <span className="text-lg font-bold text-gray-700">
            🔹 Project Status Overview
          </span>
        }
        className="shadow-md"
      >
        <Table
          columns={projectColumns}
          dataSource={projects}
          rowKey="projectId"
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="middle"
        />
        <div className="mt-3 text-sm text-gray-500">
          👉 Clicking a project opens Project Detail Dashboard
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 🔹 TODAY'S MANPOWER & ATTENDANCE */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <span className="text-lg font-bold text-gray-700">
                🔹 Today's Manpower & Attendance
              </span>
            }
            className="shadow-md h-full"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Present Workers</span>
                <span className="text-xl font-bold text-green-600">{presentWorkers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Absent Workers</span>
                <span className="text-xl font-bold text-red-600">{kpis.attendance.absent || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">On Leave / Medical</span>
                <span className="text-xl font-bold text-yellow-600">{kpis.attendance.onLeave || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Late Login</span>
                <span className="text-xl font-bold text-orange-600">{kpis.attendance.late || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Overtime Expected</span>
                <span className="text-xl font-bold text-blue-600">{kpis.attendance.overtime || 0}</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* 🔹 ALERTS & ACTION REQUIRED */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <span className="text-lg font-bold text-red-600">
                🔹 Alerts & Action Required
              </span>
            }
            className="shadow-md h-full"
          >
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={index}
                  className="flex items-center p-3 bg-red-50 border border-red-200 rounded cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => navigate(getAlertNavigation(alert.type))}
                >
                  <div className="text-red-600 mr-3 text-lg">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 text-sm font-medium text-red-800">
                    {alert.message}
                  </div>
                  {alert.count && (
                    <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full ml-2">
                      {alert.count}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-500">
              👉 Clicking alert → goes to related module
            </div>
          </Card>
        </Col>
      </Row>

      {/* 🔹 DAILY ACTIVITY SNAPSHOT */}
      <Card 
        title={
          <span className="text-lg font-bold text-gray-700">
            🔹 Daily Activity Snapshot
          </span>
        }
        className="shadow-md"
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <div className="text-center p-4 bg-blue-50 rounded-lg border">
              <div className="text-sm text-gray-600 mb-2">Attendance Submitted</div>
              <div className="text-2xl font-bold text-blue-600">
                {kpis.dailyActivity?.attendanceSubmitted || 0} / {kpis.dailyActivity?.totalExpected || 0}
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <div className="text-sm text-gray-600 mb-2">Tasks Assigned Today</div>
              <div className="text-2xl font-bold text-green-600">{kpis.dailyActivity?.tasksAssigned || 0}</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-4 bg-orange-50 rounded-lg border">
              <div className="text-sm text-gray-600 mb-2">Progress Reports Submitted</div>
              <div className="text-2xl font-bold text-orange-600">
                {kpis.dailyActivity?.progressReportsSubmitted || 0} / {kpis.dailyActivity?.progressReportsExpected || 0}
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="text-center p-4 bg-purple-50 rounded-lg border">
              <div className="text-sm text-gray-600 mb-2">Materials Requested</div>
              <div className="text-2xl font-bold text-purple-600">{kpis.dailyActivity?.materialsRequested || 0}</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 🔹 QUOTATION OVERVIEW */}
      <QuotationOverview />

    </div>
  );
};

export default ExecutiveDashboard;
