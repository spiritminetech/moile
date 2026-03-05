import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  message,
  Card,
  Row,
  Col,
  Grid,
} from "antd";

import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../api/client/clientApi";

const { useBreakpoint } = Grid;

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await getClients();
      setClients(res.data || []);
    } catch {
      message.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const getNextClientId = () => {
    if (!clients.length) return 1;
    return Math.max(...clients.map((c) => Number(c.id) || 0)) + 1;
  };

  const openModal = (record = null) => {
    setEditing(record);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();

      if (editing) {
        await updateClient(editing.id, values);
        message.success("Client updated");
      } else {
        await createClient({
          ...values,
          id: getNextClientId(),
        });
        message.success("Client created");
      }

      closeModal();
      loadClients();
    } catch (err) {
      message.error(err?.response?.data?.message || "Save failed");
    }
  };

  const remove = async (id) => {
    try {
      await deleteClient(id);
      message.success("Client deleted");
      loadClients();
    } catch {
      message.error("Delete failed");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "Name", dataIndex: "name" },
    { title: "Trade", dataIndex: "trade", responsive: ["md"] },
    { title: "Contact", dataIndex: "contactName", responsive: ["md"] },
    { title: "Phone", dataIndex: "contactPhone" },
    { title: "Email", dataIndex: "email", responsive: ["lg"] },
    {
      title: "Action",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => openModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this client?"
            onConfirm={() => remove(record.id)}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Clients"
      extra={
        <Button type="primary" onClick={() => openModal()}>
          Add Client
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={clients}
        loading={loading}
        scroll={{ x: "max-content" }}
      />

      <Modal
        open={open}
        title={editing ? "Edit Client" : "Add Client"}
        onCancel={closeModal}
        onOk={submit}
        destroyOnClose
        width={screens.xs ? "100%" : 720}
        style={screens.xs ? { top: 0, padding: 0 } : { top: 20 }}
        bodyStyle={{ padding: screens.xs ? 16 : 24 }}
        centered={screens.xs ? false : true}
      >
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Client Name"
                name="name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Registration No" name="registrationNo">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Trade" name="trade">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Contact Name" name="contactName">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Contact Phone" name="contactPhone">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Email" name="email">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Address" name="address">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Bank Name" name="bankName">
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Bank Account" name="bankAccount">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}
