import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Progress } from 'antd';
import { 
  FileTextOutlined, 
  DollarOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import quotationApi from '../../api/quotation/quotationApi';

const QuotationOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quotationStats, setQuotationStats] = useState({
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    totalValue: 0,
    conversionRate: 0
  });
  const [recentQuotations, setRecentQuotations] = useState([]);

  useEffect(() => {
    fetchQuotationData();
  }, []);

  const fetchQuotationData = async () => {
    try {
      setLoading(true);
      
      // Fetch all quotations
      const response = await quotationApi.getQuotations({ limit: 50 });
      const quotations = response.data || [];

      // Calculate statistics
      const stats = {
        draft: quotations.filter(q => q.status === 'Draft').length,
        submitted: quotations.filter(q => q.status === 'Submitted').length,
        approved: quotations.filter(q => q.status === 'Approved').length,
        rejected: quotations.filter(q => q.status === 'Rejected').length,
        totalValue: quotations
          .filter(q => q.status === 'Approved')
          .reduce((sum, q) => sum + (q.totalAmount || 0), 0),
        conversionRate: quotations.length > 0 
          ? Math.round((quotations.filter(q => q.status === 'Approved').length / quotations.length) * 100)
          : 0
      };

      setQuotationStats(stats);
      
      // Set recent quotations (last 10)
      setRecentQuotations(quotations.slice(0, 10));
      
    } catch (error) {
      console.error('Error fetching quotation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Submitted': return 'orange';
      case 'Approved': return 'green';
      case 'Rejected': return 'red';
      default: return 'blue';
    }
  };

  const columns = [
    {
      title: 'Quote Code',
      dataIndex: 'quotationCode',
      key: 'quotationCode',
      width: 120,
      render: (code) => <span className="font-mono text-sm">{code}</span>
    },
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      ellipsis: true
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version) => <span className="font-mono text-xs">{version || 'v1'}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="text-xs">
          {status}
        </Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <span className="font-medium">
          ${amount ? amount.toLocaleString() : '0'}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <div className="flex space-x-1">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/quotations/${record._id}`)}
            className="text-blue-600 hover:text-blue-800"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/quotations/${record._id}/edit`)}
            className="text-green-600 hover:text-green-800"
            disabled={record.status !== 'Draft'}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quotation Overview</h2>
          <p className="text-gray-600 text-sm">Monitor quotation pipeline and performance</p>
        </div>
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={() => navigate('/quotations/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          New Quotation
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center border-l-4 border-l-gray-400">
            <Statistic
              title="Draft"
              value={quotationStats.draft}
              prefix={<FileTextOutlined className="text-gray-500" />}
              valueStyle={{ color: '#6b7280' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center border-l-4 border-l-orange-400">
            <Statistic
              title="Submitted"
              value={quotationStats.submitted}
              prefix={<ClockCircleOutlined className="text-orange-500" />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center border-l-4 border-l-green-400">
            <Statistic
              title="Approved"
              value={quotationStats.approved}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center border-l-4 border-l-red-400">
            <Statistic
              title="Rejected"
              value={quotationStats.rejected}
              prefix={<CloseCircleOutlined className="text-red-500" />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Total Approved Value (This Month)" className="h-full">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                SGD ${quotationStats.totalValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                From {quotationStats.approved} approved quotations
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Conversion Rate" className="h-full">
            <div className="text-center">
              <Progress
                type="circle"
                percent={quotationStats.conversionRate}
                format={percent => `${percent}%`}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                className="mb-4"
              />
              <div className="text-sm text-gray-500">
                Quotations converted to approved status
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Quotations Table */}
      <Card 
        title="Recent Quotations" 
        extra={
          <Button 
            type="link" 
            onClick={() => navigate('/quotations')}
            className="text-blue-600 hover:text-blue-800"
          >
            View All →
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={recentQuotations}
          rowKey="_id"
          loading={loading}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <FileTextOutlined className="text-4xl text-gray-300 mb-4" />
                <div className="text-gray-500 mb-2">No quotations found</div>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => navigate('/quotations/new')}
                  size="small"
                >
                  Create First Quotation
                </Button>
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
};

export default QuotationOverview;