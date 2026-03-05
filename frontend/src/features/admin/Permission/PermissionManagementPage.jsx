import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Modal,
  Space,
  message,
  Card,
  Row,
  Col,
  Grid,
  Tag,
  Popconfirm,
  Switch,
  Select,
  Tabs,
  Checkbox,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
  SecurityScanOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { permissionApi, rolePermissionApi } from "../../../api/admin/permissionApi";

const { useBreakpoint } = Grid;
const { Option } = Select;

function PermissionManagementPage() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolePermissionsSummary, setRolePermissionsSummary] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [permissionForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('permissions');
  const screens = useBreakpoint();

  useEffect(() => {
    loadPermissions();
    loadRoles();
    loadRolePermissionsSummary();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionApi.getPermissions();
      if (response.success) {
        setPermissions(response.data || []);
      } else {
        message.error(response.message || 'Failed to load permissions');
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      message.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await rolePermissionApi.getRoles();
      if (response.success) {
        setRoles(response.data || []);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadRolePermissionsSummary = async () => {
    try {
      const response = await rolePermissionApi.getRolePermissionsSummary();
      if (response.success) {
        setRolePermissionsSummary(response.data || []);
      }
    } catch (error) {
      console.error('Error loading role permissions summary:', error);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      setLoading(true);
      const response = await rolePermissionApi.getPermissionsForRole(roleId);
      if (response.success) {
        setSelectedRole(response.data.role);
        setRolePermissions(response.data.permissions || []);
      } else {
        message.error(response.message || 'Failed to load role permissions');
      }
    } catch (error) {
      console.error('Error loading role permissions:', error);
      message.error('Failed to load role permissions');
    } finally {
      setLoading(false);
    }
  };

  const openPermissionModal = (permission = null) => {
    setEditingPermission(permission);
    permissionForm.resetFields();
    if (permission) {
      permissionForm.setFieldsValue(permission);
    }
    setPermissionModalOpen(true);
  };

  const closePermissionModal = () => {
    setPermissionModalOpen(false);
    setEditingPermission(null);
    permissionForm.resetFields();
  };

  const handlePermissionSubmit = async () => {
    try {
      const values = await permissionForm.validateFields();

      if (editingPermission) {
        const response = await permissionApi.updatePermission(editingPermission.id, values);
        if (response.success) {
          message.success('Permission updated successfully');
          closePermissionModal();
          loadPermissions();
        } else {
          message.error(response.message || 'Failed to update permission');
        }
      } else {
        const response = await permissionApi.createPermission(values);
        if (response.success) {
          message.success('Permission created successfully');
          closePermissionModal();
          loadPermissions();
        } else {
          message.error(response.message || 'Failed to create permission');
        }
      }
    } catch (error) {
      console.error('Error saving permission:', error);
      message.error('Failed to save permission');
    }
  };

  const handleTogglePermissionStatus = async (permission) => {
    try {
      const response = await permissionApi.togglePermissionStatus(permission.id);
      if (response.success) {
        message.success(response.message);
        loadPermissions();
      } else {
        message.error(response.message || 'Failed to toggle permission status');
      }
    } catch (error) {
      console.error('Error toggling permission status:', error);
      message.error('Failed to toggle permission status');
    }
  };

  const handleDeletePermission = async (permission) => {
    try {
      const response = await permissionApi.deletePermission(permission.id);
      if (response.success) {
        message.success('Permission deleted successfully');
        loadPermissions();
      } else {
        message.error(response.message || 'Failed to delete permission');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      message.error('Failed to delete permission');
    }
  };

  const handleRolePermissionChange = (permissionId, checked) => {
    setRolePermissions(prev =>
      prev.map(permission =>
        permission.id === permissionId
          ? { ...permission, isAssigned: checked }
          : permission
      )
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      const assignedPermissionIds = rolePermissions
        .filter(p => p.isAssigned)
        .map(p => p.id);

      const response = await rolePermissionApi.updateRolePermissions(
        selectedRole.id,
        assignedPermissionIds
      );

      if (response.success) {
        message.success('Role permissions updated successfully');
        loadRolePermissionsSummary();
      } else {
        message.error(response.message || 'Failed to update role permissions');
      }
    } catch (error) {
      console.error('Error saving role permissions:', error);
      message.error('Failed to save role permissions');
    }
  };

  const permissionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      sorter: (a, b) => a.module.localeCompare(b.module),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      responsive: ['md'],
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => (
        <Tag color="blue">{code}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openPermissionModal(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<PoweroffOutlined />}
            type={record.isActive ? 'default' : 'primary'}
            onClick={() => handleTogglePermissionStatus(record)}
          >
            {record.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Popconfirm
            title="Delete Permission"
            description="Are you sure you want to delete this permission? This action cannot be undone."
            onConfirm={() => handleDeletePermission(record)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Group permissions by module for role assignment
  const groupedPermissions = rolePermissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {});

  // Tab items for new Tabs API
  const tabItems = [
    {
      key: 'permissions',
      label: (
        <span>
          <SecurityScanOutlined />
          Permissions
        </span>
      ),
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openPermissionModal()}
            >
              Create Permission
            </Button>
          </div>

          <Table
            rowKey="id"
            columns={permissionColumns}
            dataSource={[...permissions].sort((a, b) => a.id - b.id)} // force ascending
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} permissions`,
            }}
          />

        </>
      )
    },
    {
      key: 'role-permissions',
      label: (
        <span>
          <TeamOutlined />
          Role Permissions
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="Select Role" size="small">
              <Select
                style={{ width: '100%' }}
                placeholder="Select a role"
                onChange={loadRolePermissions}
                value={selectedRole?.id}
              >
                {roles.map(role => (
                  <Option key={role.id} value={role.id}>
                    {role.name} (Level {role.level})
                  </Option>
                ))}
              </Select>

              <Divider />

              <div>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={16}>
            {selectedRole && (
              <Card
                title={`Permissions for ${selectedRole.name}`}
                size="small"
                extra={
                  <Button
                    type="primary"
                    onClick={handleSaveRolePermissions}
                    loading={loading}
                  >
                    Save Changes
                  </Button>
                }
              >
                {Object.keys(groupedPermissions).map(module => (
                  <div key={module} style={{ marginBottom: 16 }}>
                    <h4 style={{ color: '#1890ff', marginBottom: 8 }}>
                      {module}
                    </h4>
                    <Row gutter={[8, 8]}>
                      {groupedPermissions[module].map(permission => (
                        <Col xs={24} sm={12} md={8} key={permission.id}>
                          <Checkbox
                            checked={permission.isAssigned}
                            onChange={(e) => handleRolePermissionChange(
                              permission.id,
                              e.target.checked
                            )}
                          >
                            <span style={{ fontSize: '12px' }}>
                              {permission.action}
                              <br />
                              <Tag size="small" color="blue">
                                {permission.code}
                              </Tag>
                            </span>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                    <Divider />
                  </div>
                ))}
              </Card>
            )}
          </Col>
        </Row>
      )
    }
  ];

  return (
    <Card title="Permission Management">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* Permission Modal */}
      <Modal
        title={editingPermission ? 'Edit Permission' : 'Create Permission'}
        open={permissionModalOpen}
        onCancel={closePermissionModal}
        onOk={handlePermissionSubmit}
        width={screens.xs ? '100%' : 600}
        style={screens.xs ? { top: 0, padding: 0 } : { top: 20 }}
      >
        <Form layout="vertical" form={permissionForm}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Module"
                name="module"
                rules={[
                  { required: true, message: 'Please enter module name' },
                  { min: 2, message: 'Module name must be at least 2 characters' }
                ]}
              >
                <Input placeholder="e.g., User, Project, Fleet" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Action"
                name="action"
                rules={[
                  { required: true, message: 'Please enter action name' },
                  { min: 2, message: 'Action name must be at least 2 characters' }
                ]}
              >
                <Input placeholder="e.g., View, Create, Edit, Delete" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Permission Code"
                name="code"
                rules={[
                  { required: true, message: 'Please enter permission code' },
                  {
                    pattern: /^[A-Z_]+$/,
                    message: 'Code must contain only uppercase letters and underscores'
                  }
                ]}
              >
                <Input
                  placeholder="e.g., USER_VIEW, PROJECT_CREATE"
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>

            {editingPermission && (
              <Col xs={24}>
                <Form.Item
                  label="Active Status"
                  name="isActive"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}

export default PermissionManagementPage;