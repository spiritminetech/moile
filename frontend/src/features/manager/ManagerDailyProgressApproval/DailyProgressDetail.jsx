import { useEffect, useState } from "react";
import { 
  Modal, 
  Button, 
  Image, 
  Input, 
  Tag, 
  message, 
  Spin, 
  Card, 
  Row, 
  Col, 
  Divider, 
  Progress,
  Space,
  Typography,
  Avatar
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CameraOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import {
  getDailyProgressDetail,
  approveDailyProgress,
  rejectDailyProgress,
} from "../../../api/manager/dailyProgressApi";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// Backend base URL
const API_URL = process.env.REACT_APP_URL;

// Normalize image paths
const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads")) {
    return `${API_URL.replace("/api", "")}${path}`;
  }
  return `${API_URL.replace("/api", "")}/uploads/${path}`;
};

// Status color mapping
const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'error';
    case 'PENDING': return 'warning';
    default: return 'default';
  }
};

export default function DailyProgressDetail({ id, onClose }) {
  const [data, setData] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setFetching(true);
        const res = await getDailyProgressDetail(id);
        setData(res.data);
      } catch (err) {
        console.error("Daily progress fetch error:", err);
        message.error("Failed to load progress detail");
        onClose();
      } finally {
        setFetching(false);
      }
    };

    fetchDetail();
  }, [id, onClose]);

  const handleApprove = async () => {
    try {
      setLoading(true);
      await approveDailyProgress(id);
      message.success("Progress approved successfully");
      onClose();
    } catch (err) {
      console.error("Approve error:", err);
      message.error("Failed to approve progress");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      message.error("Please provide a reason for rejection");
      return;
    }

    try {
      setLoading(true);
      await rejectDailyProgress(id, reason.trim());
      message.success("Progress rejected successfully");
      onClose();
    } catch (err) {
      console.error("Reject error:", err);
      message.error("Failed to reject progress");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (fetching) {
      return (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" />
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-8">
          <Text type="secondary">No data available</Text>
        </div>
      );
    }

    const { progress = {}, project = {}, photos = [] } = data;
    const progressPercentage = progress.overallProgress || 0;

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <Card className="border-l-4 border-l-blue-500">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="small" className="w-full">
                <div className="flex items-center space-x-2">
                  <ProjectOutlined className="text-blue-500" />
                  <Text strong>Project</Text>
                </div>
                <Title level={4} className="!mb-0 text-gray-800">
                  {project.projectName || "Unnamed Project"}
                </Title>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="small" className="w-full">
                <div className="flex items-center space-x-2">
                  <CalendarOutlined className="text-green-500" />
                  <Text strong>Date</Text>
                </div>
                <Text className="text-lg">
                  {progress.date
                    ? new Date(progress.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "Not specified"}
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Status and Progress Section */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card className="h-full">
              <Space direction="vertical" size="small" className="w-full text-center">
                <UserOutlined className="text-2xl text-purple-500" />
                <Text strong>Supervisor</Text>
                <div className="flex items-center justify-center space-x-2">
                  <Avatar icon={<UserOutlined />} />
                  <Text>{data?.supervisorName || "Not assigned"}</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="h-full">
              <Space direction="vertical" size="small" className="w-full text-center">
                <CheckCircleOutlined className="text-2xl text-orange-500" />
                <Text strong>Status</Text>
                <Tag 
                  color={getStatusColor(progress.approvalStatus)} 
                  className="text-sm px-3 py-1"
                >
                  {progress.approvalStatus || "PENDING"}
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="h-full">
              <Space direction="vertical" size="small" className="w-full text-center">
                <div className="text-2xl text-blue-500">%</div>
                <Text strong>Progress</Text>
                <Progress 
                  type="circle" 
                  percent={progressPercentage} 
                  size={60}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Details Section */}
        <Card title={
          <div className="flex items-center space-x-2">
            <FileTextOutlined />
            <span>Progress Details</span>
          </div>
        }>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="space-y-3">
                <div>
                  <Text strong className="text-gray-600">Remarks:</Text>
                  <Paragraph className="mt-1 p-3 bg-gray-50 rounded-md">
                    {progress.remarks || "No remarks provided"}
                  </Paragraph>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <ExclamationCircleOutlined className="text-red-500" />
                    <Text strong className="text-gray-600">Issues:</Text>
                  </div>
                  <Paragraph className="p-3 bg-red-50 rounded-md border-l-4 border-red-200">
                    {progress.issues || "No issues reported"}
                  </Paragraph>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Photos Section */}
        {Array.isArray(photos) && photos.length > 0 && (
          <Card title={
            <div className="flex items-center space-x-2">
              <CameraOutlined />
              <span>Progress Photos ({photos.length})</span>
            </div>
          }>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((p, i) => {
                const path = p.photoUrl || p;
                const url = getPhotoUrl(path);

                if (!url) return null;

                return (
                  <div key={i} className="relative group">
                    <Image
                      width="100%"
                      height={120}
                      src={url}
                      className="rounded-lg object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors"
                      preview={{ 
                        mask: (
                          <div className="text-white text-center">
                            <CameraOutlined className="text-xl mb-1" />
                            <div>Preview</div>
                          </div>
                        )
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Action Section */}
        <Card  className="border-t-4 border-t-gray-300">
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <Text strong className="block mb-2">Rejection Reason:</Text>
              <TextArea
                rows={4}
                placeholder="Please provide a detailed reason if rejecting this progress report..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none"
              />
            </div>
            
            <Divider />
            
            <div className="flex justify-end space-x-3">
              <Button
                size="large"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                danger
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={handleReject}
                loading={loading}
                disabled={loading}
              >
                Reject
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
                loading={loading}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 border-green-600"
              >
                Approve
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    );
  };

  return (
    <Modal
      open
      width={1000}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      title={
        <div className="flex items-center space-x-3 py-2">
          <div className="w-1 h-6 bg-blue-500 rounded"></div>
          <Title level={3} className="!mb-0">Daily Progress Review</Title>
        </div>
      }
      className="top-4"
      bodyStyle={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}
    >
      {renderContent()}
    </Modal>
  );
}
