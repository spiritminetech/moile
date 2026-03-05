import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker, Table, Button, Modal, Form, Input, Select, Space, Tag, Popconfirm, Card, Row, Col, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, DragOutlined, FileTextOutlined, DollarOutlined, AuditOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import quotationApi from '../../api/quotation/quotationApi';
import quotationTermApi from '../../api/quotation/quotationTermApi';
import * as clientApi from '../../api/client/clientApi';
import { companyService } from '../../services/companyService';
import { toast } from '../../utils/toast';

const { TextArea } = Input;
const { Option } = Select;

const QuotationFormPageWireframe = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

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
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [quotationStatus, setQuotationStatus] = useState('Draft');
  const [quotationVersion, setQuotationVersion] = useState('v1');
  
  // Form data
  const [formData, setFormData] = useState({
    companyId: '',
    clientId: '',
    projectName: '',
    description: '',
    validUntil: null,
    quotationId: null,
    quotationCode: ''
  });

  // Cost breakdown state
  const [costItems, setCostItems] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm] = Form.useForm();

  // Terms state
  const [terms, setTerms] = useState([]);
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [termForm] = Form.useForm();

  // Approval state
  const [approvalHistory, setApprovalHistory] = useState([]);

  // Categories for cost breakdown
  const categories = [
    { value: 'Manpower', label: 'Manpower', color: 'blue' },
    { value: 'Material', label: 'Material', color: 'green' },
    { value: 'Tool', label: 'Tool/Machinery', color: 'orange' },
    { value: 'Transport', label: 'Transport', color: 'purple' },
    { value: 'Warranty', label: 'Warranty', color: 'cyan' },
    { value: 'Certification', label: 'Certification', color: 'magenta' }
  ];

  const units = ['Days', 'Month', 'Hour', 'Nos', 'Lot', 'Sqm', 'Cum', 'Kg', 'Ton', 'Tin'];

  // Term types
  const termTypes = [
    { value: 'Payment', label: 'Payment', color: 'blue' },
    { value: 'Warranty', label: 'Warranty', color: 'green' },
    { value: 'Delivery', label: 'Delivery', color: 'orange' },
    { value: 'Validity', label: 'Validity', color: 'purple' },
    { value: 'General', label: 'General', color: 'default' }
  ];

  // Load initial data
  useEffect(() => {
    // Check if user has permission to access this page
    if (!isManager && !isBoss) {
      toast.error('You do not have permission to access this page');
      navigate('/');
      return;
    }

    // If BOSS role and trying to create new quotation, redirect
    if (isBoss && !isEdit) {
      toast.error('Only managers can create quotations');
      navigate('/quotations');
      return;
    }

    const loadInitialData = async () => {
      setLoadingData(true);
      await Promise.all([fetchClients(), fetchCompanies()]);
      if (isEdit) {
        await fetchQuotation();
        // After fetching quotation, fetch related data
        await Promise.all([
          fetchCostItems(),
          fetchTerms(),
          fetchApprovalHistory()
        ]);
      }
      setLoadingData(false);
    };
    
    loadInitialData();
  }, [id, isManager, isBoss, navigate]);

  // Refetch related data when formData.quotationId changes (for new quotations)
  useEffect(() => {
    if (formData.quotationId && !isEdit) {
      // This handles the case when a new quotation is created and we need to load its related data
      Promise.all([
        fetchCostItems(),
        fetchTerms(),
        fetchApprovalHistory()
      ]);
    }
  }, [formData.quotationId]);

  // API calls
  const fetchClients = async () => {
    try {
      const response = await clientApi.getClients();
      const clientsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyService.getAllCompanies();
      const companiesData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to fetch companies');
    }
  };

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationApi.getQuotationById(id);
      const quotation = response.data;
      
      setFormData({
        companyId: quotation.companyId,
        clientId: quotation.clientId,
        projectName: quotation.projectName,
        description: quotation.description || '',
        validUntil: quotation.validUntil ? dayjs(quotation.validUntil) : null,
        quotationId: quotation.id,
        quotationCode: quotation.quotationCode || ''
      });
      
      setQuotationStatus(quotation.status);
      setQuotationVersion(quotation.version || 'v1');
    } catch (error) {
      console.error('Error fetching quotation:', error);
      toast.error('Failed to fetch quotation details');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCostItems = async () => {
    try {
      // Use id from URL for edit mode, or formData.quotationId for new quotations
      const quotationId = id || formData.quotationId;
      if (!quotationId) {
        console.log('No quotation ID available for fetching items');
        return;
      }
      
      console.log('Fetching items for quotation ID:', quotationId);
      const response = await quotationApi.getQuotationItems(quotationId);
      setCostItems(response.data || []);
    } catch (error) {
      console.error('Error fetching cost items:', error);
      // Don't show error toast if quotation doesn't exist yet
      if (error.message && !error.message.includes('not found')) {
        toast.error('Failed to fetch cost items');
      }
    }
  };

  const fetchTerms = async () => {
    try {
      // Use id from URL for edit mode, or formData.quotationId for new quotations
      const quotationId = id || formData.quotationId;
      if (!quotationId) {
        console.log('No quotation ID available for fetching terms');
        return;
      }
      
      console.log('Fetching terms for quotation ID:', quotationId, 'Type:', typeof quotationId);
      console.log('API call URL will be: /quotations/' + quotationId + '/terms');
      
      const response = await quotationTermApi.getQuotationTerms(quotationId);
      console.log('Terms API response:', response);
      
      setTerms(response.data || []);
      console.log('Set terms state to:', response.data || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      // Don't show error toast if quotation doesn't exist yet
      if (error.message && !error.message.includes('not found')) {
        toast.error('Failed to fetch terms');
      }
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      // Use id from URL for edit mode, or formData.quotationId for new quotations
      const quotationId = id || formData.quotationId;
      if (!quotationId) {
        console.log('No quotation ID available for fetching approval history');
        return;
      }
      
      console.log('Fetching approval history for quotation ID:', quotationId);
      const response = await quotationApi.getApprovalHistory(quotationId);
      const approvals = response.data || [];
      
      // Transform the data for display
      const transformedApprovals = approvals.map(approval => ({
        id: approval._id,
        approver: `User ${approval.approverId}`, // You can enhance this with user lookup
        role: approval.approverRole || 'Unknown',
        action: approval.action,
        remarks: approval.remarks || '-',
        date: new Date(approval.actionAt).toLocaleDateString('en-GB')
      }));
      
      setApprovalHistory(transformedApprovals);
    } catch (error) {
      console.error('Error fetching approval history:', error);
      // Keep empty array if error
      setApprovalHistory([]);
    }
  };

  // Event handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only managers can create/edit quotations
    if (!isManager) {
      toast.error('Only managers can create or edit quotations');
      return;
    }
    
    if (!formData.companyId || !formData.clientId || !formData.projectName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        clientId: parseInt(formData.clientId),
        companyId: parseInt(formData.companyId),
        validUntil: formData.validUntil ? formData.validUntil.toISOString() : null
      };

      if (isEdit) {
        await quotationApi.updateQuotation(id, submitData);
        toast.success('Quotation updated successfully');
      } else {
        const response = await quotationApi.createQuotation(submitData);
        toast.success('Quotation created successfully');
        
        const newQuotationId = response.data.id;
        console.log('New quotation created with ID:', newQuotationId, 'Type:', typeof newQuotationId);
        
        // Update form data with the new quotation details
        setFormData(prev => ({ 
          ...prev, 
          quotationId: newQuotationId,
          quotationCode: response.data.quotationCode 
        }));
        
        // Set the quotation status and version
        setQuotationStatus(response.data.status || 'Draft');
        setQuotationVersion(`v${response.data.version || 1}`);
        
        // Switch to items tab
        setActiveTab('items');
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          console.log('Form data after creation:', { 
            quotationId: newQuotationId, 
            quotationCode: response.data.quotationCode 
          });
        }, 100);
        
        return;
      }
      
      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error(error.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  // Cost breakdown functions
  const calculateCategoryTotals = () => {
    const totals = {};
    let grandTotal = 0;

    categories.forEach(cat => {
      const categoryItems = costItems.filter(item => item.category === cat.value);
      const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      totals[cat.value] = categoryTotal;
      grandTotal += categoryTotal;
    });

    return { categoryTotals: totals, grandTotal };
  };

  const handleAddItem = () => {
    setEditingItem(null);
    itemForm.resetFields();
    setShowItemModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    itemForm.setFieldsValue(item);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await quotationApi.deleteQuotationItem(itemId);
      toast.success('Item deleted successfully');
      fetchCostItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleItemSubmit = async (values) => {
    try {
      // Only managers can add/edit items
      if (!isManager) {
        toast.error('Only managers can add or edit items');
        return;
      }

      // Ensure we have a valid quotation ID
      const quotationId = id || formData.quotationId;
      console.log('Available IDs - URL id:', id, 'formData.quotationId:', formData.quotationId, 'Final quotationId:', quotationId);
      
      if (!quotationId) {
        toast.error('No quotation ID available. Please save the quotation first.');
        return;
      }

      // Validate that quotationId is a valid number
      const numericQuotationId = parseInt(quotationId);
      if (isNaN(numericQuotationId)) {
        toast.error('Invalid quotation ID. Please refresh and try again.');
        console.error('Invalid quotationId:', quotationId, 'Parsed:', numericQuotationId);
        return;
      }

      const itemData = {
        ...values,
        quotationId: numericQuotationId,
        quantity: parseFloat(values.quantity),
        unitRate: parseFloat(values.unitRate),
        totalAmount: parseFloat(values.quantity) * parseFloat(values.unitRate)
      };

      console.log('Submitting item data:', itemData);

      if (editingItem) {
        await quotationApi.updateQuotationItem(editingItem.id, itemData);
        toast.success('Item updated successfully');
      } else {
        await quotationApi.createQuotationItem(itemData);
        toast.success('Item added successfully');
      }

      setShowItemModal(false);
      fetchCostItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
    }
  };

  // Terms functions
  const handleAddTerm = () => {
    setEditingTerm(null);
    termForm.resetFields();
    setShowTermModal(true);
  };

  const handleEditTerm = (term) => {
    setEditingTerm(term);
    termForm.setFieldsValue(term);
    setShowTermModal(true);
  };

  const handleDeleteTerm = async (termId) => {
    try {
      await quotationTermApi.deleteTerm(termId);
      toast.success('Term deleted successfully');
      fetchTerms();
    } catch (error) {
      toast.error('Failed to delete term');
    }
  };

  const handleTermSubmit = async (values) => {
    try {
      // Only managers can add/edit terms
      if (!isManager) {
        toast.error('Only managers can add or edit terms');
        return;
      }

      // Ensure we have a valid quotation ID
      const quotationId = id || formData.quotationId;
      if (!quotationId) {
        toast.error('No quotation ID available. Please save the quotation first.');
        return;
      }

      const termData = {
        ...values,
        quotationId: quotationId
      };

      console.log('Submitting term data:', termData);

      if (editingTerm) {
        await quotationTermApi.updateTerm(editingTerm.id, termData);
        toast.success('Term updated successfully');
      } else {
        await quotationTermApi.createTerm(termData);
        toast.success('Term added successfully');
      }

      setShowTermModal(false);
      fetchTerms();
    } catch (error) {
      console.error('Error saving term:', error);
      toast.error(error.message || 'Failed to save term');
    }
  };

  // Approval functions
  const handleSubmitForApproval = async () => {
    try {
      // Only managers can submit for approval
      if (!isManager) {
        toast.error('Only managers can submit quotations for approval');
        return;
      }

      const quotationId = id || formData.quotationId;
      if (!quotationId) {
        toast.error('No quotation ID available');
        return;
      }
      
      await quotationApi.submitQuotation(quotationId);
      setQuotationStatus('Submitted');
      toast.success('Quotation submitted for approval');
      fetchApprovalHistory();
    } catch (error) {
      toast.error('Failed to submit quotation');
    }
  };

  const handleApprove = async () => {
    // Only boss can approve
    if (!isBoss) {
      toast.error('Only boss can approve quotations');
      return;
    }

    const remarks = prompt('Enter approval remarks (optional):');
    try {
      const quotationId = id || formData.quotationId;
      if (!quotationId) {
        toast.error('No quotation ID available');
        return;
      }
      
      console.log('Current quotation status:', quotationStatus); // Debug log
      await quotationApi.approveQuotation(quotationId, remarks || '');
      setQuotationStatus('Approved');
      toast.success('Quotation approved successfully');
      fetchApprovalHistory();
    } catch (error) {
      console.error('Approval error:', error); // Debug log
      toast.error(error.message || 'Failed to approve quotation');
    }
  };

  const handleReject = async () => {
    // Only boss can reject
    if (!isBoss) {
      toast.error('Only boss can reject quotations');
      return;
    }

    const remarks = prompt('Enter rejection reason:');
    if (remarks) {
      try {
        const quotationId = id || formData.quotationId;
        if (!quotationId) {
          toast.error('No quotation ID available');
          return;
        }
        
        await quotationApi.rejectQuotation(quotationId, remarks);
        setQuotationStatus('Rejected');
        toast.success('Quotation rejected');
        fetchApprovalHistory();
      } catch (error) {
        toast.error('Failed to reject quotation');
      }
    }
  };

  const handleConvertToProject = async () => {
    try {
      // Both manager and boss can convert to project
      if (!isManager && !isBoss) {
        toast.error('You do not have permission to convert quotations to projects');
        return;
      }

      const quotationId = id || formData.quotationId;
      if (!quotationId) {
        toast.error('No quotation ID available');
        return;
      }
      
      const response = await quotationApi.convertToProject(quotationId);
      toast.success('Quotation converted to project successfully');
      // Redirect to quotations list instead of non-existent project page
      navigate('/quotations');
    } catch (error) {
      toast.error('Failed to convert to project');
    }
  };

  // Cost breakdown columns
  const costColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const cat = categories.find(c => c.value === category);
        return <Tag color={cat?.color}>{category}</Tag>;
      }
    },
    {
      title: 'Trade/Item',
      dataIndex: 'trade',
      key: 'trade',
      render: (trade, record) => trade || record.itemName || '-'
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'right'
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
    },
    {
      title: 'Rate',
      dataIndex: 'unitRate',
      key: 'unitRate',
      width: 100,
      align: 'right',
      render: (rate) => `$${rate?.toFixed(2) || '0.00'}`
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (total) => `$${total?.toFixed(2) || '0.00'}`
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
            disabled={quotationStatus !== 'Draft' || !isManager}
          />
          <Popconfirm
            title="Delete item?"
            onConfirm={() => handleDeleteItem(record.id)}
            disabled={quotationStatus !== 'Draft' || !isManager}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={quotationStatus !== 'Draft' || !isManager}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Terms columns
  const termColumns = [
    {
      title: 'Type',
      dataIndex: 'termType',
      key: 'termType',
      width: 100,
      render: (type) => {
        const termType = termTypes.find(t => t.value === type);
        return <Tag color={termType?.color}>{type}</Tag>;
      }
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditTerm(record)}
            disabled={quotationStatus !== 'Draft' || !isManager}
          />
          <Popconfirm
            title="Delete term?"
            onConfirm={() => handleDeleteTerm(record.id)}
            disabled={quotationStatus !== 'Draft' || !isManager}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={quotationStatus !== 'Draft' || !isManager}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Approval history columns
  const approvalColumns = [
    {
      title: 'Approver',
      dataIndex: 'approver',
      key: 'approver'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role'
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        const color = action === 'Approved' ? 'green' : action === 'Rejected' ? 'red' : 'orange';
        return <Tag color={color}>{action}</Tag>;
      }
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks'
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    }
  ];

  if (loadingData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quotation data...</p>
        </div>
      </div>
    );
  }

  const { categoryTotals, grandTotal } = calculateCategoryTotals();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Quotation' : 'Create Quotation'}
              </h1>
              <Tag color={isManager ? 'blue' : isBoss ? 'green' : 'default'} className="text-xs">
                {userRole || 'Unknown Role'}
              </Tag>
            </div>
            {formData.quotationCode && (
              <p className="text-gray-600 mt-1">
                Quotation Code: <span className="font-semibold text-blue-600">{formData.quotationCode}</span>
              </p>
            )}
            {isBoss && !isEdit && (
              <p className="text-orange-600 mt-1 text-sm">
                Only managers can create quotations. You can review and approve existing quotations.
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => navigate('/quotations')}>
              Cancel
            </Button>
            {activeTab === 'basic' && isManager && (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={quotationStatus !== 'Draft' && isEdit}
              >
                {isEdit ? 'Update Quotation' : 'Create Quotation'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileTextOutlined className="mr-2" />
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!isEdit && !formData.quotationId}
            >
              <DollarOutlined className="mr-2" />
              Cost Breakdown
              {!isEdit && !formData.quotationId && (
                <span className="ml-1 text-xs text-gray-400">(Create first)</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'terms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AuditOutlined className="mr-2" />
              Terms & Conditions
            </button>
            {/* Approval tab only visible to BOSS */}
            {isBoss && (
              <button
                onClick={() => setActiveTab('approval')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approval'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled={!isEdit && !formData.quotationId}
              >
                <UserOutlined className="mr-2" />
                Approval
                {!isEdit && !formData.quotationId && (
                  <span className="ml-1 text-xs text-gray-400">(Create first)</span>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <Row gutter={24}>
              <Col span={12}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.companyId}
                      onChange={(value) => handleInputChange('companyId', value)}
                      className="w-full"
                      placeholder="Select Company"
                      disabled={quotationStatus !== 'Draft' || !isManager}
                    >
                      {companies.map(company => (
                        <Option key={company.id || company.id} value={company.id || company.id}>
                          {company.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.clientId}
                      onChange={(value) => handleInputChange('clientId', value)}
                      className="w-full"
                      placeholder="Select Client"
                      disabled={quotationStatus !== 'Draft' || !isManager}
                    >
                      {clients.map(client => (
                        <Option key={client.id || client.id} value={client.id || client.id}>
                          {client.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until
                    </label>
                    <DatePicker
                      value={formData.validUntil}
                      onChange={(date) => handleInputChange('validUntil', date)}
                      format="DD/MM/YYYY"
                      placeholder="Select valid until date"
                      className="w-full"
                      disabled={quotationStatus !== 'Draft' || !isManager}
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                  </div>
                </div>
              </Col>

              <Col span={12}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version
                    </label>
                    <Input
                      value={quotationVersion}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Tag color={
                      quotationStatus === 'Draft' ? 'default' :
                      quotationStatus === 'Submitted' ? 'orange' :
                      quotationStatus === 'Approved' ? 'green' :
                      quotationStatus === 'Rejected' ? 'red' : 'blue'
                    }>
                      {quotationStatus}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Enter project name"
                disabled={quotationStatus !== 'Draft' || !isManager}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <TextArea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                placeholder="Enter project description"
                disabled={quotationStatus !== 'Draft' || !isManager}
              />
            </div>

            {!isEdit && formData.quotationId && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckOutlined className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Quotation created successfully!
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="primary"
                      onClick={() => setActiveTab('items')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Add Cost Items →
                    </Button>
                    {quotationStatus === 'Draft' && isManager && (
                      <Button
                        type="primary"
                        onClick={handleSubmitForApproval}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Submit for Approval
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit for Approval button for existing quotations */}
            {isEdit && quotationStatus === 'Draft' && isManager && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-blue-800">
                      Ready to submit for approval?
                    </span>
                    <p className="text-xs text-blue-600 mt-1">
                      Once submitted, you won't be able to edit this quotation.
                    </p>
                  </div>
                  <Button
                    type="primary"
                    onClick={handleSubmitForApproval}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Submit for Approval
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-6">
            {(!isEdit && !formData.quotationId) ? (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
                <div className="text-blue-600 mb-4">
                  <DollarOutlined style={{ fontSize: '48px' }} />
                </div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Cost Breakdown Not Available Yet
                </h3>
                <p className="text-blue-800 mb-4">
                  Please create the quotation first by filling in the basic information.
                </p>
                <Button
                  type="primary"
                  onClick={() => setActiveTab('basic')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Basic Info
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">COST BREAKDOWN</h3>
                  <div className="flex space-x-2">
                    <Select
                      placeholder="Category"
                      style={{ width: 150 }}
                      onChange={(value) => {
                        itemForm.setFieldsValue({ category: value });
                        handleAddItem();
                      }}
                      disabled={quotationStatus !== 'Draft' || !isManager}
                    >
                      {categories.map(cat => (
                        <Option key={cat.value} value={cat.value}>
                          <Tag color={cat.color}>{cat.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddItem}
                      disabled={quotationStatus !== 'Draft' || !isManager}
                    >
                      Add Item
                    </Button>
                  </div>
                </div>

                <Table
                  columns={costColumns}
                  dataSource={costItems}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  scroll={{ x: 800 }}
                />

                {/* Category Totals */}
                <Card className="bg-gray-50">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Subtotals:</h4>
                    <Row gutter={16}>
                      {categories.map(cat => (
                        <Col span={8} key={cat.value}>
                          <div className="flex justify-between">
                            <span>{cat.label}:</span>
                            <span className="font-medium">
                              ${(categoryTotals[cat.value] || 0).toFixed(2)}
                            </span>
                          </div>
                        </Col>
                      ))}
                    </Row>
                    <Divider />
                    <div className="flex justify-between text-lg font-bold">
                      <span>GRAND TOTAL:</span>
                      <span className="text-blue-600">SGD ${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">TERMS & CONDITIONS</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTerm}
                disabled={quotationStatus !== 'Draft' || !isManager}
              >
                Add Term
              </Button>
            </div>

            {/* Debug info */}
            <div className="bg-yellow-50 p-2 rounded text-xs text-gray-600">
              Debug: Terms count: {terms.length}, QuotationId: {id || formData.quotationId}
              {terms.length > 0 && (
                <div>Terms: {JSON.stringify(terms.map(t => ({ id: t.id, type: t.termType, title: t.title })))}</div>
              )}
            </div>

            <Table
              columns={termColumns}
              dataSource={terms}
              rowKey="id"
              pagination={false}
              size="middle"
              locale={{
                emptyText: (
                  <div className="py-8 text-center">
                    <div className="text-gray-400 mb-2">No terms added yet</div>
                    <div className="text-sm text-gray-500">
                      Click "Add Term" to get started
                    </div>
                  </div>
                )
              }}
            />

            {terms.length > 0 && (
              <div className="text-center text-sm text-gray-500">
                <DragOutlined className="mr-1" />
                Drag to reorder terms
              </div>
            )}
          </div>
        )}

        {activeTab === 'approval' && isBoss && (
          <div className="space-y-6">
            {!isEdit && !formData.quotationId ? (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
                <div className="text-blue-600 mb-4">
                  <UserOutlined style={{ fontSize: '48px' }} />
                </div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Approval Not Available Yet
                </h3>
                <p className="text-blue-800">
                  Please create the quotation first.
                </p>
              </div>
            ) : (
              <>
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Approval Status</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div>
                          <span className="text-sm text-gray-600">Current Status: </span>
                          <Tag color={
                            quotationStatus === 'Draft' ? 'default' :
                            quotationStatus === 'Submitted' ? 'orange' :
                            quotationStatus === 'Approved' ? 'green' :
                            quotationStatus === 'Rejected' ? 'red' : 'blue'
                          }>
                            {quotationStatus}
                          </Tag>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Version: </span>
                          <span className="font-medium">{quotationVersion}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {quotationStatus === 'Submitted' && isBoss && (
                        <>
                          <Button
                            type="primary"
                            onClick={handleApprove}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            danger
                            onClick={handleReject}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {quotationStatus === 'Approved' && (isManager || isBoss) && (
                        <Button
                          type="primary"
                          onClick={handleConvertToProject}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Convert to Project
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                <Card title="Approval History">
                  <Table
                    columns={approvalColumns}
                    dataSource={approvalHistory}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    locale={{
                      emptyText: (
                        <div className="py-8 text-center">
                          <div className="text-gray-400 mb-2">No approval history yet</div>
                          <div className="text-sm text-gray-500">
                            Submit the quotation to start the approval process
                          </div>
                        </div>
                      )
                    }}
                  />
                </Card>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Item Modal */}
      <Modal
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        open={showItemModal}
        onCancel={() => setShowItemModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={itemForm}
          layout="vertical"
          onFinish={handleItemSubmit}
          initialValues={{ category: 'Manpower', quantity: 1, unitRate: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      <Tag color={cat.color}>{cat.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="trade"
                label="Trade/Item Name"
              >
                <Input placeholder="Enter trade or item name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={2} placeholder="Enter description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <Input type="number" min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please select unit' }]}
              >
                <Select placeholder="Select unit">
                  {units.map(unit => (
                    <Option key={unit} value={unit}>{unit}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unitRate"
                label="Unit Rate"
                rules={[{ required: true, message: 'Please enter unit rate' }]}
              >
                <Input type="number" min={0} step={0.01} prefix="$" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setShowItemModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Term Modal */}
      <Modal
        title={editingTerm ? 'Edit Term' : 'Add New Term'}
        open={showTermModal}
        onCancel={() => setShowTermModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={termForm}
          layout="vertical"
          onFinish={handleTermSubmit}
          initialValues={{ termType: 'General' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="termType"
                label="Term Type"
                rules={[{ required: true, message: 'Please select term type' }]}
              >
                <Select placeholder="Select term type">
                  {termTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      <Tag color={type.color}>{type.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title"
              >
                <Input placeholder="Enter term title (optional)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter term description' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter detailed description of the term..."
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setShowTermModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTerm ? 'Update' : 'Create'} Term
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuotationFormPageWireframe;