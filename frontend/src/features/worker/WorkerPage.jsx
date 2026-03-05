import React, { useEffect, useState } from "react";
import { Table, Modal, Spin, Alert, Typography } from "antd";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const { Paragraph, Title, Link } = Typography;

const WorkerPage = () => {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const BASE_URL = process.env.REACT_APP_URL || "http://localhost:5000/api";
  const API_URL = `${BASE_URL}/worker-view`;

  const [workers, setWorkers] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [error, setError] = useState(null);

  /* ================= FETCH WORKER LIST ================= */
  const fetchWorkers = async () => {
    if (!companyId) return;

    try {
      setListLoading(true);
      setError(null);

      const res = await axios.get(API_URL, {
        params: { companyId },
      });

      setWorkers(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load workers");
    } finally {
      setListLoading(false);
    }
  };

  /* ================= FETCH WORKER PROFILE ================= */
  const fetchProfile = async (employeeId) => {
    if (!employeeId || !companyId) return;

    try {
      setProfileLoading(true);
      setError(null);

      const res = await axios.get(`${API_URL}/${employeeId}`, {
        params: { companyId },
      });

      setSelectedWorker(res.data.data);
      setModalVisible(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load worker profile");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [companyId]);

  /* ================= TABLE CONFIG ================= */
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => (
        <Link onClick={() => fetchProfile(record.employeeId)}>
          {text}
        </Link>
      ),
    },
    { title: "Trade", dataIndex: "trade" },
    { title: "Status", dataIndex: "status" },
    {
      title: "Work Pass",
      dataIndex: "workPass",
      render: (workPass) => workPass?.status || "N/A",
    },
  ];

  if (listLoading) {
    return <Spin size="large" style={{ margin: 50 }} />;
  }

  if (error) {
    return <Alert type="error" message={error} style={{ margin: 20 }} />;
  }

  return (
    <>
      <Table
        columns={columns}
        dataSource={workers}
        rowKey="employeeId"
        pagination={{ pageSize: 10 }}
        bordered
      />

      <Modal
        open={modalVisible}
        footer={null}
        title={null}   // heading moved INSIDE content
        onCancel={() => {
          setModalVisible(false);
          setSelectedWorker(null);
        }}
      >
        {profileLoading ? (
          <Spin />
        ) : (
          selectedWorker && (
            <>
              <Title level={4} style={{ marginBottom: 16 }}>
                Worker Profile
              </Title>

              <Paragraph><b>Name:</b> {selectedWorker.name}</Paragraph>
              <Paragraph><b>Trade:</b> {selectedWorker.trade}</Paragraph>

              <Paragraph>
                <b>Work Pass Expiry:</b>{" "}
                {selectedWorker.workPassExpiry
                  ? new Date(
                      selectedWorker.workPassExpiry
                    ).toLocaleDateString("en-GB")
                  : "N/A"}
              </Paragraph>

              <Paragraph><b>Status:</b> {selectedWorker.status}</Paragraph>

              <Paragraph>
                <b>Assigned Project:</b>{" "}
                {selectedWorker.assignedProjects?.length
                  ? selectedWorker.assignedProjects
                      .map((p) => p.projectName)
                      .join(", ")
                  : "N/A"}
              </Paragraph>
            </>
          )
        )}
      </Modal>
    </>
  );
};

export default WorkerPage;
