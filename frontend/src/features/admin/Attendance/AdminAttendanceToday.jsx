import React, { useEffect, useState } from "react";
import { Card, Table, Spin, Alert, Tag, DatePicker, Select } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

const AdminAttendanceToday = () => {
  const [attendance, setAttendance] = useState([]); // all data from API
  const [filteredAttendance, setFilteredAttendance] = useState([]); // data after site filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(dayjs());
  const [site, setSite] = useState(null);

  const API_URL = process.env.REACT_APP_URL || "http://localhost:5000/api";

  // Fetch attendance from API
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_URL}/admin/attendance/today`, {
        params: {
          date: date.format("YYYY-MM-DD")
        }
      });

      setAttendance(res.data.attendance || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when date changes
  useEffect(() => {
    fetchAttendance();
  }, [date]);

  // Apply site filter whenever attendance or site changes
  useEffect(() => {
    if (site) {
      setFilteredAttendance(attendance.filter(a => a.site === site));
    } else {
      setFilteredAttendance(attendance);
    }
  }, [attendance, site]);

  const columns = [
    {
      title: "Worker",
      dataIndex: "workerName",
      key: "workerName",
      render: text => <strong>{text}</strong>
    },
    {
      title: "Site",
      dataIndex: "site",
      key: "site"
    },
    {
      title: "Login",
      dataIndex: "loginTime",
      key: "loginTime",
      align: "center",
      render: v => v || "--"
    },
    {
      title: "Logout",
      dataIndex: "logoutTime",
      key: "logoutTime",
      align: "center",
      render: v => v || "--"
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: status => {
        if (status.includes("Outside")) {
          return <Tag color="red">⚠ Outside Fence</Tag>;
        }
        if (status.includes("Late")) {
          return <Tag color="orange">Late ⚠</Tag>;
        }
        return <Tag color="green">Present</Tag>;
      }
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} className="m-4" />;
  }

  // Get unique sites for the select dropdown
  const uniqueSites = [...new Set(attendance.map(a => a.site))];

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <Card className="shadow-sm">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-start md:items-center">
          <DatePicker
            value={date}
            onChange={setDate}
            allowClear={false}
          />
          <Select
            placeholder="All Sites"
            allowClear
            style={{ minWidth: 200 }}
            onChange={setSite}
            value={site}
          >
            {uniqueSites.map(siteName => (
              <Option key={siteName} value={siteName}>
                {siteName}
              </Option>
            ))}
          </Select>
        </div>

        {/* Attendance Table */}
        <Table
          dataSource={filteredAttendance}
          columns={columns}
          rowKey="workerId"
          bordered
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />

        {/* Legend */}
        <div className="text-xs text-gray-500 mt-3 space-y-1">
          <div>⚠ Indicates late login or geo-fence violation</div>
        </div>
      </Card>
    </div>
  );
};

export default AdminAttendanceToday;
