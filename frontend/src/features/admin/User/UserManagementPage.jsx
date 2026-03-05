import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Modal,
  Space,
  message,
  Tag,
  Popconfirm,
  Radio,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { userManagementApi } from "../../../api/user/userManagementApi.js";

const { Option } = Select;

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const currentUserRole = "Admin"; // Replace with real auth logic

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadCompanies();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userManagementApi.getUsers();
      if (response.success) setUsers(response.data || []);
      else message.error(response.message || "Failed to load users");
    } catch (error) {
      console.error(error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await userManagementApi.getRoles(currentUserRole);
      if (response.success) setRoles(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await userManagementApi.getCompanies();
      if (response.success) setCompanies(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const openCreateModal = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    createForm.resetFields();
  };

  const openEditModal = async (user) => {
    try {
      const response = await userManagementApi.getUserForEdit(user.id);
      if (response.success) {
        setEditingUser(response.data);
        editForm.setFieldsValue({
          email: response.data.email,
          roleId: response.data.roleId,
          isActive: response.data.isActive,
        });
        setEditModalOpen(true);
      } else message.error("Failed to load user details");
    } catch (error) {
      console.error(error);
      message.error("Failed to load user details");
    }
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    editForm.resetFields();
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const selectedRole = roles.find((r) => r.id === values.roleId);
      const selectedCompany = companies.find((c) => c.id === values.companyId);

      setPendingUserData({
        ...values,
        roleName: selectedRole?.name,
        companyName: selectedCompany?.name,
      });

      setConfirmModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmCreateUser = async () => {
    try {
      const response = await userManagementApi.createUser(pendingUserData);
      if (response.success) {
        message.success(
          "User created successfully! Login email has been sent."
        );
        setConfirmModalOpen(false);
        closeCreateModal();
        loadUsers();
      } else message.error(response.message || "Failed to create user");
    } catch (error) {
      console.error(error);
      message.error("Failed to create user");
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const response = await userManagementApi.updateUser(editingUser.id, values);
      if (response.success) {
        message.success("User updated successfully");
        closeEditModal();
        loadUsers();
      } else message.error(response.message || "Failed to update user");
    } catch (error) {
      console.error(error);
      message.error("Failed to update user");
    }
  };

  const handleDisableUser = async (user) => {
    try {
      const response = await userManagementApi.disableUser(user.id);
      if (response.success) {
        message.success("User disabled successfully");
        loadUsers();
      } else message.error(response.message || "Failed to disable user");
    } catch (error) {
      console.error(error);
      message.error("Failed to disable user");
    }
  };

  const handleEnableUser = async (user) => {
    try {
      const response = await userManagementApi.enableUser(user.id);
      if (response.success) {
        message.success("User enabled successfully");
        loadUsers();
      } else message.error(response.message || "Failed to enable user");
    } catch (error) {
      console.error(error);
      message.error("Failed to enable user");
    }
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      responsive: ["md"],
      render: (roleName) => <Tag color="blue">{roleName}</Tag>,
    },
    {
      title: "Company",
      dataIndex: "companyName",
      key: "companyName",
      responsive: ["lg"],
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Disabled"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 220,
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          {record.isActive ? (
            <Popconfirm
              title="Disable User"
              description={
                <div className="text-sm">
                  <p>Are you sure you want to disable this user?</p>
                  <p>User will:</p>
                  <p>❌ Not be able to login</p>
                  <p>❌ Not receive task notifications</p>
                  <p>
                    <strong>Email:</strong> {record.email}
                  </p>
                </div>
              }
              onConfirm={() => handleDisableUser(record)}
              okText="Disable User"
              cancelText="Cancel"
            >
              <Button size="small" danger icon={<StopOutlined />}>
                Disable
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Enable User"
              description="This user will regain system access"
              onConfirm={() => handleEnableUser(record)}
              okText="Enable User"
              cancelText="Cancel"
            >
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                Enable
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">User Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Create User
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} users` }}
        className="shadow-lg rounded-lg overflow-hidden"
      />

      {/* Create User Modal */}
      <Modal
        title="Create User"
        open={createModalOpen}
        onCancel={closeCreateModal}
        onOk={handleCreateSubmit}
        width={600}
        className="rounded-lg"
      >
        <Form layout="vertical" form={createForm}>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter email address" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
            extra="This will be the login username"
          >
            <Input placeholder="user@company.com" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="roleId"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select Role">
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Company"
            name="companyId"
            rules={[{ required: true, message: "Please select a company" }]}
          >
            <Select placeholder="Select Company">
              {companies.map((company) => (
                <Option key={company.id} value={company.id}>
                  {company.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="bg-gray-100 p-3 rounded-md mt-4 text-sm text-gray-600">
            • Temporary password will be auto-generated<br />
            • Invitation email will be sent to user
          </div>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={editModalOpen}
        onCancel={closeEditModal}
        onOk={handleEditSubmit}
        width={600}
        className="rounded-lg"
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item label="Email Address">
            <Input
              value={editingUser?.email}
              disabled
              className="text-gray-600"
            />
            <div className="text-xs text-gray-500 mt-1">Email cannot be changed</div>
          </Form.Item>

          <Form.Item
            label="Role"
            name="roleId"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select Role">
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Company">
            <Input
              value={editingUser?.companyName}
              disabled
              className="text-gray-600"
            />
            <div className="text-xs text-gray-500 mt-1">
              Company cannot be changed in Phase 1
            </div>
          </Form.Item>

          <Form.Item
            label="Account Status"
            name="isActive"
            rules={[{ required: true, message: "Please select account status" }]}
          >
            <Radio.Group>
              <Radio value={true}>Active</Radio>
              <Radio value={false}>Disabled</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm User Creation"
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={confirmCreateUser}
        okText="Confirm"
        cancelText="Cancel"
        width={600}
        className="rounded-lg"
      >
        <Row gutter={[16, 8]}>
          <Col span={6}>
            <strong>Email:</strong>
          </Col>
          <Col span={18}>{pendingUserData?.email}</Col>

          <Col span={6}>
            <strong>Role:</strong>
          </Col>
          <Col span={18}>{pendingUserData?.roleName}</Col>

          <Col span={6}>
            <strong>Company:</strong>
          </Col>
          <Col span={18}>{pendingUserData?.companyName}</Col>
        </Row>

        <div className="bg-blue-50 p-3 rounded-md mt-4 border border-blue-200 text-sm">
          A temporary password will be generated and sent to the user's email address.
        </div>
      </Modal>
    </div>
  );
}

export default UserManagementPage;
