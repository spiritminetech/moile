import { useEffect, useState } from "react";
import {
  Card,
  Select,
  Tag,
  Space,
  Button,
  Checkbox,
  Table,
  message,
} from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  RollbackOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { rolePermissionApi } from "../../../api/admin/permissionApi";

const { Option } = Select;

export default function RolePermissionMappingPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await rolePermissionApi.getRoles();
      if (response.success) setRoles(response.data || []);
    } catch (error) {
      console.error(error);
      message.error("Failed to load roles");
    }
  };

  const loadRolePermissions = async (roleId) => {
    if (!roleId) return;
    try {
      setLoading(true);
      const response = await rolePermissionApi.getPermissionsForRole(roleId);
      if (response.success) {
        setSelectedRole(response.data.role);
        const permissionsWithState = response.data.permissions.map((p) => ({
          ...p,
          wasAssigned: p.isAssigned,
        }));
        setRolePermissions(permissionsWithState || []);
      } else message.error(response.message || "Failed to load role permissions");
    } catch (error) {
      console.error(error);
      message.error("Failed to load role permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleRolePermissionChange = (permissionId, checked) => {
    setRolePermissions((prev) =>
      prev.map((p) => (p.id === permissionId ? { ...p, isAssigned: checked } : p))
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      setLoading(true);
      const assignedIds = rolePermissions.filter((p) => p.isAssigned).map((p) => p.id);
      const response = await rolePermissionApi.updateRolePermissions(selectedRole.id, assignedIds);
      if (response.success) {
        message.success("Role permissions updated successfully");
        loadRolePermissions(selectedRole.id);
      } else message.error(response.message || "Failed to update role permissions");
    } catch (error) {
      console.error(error);
      message.error("Failed to save role permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSelected = async () => {
    if (!selectedRole) return;
    const selected = rolePermissions.filter((p) => p.isAssigned && !p.wasAssigned).map((p) => p.id);
    if (!selected.length) return message.warning("No new permissions selected to assign");

    try {
      setLoading(true);
      const response = await rolePermissionApi.assignPermissionsToRole(selectedRole.id, selected);
      if (response.success) {
        message.success(`${selected.length} permissions assigned successfully`);
        setRolePermissions((prev) =>
          prev.map((p) => (selected.includes(p.id) ? { ...p, wasAssigned: true } : p))
        );
      } else message.error(response.message || "Failed to assign permissions");
    } catch (error) {
      console.error(error);
      message.error("Failed to assign permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSelected = async () => {
    if (!selectedRole) return;
    const revoked = rolePermissions.filter((p) => !p.isAssigned && p.wasAssigned).map((p) => p.id);
    if (!revoked.length) return message.warning("No permissions selected to revoke");

    try {
      setLoading(true);
      const response = await rolePermissionApi.revokePermissionsFromRole(selectedRole.id, revoked);
      if (response.success) {
        message.success(`${revoked.length} permissions revoked successfully`);
        setRolePermissions((prev) =>
          prev.map((p) => (revoked.includes(p.id) ? { ...p, wasAssigned: false } : p))
        );
      } else message.error(response.message || "Failed to revoke permissions");
    } catch (error) {
      console.error(error);
      message.error("Failed to revoke permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRolePermissions((prev) => prev.map((p) => ({ ...p, isAssigned: p.wasAssigned })));
  };

  const columns = [
    { title: "Module", dataIndex: "module", key: "module", sorter: (a, b) => a.module.localeCompare(b.module) },
    { title: "Permission Code", dataIndex: "code", key: "code", render: (code) => <Tag color="blue">{code}</Tag> },
    { title: "Action", dataIndex: "action", key: "action" },
    {
      title: "Assigned?",
      key: "assigned",
      align: "center",
      render: (_, record) => (
        <Checkbox checked={record.isAssigned} onChange={(e) => handleRolePermissionChange(record.id, e.target.checked)} />
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title={
          <div className="flex items-center space-x-2">
            <TeamOutlined />
            <span>Role Permission Mapping</span>
          </div>
        }
        className="shadow-md rounded-md"
      >
        <div className="mb-4">
          <Select
            className="w-full md:w-1/3"
            placeholder="Select a role"
            onChange={loadRolePermissions}
            value={selectedRole?.id}
            size="large"
          >
            {roles.map((role) => (
              <Option key={role.id} value={role.id}>
                {role.name}
              </Option>
            ))}
          </Select>
        </div>

        {selectedRole && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <Space wrap>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRolePermissions} loading={loading}>
                  Save Changes
                </Button>
                {/* <Button icon={<PlusOutlined />} onClick={handleAssignSelected} loading={loading}>
                  Assign Selected
                </Button> */}
                {/* <Button icon={<DeleteOutlined />} onClick={handleRevokeSelected} loading={loading}>
                  Revoke Selected
                </Button> */}
                {/* <Button icon={<RollbackOutlined />} onClick={handleReset}>
                  Reset
                </Button> */}
              </Space>
            </div>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={rolePermissions}
              loading={loading}
              scroll={{ x: "max-content" }}
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} permissions`,
              }}
              size="middle"
              bordered
              rowClassName={(record) => (record.isAssigned ? "bg-green-50" : "bg-red-50")}
            />
          </>
        )}
      </Card>
    </div>
  );
}
