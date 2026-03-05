import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  message,
  Card,
  Row,
  Col,
  Grid,
  Switch,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getRoles, createRole, updateRole, deleteRole } from "../../../api/admin/roleApi";

const { useBreakpoint } = Grid;

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await getRoles();
      setRoles(
        (res.data || []).map((r) => ({
          ...r,
          isSystemRole: Boolean(r.isSystemRole),
        }))
      );
    } catch {
      message.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const getNextRoleId = () => {
    if (!roles.length) return 1;
    return Math.max(...roles.map((r) => Number(r.id))) + 1;
  };

  const openModal = (record = null) => {
    setEditing(record);
    form.resetFields();

    if (record) {
      form.setFieldsValue({
        ...record,
        isSystemRole: Boolean(record.isSystemRole),
      });
    } else {
      form.setFieldsValue({ isSystemRole: false });
    }

    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const submit = async (values) => {
    try {
      const payload = {
        ...values,
        isSystemRole: values.isSystemRole ? 1 : 0,
      };

      if (editing) {
        await updateRole(editing.id, payload);
        message.success("Role updated successfully");
      } else {
        await createRole({ ...payload, id: getNextRoleId() });
        message.success("Role created successfully");
      }

      closeModal();
      loadRoles();
    } catch {
      message.error("Save failed");
    }
  };

  const remove = async (id) => {
    try {
      await deleteRole(id);
      message.success("Role deleted successfully");
      loadRoles();
    } catch {
      message.error("Delete failed");
    }
  };

  const columns = [
    { 
      title: "ID", 
      dataIndex: "id", 
      width: 80,
      fixed: screens.xs ? false : 'left',
      sorter: (a, b) => a.id - b.id,
    },
    { 
      title: "Role Name", 
      dataIndex: "name",
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    { 
      title: "Level", 
      dataIndex: "level", 
      width: 100,
      sorter: (a, b) => a.level - b.level,
    },
    {
      title: "System Role",
      dataIndex: "isSystemRole",
      width: 120,
      render: (v) => (
        <Tag color={v ? "blue" : "default"}>{v ? "Yes" : "No"}</Tag>
      ),
      filters: [
        { text: 'System Role', value: true },
        { text: 'Custom Role', value: false },
      ],
      onFilter: (value, record) => record.isSystemRole === value,
    },
    {
      title: "Action",
      width: 150,
      fixed: screens.xs ? false : 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
          >
            {screens.xs ? '' : 'Edit'}
          </Button>
          <Popconfirm 
            title="Delete this role?" 
            description="This action cannot be undone."
            onConfirm={() => remove(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              {screens.xs ? '' : 'Delete'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Role Management</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
            >
              {screens.xs ? 'Add' : 'Add Role'}
            </Button>
          </div>
        }
        className="flex-1 flex flex-col"
        bodyStyle={{ 
          padding: screens.xs ? '12px' : '24px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={roles}
          loading={loading}
          scroll={{ 
            x: 'max-content'
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: !screens.xs,
            showQuickJumper: !screens.xs,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} roles`,
            size: screens.xs ? 'small' : 'default',
          }}
          size={screens.xs ? 'small' : 'middle'}
          className="flex-1"
        />
      </Card>

      <Modal
        open={open}
        title={
          <div className="flex items-center space-x-2">
            <span>{editing ? "Edit Role" : "Add Role"}</span>
          </div>
        }
        onCancel={closeModal}
        footer={null}
        width={screens.xs ? "95%" : 600}
        centered
        destroyOnClose
      >
        <Form 
          layout="vertical" 
          form={form} 
          onFinish={submit}
          preserve={false}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={24}>
              <Form.Item
                label="Role Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter role name' },
                  { min: 2, message: 'Role name must be at least 2 characters' },
                  { max: 50, message: 'Role name cannot exceed 50 characters' }
                ]}
              >
                <Input placeholder="Enter role name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Level"
                name="level"
                rules={[
                  { required: true, message: 'Please enter level' },
                  { type: "number", min: 1, max: 100, message: 'Level must be between 1-100' }
                ]}
              >
                <InputNumber 
                  style={{ width: "100%" }} 
                  placeholder="Enter level"
                  min={1}
                  max={100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="System Role"
                name="isSystemRole"
                valuePropName="checked"
                tooltip="System roles are built-in and have special privileges"
              >
                <Switch 
                  checkedChildren="Yes" 
                  unCheckedChildren="No"
                  className="bg-gray-300"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 mt-6">
            <div className="flex justify-end space-x-2">
              <Button onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
              >
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
