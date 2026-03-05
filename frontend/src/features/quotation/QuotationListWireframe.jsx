import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Tag, 
  Space, 
  Card, 
  Row, 
  Col, 
  Popconfirm,
  Modal,
  Tooltip,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined, 
  EditOutlined, 
  CopyOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  ProjectOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import quotationApi from '../../api/quotation/quotationApi';
import * as clientApi from '../../api/client/clientApi';
import { companyService } from '../../services/companyService';
import { toast } from '../../utils/toast';

const { RangePicker } = DatePicker;
const { Option } = Select;

const QuotationListWireframe = () => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    companyId: '',
    clientId: '',
    status: '',
    dateRange: null
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [quotations, filters]);

  const loadInitialData = async () => {
    await Promise.all([
      fetchQuotations(),
      fetchClients(),
      fetchCompanies()
    ]);
  };

  const fetchQuotations = async (params = {}) => {
    try {
      setLoading(true);
      const response = await quotationApi.getQuotations({
        page: pagination.current,
        limit: pagination.pageSize,
        ...params
      });
      
      setQuotations(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || response.data?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientApi.getClients();
      const clientsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyService.getAllCompanies();
      const companiesData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...quotations];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(q => 
        q.quotationCode?.toLowerCase().includes(searchLower) ||
        q.projectName?.toLowerCase().includes(searchLower) ||
        q.clientName?.toLowerCase().includes(searchLower)
      );
    }

    // Company filter
    if (filters.companyId) {
      filtered = filtered.filter(q => q.companyId === parseInt(filters.companyId));
    }

    // Client filter
    if (filters.clientId) {
      filtered = filtered.filter(q => q.clientId === parseInt(filters.clientId));
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(q => q.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startDate, endDate] = filters.dateRange;
      filtered = filtered.filter(q => {
        const quotationDate = dayjs(q.createdAt);
        return quotationDate.isAfter(startDate.startOf('day')) && 
               quotationDate.isBefore(endDate.endOf('day'));
      });
    }

    setFilteredQuotations(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      companyId: '',
      clientId: '',
      status: '',
      dateRange: null
    });
  };

  const handleTableChange = (paginationInfo) => {
    setPagination(paginationInfo);
    fetchQuotations({
      page: paginationInfo.current,
      limit: paginationInfo.pageSize
    });
  };

  // Action handlers
  const handleView = (record) => {
    navigate(`/quotations/${record.id}`);
  };

  const handleEdit = (record) => {
    navigate(`/quotations/${record.id}/edit`);
  };

  const handleClone = async (record) => {
    try {
      const response = await quotationApi.cloneQuotation(record.id);
      toast.success('Quotation cloned successfully');
      navigate(`/quotations/${response.data.id}/edit`);
    } catch (error) {
      toast.error('Failed to clone quotation');
    }
  };

  const handleSubmit = async (record) => {
    try {
      await quotationApi.submitQuotation(record.id);
      toast.success('Quotation submitted for approval');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to submit quotation');
    }
  };

  const handleApprove = async (record) => {
    const remarks = prompt('Enter approval remarks (optional):');
    try {
      await quotationApi.approveQuotation(record.id, remarks || '');
      toast.success('Quotation approved successfully');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to approve quotation');
    }
  };

  const handleReject = async (record) => {
    const remarks = prompt('Enter rejection reason:');
    if (remarks) {
      try {
        await quotationApi.rejectQuotation(record.id, remarks);
        toast.success('Quotation rejected');
        fetchQuotations();
      } catch (error) {
        toast.error('Failed to reject quotation');
      }
    }
  };

  const handleConvertToProject = async (record) => {
    Modal.confirm({
      title: 'Convert to Project',
      content: `Are you sure you want to convert quotation ${record.quotationCode} to a project?`,
      onOk: async () => {
        try {
          const response = await quotationApi.convertToProject(record.id);
          toast.success('Quotation converted to project successfully');
          navigate(`/projects/${response.data.project.id}`);
        } catch (error) {
          toast.error('Failed to convert to project');
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Submitted': return 'orange';
      case 'Approved': return 'green';
      case 'Rejected': return 'red';
      case 'Converted': return 'purple';
      default: return 'blue';
    }
  };

  const getActionButtons = (record) => {
    const buttons = [];

    // View button - always available
    buttons.push(
      <Tooltip key="view" title="View">
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          className="text-blue-600 hover:text-blue-800"
        />
      </Tooltip>
    );

    // Edit button - only for Draft status
    if (record.status === 'Draft') {
      buttons.push(
        <Tooltip key="edit" title="Edit">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-green-600 hover:text-green-800"
          />
        </Tooltip>
      );
    }

    // Clone button - always available
    buttons.push(
      <Tooltip key="clone" title="Clone">
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={() => handleClone(record)}
          className="text-purple-600 hover:text-purple-800"
        />
      </Tooltip>
    );

    // Submit button - only for Draft status
    if (record.status === 'Draft') {
      buttons.push(
        <Tooltip key="submit" title="Submit">
          <Popconfirm
            title="Submit for approval?"
            onConfirm={() => handleSubmit(record)}
          >
            <Button
              type="text"
              size="small"
              icon={<SendOutlined />}
              className="text-orange-600 hover:text-orange-800"
            />
          </Popconfirm>
        </Tooltip>
      );
    }

    // Approve/Reject buttons - only for Submitted status
    if (record.status === 'Submitted') {
      buttons.push(
        <Tooltip key="approve" title="Approve">
          <Popconfirm
            title="Approve quotation?"
            onConfirm={() => handleApprove(record)}
          >
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              className="text-green-600 hover:text-green-800"
            />
          </Popconfirm>
        </Tooltip>
      );

      buttons.push(
        <Tooltip key="reject" title="Reject">
          <Popconfirm
            title="Reject quotation?"
            onConfirm={() => handleReject(record)}
          >
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              className="text-red-600 hover:text-red-800"
            />
          </Popconfirm>
        </Tooltip>
      );
    }

    // Convert to Project button - only for Approved status
    if (record.status === 'Approved') {
      buttons.push(
        <Tooltip key="convert" title="Convert to Project">
          <Button
            type="text"
            size="small"
            icon={<ProjectOutlined />}
            onClick={() => handleConvertToProject(record)}
            className="text-indigo-600 hover:text-indigo-800"
          />
        </Tooltip>
      );
    }

    return buttons;
  };

  const columns = [
    {
      title: 'Quote Code',
      dataIndex: 'quotationCode',
      key: 'quotationCode',
      width: 120,
      fixed: 'left',
      render: (code) => (
        <span className="font-mono text-sm font-medium text-blue-600">
          {code}
        </span>
      )
    },
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      ellipsis: true,
      render: (name) => (
        <span className="font-medium text-gray-900">
          {name || 'N/A'}
        </span>
      )
    },
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      ellipsis: true,
      render: (name) => (
        <span className="text-gray-700">
          {name}
        </span>
      )
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      align: 'center',
      render: (version) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          v{version || '1'}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => (
        <Tag color={getStatusColor(status)} className="text-xs font-medium">
          {status}
        </Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 120,
      align: 'right',
      render: (amount) => (
        <span className="font-medium text-gray-900">
          {amount ? `$${amount.toLocaleString()}` : '$0'}
        </span>
      )
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => (
        <span className="text-sm text-gray-600">
          {date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" className="flex flex-wrap">
          {getActionButtons(record)}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all quotations
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/quotations/new')}
          className="bg-blue-600 hover:bg-blue-700"
          size="large"
        >
          New Quote
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search quotations..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Company"
              value={filters.companyId}
              onChange={(value) => handleFilterChange('companyId', value)}
              className="w-full"
              allowClear
            >
              {companies.map(company => (
                <Option key={company.id || company._id} value={company.id || company._id}>
                  {company.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Client"
              value={filters.clientId}
              onChange={(value) => handleFilterChange('clientId', value)}
              className="w-full"
              allowClear
            >
              {clients.map(client => (
                <Option key={client.id || client._id} value={client.id || client._id}>
                  {client.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              className="w-full"
              allowClear
            >
              <Option value="Draft">Draft</Option>
              <Option value="Submitted">Submitted</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Rejected">Rejected</Option>
              <Option value="Converted">Converted</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              className="w-full"
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} sm={12} md={2}>
            <Space>
              <Tooltip title="Clear Filters">
                <Button
                  icon={<FilterOutlined />}
                  onClick={clearFilters}
                />
              </Tooltip>
              <Tooltip title="Refresh">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchQuotations()}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Stats */}
      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card className="text-center border-l-4 border-l-gray-400">
            <div className="text-2xl font-bold text-gray-600">
              {filteredQuotations.filter(q => q.status === 'Draft').length}
            </div>
            <div className="text-sm text-gray-500">Draft</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center border-l-4 border-l-orange-400">
            <div className="text-2xl font-bold text-orange-600">
              {filteredQuotations.filter(q => q.status === 'Submitted').length}
            </div>
            <div className="text-sm text-gray-500">Submitted</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center border-l-4 border-l-green-400">
            <div className="text-2xl font-bold text-green-600">
              {filteredQuotations.filter(q => q.status === 'Approved').length}
            </div>
            <div className="text-sm text-gray-500">Approved</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center border-l-4 border-l-red-400">
            <div className="text-2xl font-bold text-red-600">
              {filteredQuotations.filter(q => q.status === 'Rejected').length}
            </div>
            <div className="text-sm text-gray-500">Rejected</div>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredQuotations}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} quotations`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="middle"
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <div className="text-gray-400 mb-4">
                  <PlusOutlined style={{ fontSize: '48px' }} />
                </div>
                <div className="text-gray-500 mb-2">No quotations found</div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
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

export default QuotationListWireframe;