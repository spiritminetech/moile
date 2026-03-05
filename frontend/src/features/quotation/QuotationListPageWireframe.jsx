import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Tag, 
  Space, 
  Popconfirm,
  Modal,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import quotationApi from '../../api/quotation/quotationApi';
import * as clientApi from '../../api/client/clientApi';
import { companyService } from '../../services/companyService';
import { toast } from '../../utils/toast';

const { RangePicker } = DatePicker;
const { Option } = Select;

const QuotationListPageWireframe = () => {
  const navigate = useNavigate();
  
  // Get user role from localStorage or context
  const getUserRole = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
    return null;
  };

  const userRole = getUserRole();
  const isManager = userRole === 'MANAGER';
  const isBoss = userRole === 'BOSS';
  
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
    // Check if user has permission to access this page
    if (!isManager && !isBoss) {
      toast.error('You do not have permission to access this page');
      navigate('/');
      return;
    }

    loadInitialData();
  }, [isManager, isBoss, navigate]);

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
        total: response.total || response.data?.length || 0
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
      // Navigate to edit the cloned quotation instead of trying to go to projects
      navigate(`/quotations/${response.data.id}/edit`);
    } catch (error) {
      toast.error('Failed to clone quotation');
    }
  };

  const handleSubmit = async (record) => {
    try {
      // Only managers can submit for approval
      if (!isManager) {
        toast.error('Only managers can submit quotations for approval');
        return;
      }

      await quotationApi.submitQuotation(record.id);
      toast.success('Quotation submitted for approval');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to submit quotation');
    }
  };

  const handleApprove = async (record) => {
    // Only boss can approve
    if (!isBoss) {
      toast.error('Only boss can approve quotations');
      return;
    }

    Modal.confirm({
      title: 'Approve Quotation',
      content: `Are you sure you want to approve quotation ${record.quotationCode}?`,
      okText: 'Yes, Approve',
      cancelText: 'Cancel',
      onOk: async () => {
        const remarks = prompt('Enter approval remarks (optional):');
        try {
          await quotationApi.approveQuotation(record.id, remarks || '');
          toast.success('Quotation approved successfully');
          fetchQuotations();
        } catch (error) {
          toast.error('Failed to approve quotation');
        }
      }
    });
  };

  const handleReject = async (record) => {
    // Only boss can reject
    if (!isBoss) {
      toast.error('Only boss can reject quotations');
      return;
    }

    Modal.confirm({
      title: 'Reject Quotation',
      content: `Are you sure you want to reject quotation ${record.quotationCode}?`,
      okText: 'Yes, Reject',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
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
      }
    });
  };

  const handleConvertToProject = async (record) => {
    // Both manager and boss can convert to project
    if (!isManager && !isBoss) {
      toast.error('You do not have permission to convert quotations to projects');
      return;
    }

    Modal.confirm({
      title: 'Convert to Project',
      content: `Are you sure you want to convert quotation ${record.quotationCode} to a project?`,
      onOk: async () => {
        try {
          const response = await quotationApi.convertToProject(record.id);
          toast.success('Quotation converted to project successfully');
          // Refresh the quotations list to show updated status
          fetchQuotations();
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
      default: return 'blue';
    }
  };

  const renderActions = (record) => {
    const actions = [];

    // Always show View
    actions.push(
      <Button
        key="view"
        type="link"
        size="small"
        onClick={() => handleView(record)}
        className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium text-xs"
      >
        View
      </Button>
    );

    // Show Edit for Draft status - ensure proper status comparison (only for managers)
    if ((record.status === 'Draft' || record.status === 'draft') && isManager) {
      actions.push(
        <Button
          key="edit"
          type="link"
          size="small"
          onClick={() => handleEdit(record)}
          className="text-green-600 hover:text-green-800 p-0 h-auto font-medium text-xs"
        >
          Edit
        </Button>
      );
    }

    // Always show Clone
    actions.push(
      <Button
        key="clone"
        type="link"
        size="small"
        onClick={() => handleClone(record)}
        className="text-purple-600 hover:text-purple-800 p-0 h-auto font-medium text-xs"
      >
        Clone
      </Button>
    );

    // Show Submit for Draft status (only for managers)
    if ((record.status === 'Draft' || record.status === 'draft') && isManager) {
      actions.push(
        <Popconfirm
          key="submit"
          title="Submit for approval?"
          description="This quotation will be sent for approval."
          onConfirm={() => handleSubmit(record)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="link"
            size="small"
            className="text-orange-600 hover:text-orange-800 p-0 h-auto font-medium text-xs"
          >
            Submit
          </Button>
        </Popconfirm>
      );
    }

    // Show Approve/Reject for Submitted status (only for boss) - make them more prominent
    if ((record.status === 'Submitted' || record.status === 'submitted') && isBoss) {
      actions.push(
        <Button
          key="approve"
          type="primary"
          size="small"
          onClick={() => handleApprove(record)}
          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
        >
          ✓ Approve
        </Button>
      );

      actions.push(
        <Button
          key="reject"
          danger
          size="small"
          onClick={() => handleReject(record)}
          className="text-xs px-2 py-1 h-6"
        >
          ✗ Reject
        </Button>
      );
    }

    // Show Convert to Project for Approved status (both manager and boss)
    if ((record.status === 'Approved' || record.status === 'approved') && (isManager || isBoss)) {
      actions.push(
        <Button
          key="convert"
          type="link"
          size="small"
          onClick={() => handleConvertToProject(record)}
          className="text-indigo-600 hover:text-indigo-800 p-0 h-auto font-medium text-xs"
        >
          Convert
        </Button>
      );
    }

    return (
      <div className="flex flex-wrap gap-1 justify-start">
        {actions.map((action, index) => (
          <span key={action.key || index} className="flex items-center">
            {action}
            {/* Only add separator for link-style buttons, not for primary/danger buttons */}
            {index < actions.length - 1 && 
             action.props?.type === 'link' && 
             actions[index + 1]?.props?.type === 'link' && (
              <span className="text-gray-300 mx-0.5 text-xs">|</span>
            )}
          </span>
        ))}
      </div>
    );
  };

  const columns = [
    {
      title: 'Quote Code',
      dataIndex: 'quotationCode',
      key: 'quotationCode',
      width: 110,
      fixed: 'left',
      render: (code) => (
        <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {code}
        </span>
      )
    },
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      render: (name) => (
        <Tooltip title={name || 'N/A'}>
          <span className="font-medium text-gray-900 text-xs">
            {name || 'N/A'}
          </span>
        </Tooltip>
      )
    },
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 140,
      ellipsis: {
        showTitle: false,
      },
      render: (name) => (
        <Tooltip title={name}>
          <span className="text-gray-800 text-xs">{name}</span>
        </Tooltip>
      )
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 60,
      align: 'center',
      render: (version) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded-full border">
          v{version || '1'}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status) => (
        <Tag 
          color={getStatusColor(status)} 
          className="text-xs font-medium px-2 py-0.5 rounded-full border-0"
        >
          {status}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 70,
      align: 'center',
      render: (date) => (
        <span className="text-xs text-gray-500">
          {date ? dayjs(date).format('DD/MM/YY') : '-'}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => renderActions(record)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto p-3 sm:p-4 lg:p-6 lg:max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Quotations</h1>
              <Tag color={isManager ? 'blue' : isBoss ? 'green' : 'default'} className="text-xs">
                {userRole || 'Unknown Role'}
              </Tag>
            </div>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {isManager ? 'Create and manage quotations' : isBoss ? 'Review and approve quotations' : 'Manage and track your quotations'}
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/quotations/new')}
            size="large"
            className="w-full sm:w-auto min-w-[140px]"
            disabled={!isManager}
          >
            New Quotation
          </Button>
        </div>

        {/* Approval Actions Bar for BOSS - only show if there are submitted quotations */}
        {isBoss && filteredQuotations.some(q => q.status === 'Submitted' || q.status === 'submitted') && (
          <div className="bg-orange-50 p-4 rounded-lg shadow-sm border border-orange-200 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <UserOutlined className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Pending Approvals</h3>
                  <p className="text-sm text-orange-700">
                    {filteredQuotations.filter(q => q.status === 'Submitted' || q.status === 'submitted').length} quotation(s) waiting for your approval
                  </p>
                </div>
              </div>
              <div className="text-sm text-orange-600">
                Use the action buttons in the table below to approve or reject quotations
              </div>
            </div>
          </div>
        )}

        {/* Manager Creation Reminder */}
        {isManager && filteredQuotations.length === 0 && (
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <PlusOutlined className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Get Started</h3>
                  <p className="text-sm text-blue-700">
                    Create your first quotation to begin the approval workflow
                  </p>
                </div>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/quotations/new')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Quotation
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <Input
                placeholder="Search quotations..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                allowClear
                size="large"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <Select
                placeholder="Select Company"
                value={filters.companyId}
                onChange={(value) => handleFilterChange('companyId', value)}
                className="w-full"
                allowClear
                size="large"
              >
                {companies.map(company => (
                  <Option key={company.id || company._id} value={company.id || company._id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <Select
                placeholder="Select Client"
                value={filters.clientId}
                onChange={(value) => handleFilterChange('clientId', value)}
                className="w-full"
                allowClear
                size="large"
              >
                {clients.map(client => (
                  <Option key={client.id || client._id} value={client.id || client._id}>
                    {client.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                placeholder="Select Status"
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                className="w-full"
                allowClear
                size="large"
              >
                <Option value="Draft">Draft</Option>
                <Option value="Submitted">Submitted</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Rejected">Rejected</Option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Button 
              onClick={clearFilters}
              size="large"
              className="min-w-[80px]"
            >
              Clear
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchQuotations()}
              size="large"
              type="primary"
              ghost
              className="min-w-[80px]"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
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
                responsive: true,
                size: 'default'
              }}
              onChange={handleTableChange}
              scroll={{ 
                x: 760,
                y: 'calc(100vh - 350px)'
              }}
              size="small"
              className="quotation-table [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:border-b-2 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-tbody>tr:hover>td]:bg-slate-100 [&_.ant-table-fixed-left]:shadow-[6px_0_6px_-4px_rgba(0,0,0,0.05)] [&_.ant-table-fixed-right]:shadow-[-6px_0_6px_-4px_rgba(0,0,0,0.05)] [&_.ant-table-tbody>tr>td]:py-2 [&_.ant-table-tbody>tr>td]:px-2 [&_.ant-table-tbody>tr>td]:text-xs sm:[&_.ant-table-tbody>tr>td]:py-3 sm:[&_.ant-table-tbody>tr>td]:px-3 sm:[&_.ant-table-tbody>tr>td]:text-sm"
              locale={{
                emptyText: (
                  <div className="py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <PlusOutlined style={{ fontSize: '48px' }} />
                    </div>
                    <div className="text-gray-500 mb-2 text-lg">No quotations found</div>
                    <p className="text-gray-400 mb-4">Get started by creating your first quotation</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => navigate('/quotations/new')}
                      size="large"
                      disabled={!isManager}
                    >
                      Create First Quotation
                    </Button>
                  </div>
                )
              }}
              rowClassName={(record, index) => 
                index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationListPageWireframe;