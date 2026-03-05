import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Popconfirm,
  Space,
  Typography,
  Tag,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import quotationTermApi from '../../api/quotation/quotationTermApi';

const { Title } = Typography;
const { TextArea } = Input;

// Term type options
const TERM_TYPES = [
  { value: 'Payment', label: 'Payment', color: 'blue' },
  { value: 'Warranty', label: 'Warranty', color: 'green' },
  { value: 'Delivery', label: 'Delivery', color: 'orange' },
  { value: 'Validity', label: 'Validity', color: 'purple' },
  { value: 'General', label: 'General', color: 'default' }
];

const QuotationTermsPageSimple = ({ quotationId = 12345 }) => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [form] = Form.useForm();

  // Load terms on component mount
  useEffect(() => {
    loadTerms();
  }, [quotationId]);

  // Load terms from API
  const loadTerms = async () => {
    setLoading(true);
    try {
      const response = await quotationTermApi.getQuotationTerms(quotationId);
      if (response.success) {
        setTerms(response.data);
      } else {
        message.error('Failed to load terms');
      }
    } catch (error) {
      message.error('Error loading terms: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      if (editingTerm) {
        // Update existing term
        const response = await quotationTermApi.updateTerm(editingTerm._id, values);
        if (response.success) {
          message.success('Term updated successfully');
          loadTerms();
        } else {
          message.error('Failed to update term');
        }
      } else {
        // Create new term
        const termData = {
          ...values,
          quotationId: quotationId
        };
        const response = await quotationTermApi.createTerm(termData);
        if (response.success) {
          message.success('Term created successfully');
          loadTerms();
        } else {
          message.error('Failed to create term');
        }
      }
      handleModalClose();
    } catch (error) {
      message.error('Error saving term: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle delete
  const handleDelete = async (termId) => {
    try {
      const response = await quotationTermApi.deleteTerm(termId);
      if (response.success) {
        message.success('Term deleted successfully');
        loadTerms();
      } else {
        message.error('Failed to delete term');
      }
    } catch (error) {
      message.error('Error deleting term: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle move up/down
  const handleMove = async (index, direction) => {
    const newTerms = [...terms];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newTerms.length) return;
    
    // Swap items
    [newTerms[index], newTerms[targetIndex]] = [newTerms[targetIndex], newTerms[index]];
    setTerms(newTerms);

    // Update sort order in backend
    const termOrder = newTerms.map((term, idx) => ({
      id: term._id,
      sortOrder: idx + 1
    }));

    try {
      await quotationTermApi.reorderTerms(termOrder);
      message.success('Terms reordered successfully');
    } catch (error) {
      message.error('Failed to save new order');
      // Revert on error
      loadTerms();
    }
  };

  // Modal handlers
  const handleModalClose = () => {
    setModalVisible(false);
    setEditingTerm(null);
    form.resetFields();
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    form.setFieldsValue(term);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingTerm(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Get color for term type
  const getTermTypeColor = (termType) => {
    const type = TERM_TYPES.find(t => t.value === termType);
    return type?.color || 'default';
  };

  // Table columns
  const columns = [
    {
      title: 'Order',
      key: 'order',
      width: 80,
      render: (_, record, index) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMove(index, 'up')}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === terms.length - 1}
            onClick={() => handleMove(index, 'down')}
          />
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'termType',
      key: 'termType',
      width: 120,
      render: (termType) => (
        <Tag color={getTermTypeColor(termType)}>
          {termType}
        </Tag>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title) => title || '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record, index) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this term?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Terms & Conditions
            </Title>
            <Typography.Text type="secondary">
              Legal & payment clarity for quotation #{quotationId}
            </Typography.Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Term
            </Button>
          </Col>
        </Row>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={terms}
          loading={loading}
          pagination={false}
          size="middle"
          locale={{
            emptyText: 'No terms added yet. Click "Add Term" to get started.'
          }}
        />

        {terms.length > 0 && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Typography.Text type="secondary">
              Use the arrow buttons to reorder terms
            </Typography.Text>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingTerm ? 'Edit Term' : 'Add New Term'}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            termType: 'General'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="termType"
                label="Term Type"
                rules={[{ required: true, message: 'Please select term type' }]}
              >
                <Select placeholder="Select term type">
                  {TERM_TYPES.map(type => (
                    <Select.Option key={type.value} value={type.value}>
                      <Tag color={type.color} style={{ marginRight: 8 }}>
                        {type.label}
                      </Tag>
                    </Select.Option>
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

          <Form.Item
            name="sortOrder"
            label="Sort Order"
          >
            <Input
              type="number"
              placeholder="Leave empty for auto-ordering"
              min={1}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleModalClose}>
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

export default QuotationTermsPageSimple;