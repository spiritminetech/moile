import React, { useEffect, useState } from "react";
import { Select, Table, Button, Spin, Modal, Tag, message } from "antd";
import dayjs from "dayjs";

import {
  fetchCompanies,
  fetchProjects,
  fetchPayrollPreview,
  fetchAttendanceBreakdown,
} from "../../api/payroll/payrollApi";

const { Option } = Select;

const PayrollPreview = () => {
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    companyId: null,
    projectId: null,
    month: dayjs().format("YYYY-MM"), // ✅ API format
  });

  const [payrollData, setPayrollData] = useState([]);

  const [attendanceModal, setAttendanceModal] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [salaryModal, setSalaryModal] = useState(null);

  /* ---------------- LOAD MASTER DATA ---------------- */
useEffect(() => {
  const loadCompanies = async () => {
    try {
      const res = await fetchCompanies();

      // API returns { data: { data: [] } }
      setCompanies(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      message.error("Failed to load companies");
      setCompanies([]);
    }
  };

  loadCompanies();
}, []);


useEffect(() => {
  if (!filters.companyId) {
    setProjects([]);
    return;
  }

  const loadProjects = async () => {
    try {
      const res = await fetchProjects(filters.companyId);

      // Use res.data directly since API returns array
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error("Failed to load projects");
      setProjects([]);
    }
  };

  loadProjects();
}, [filters.companyId]);



  /* ---------------- FETCH PAYROLL ---------------- */
  const generatePreview = async () => {
    if (!filters.companyId) {
      message.warning("Select company first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchPayrollPreview(
        filters.companyId,
        filters.projectId,
        filters.month
      );

      setPayrollData(res.data.payrolls || []);
    } catch {
      message.error("Failed to generate payroll preview");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- ATTENDANCE DRILLDOWN ---------------- */
const openAttendance = async (emp) => {
  try {
    const res = await fetchAttendanceBreakdown(emp.employeeId, filters.month);

    const mapped = res.data.records.map((r) => ({
      date: dayjs(r.date).format("YYYY-MM-DD"),  // format date nicely
      in: r.checkIn ? dayjs(r.checkIn).format("HH:mm") : "",
      out: r.checkOut ? dayjs(r.checkOut).format("HH:mm") : "",
      hours: r.hours,
      ot: r.ot,
      project: r.project || "-",  // if project code is missing
      geo: r.geoValid,
    }));

    setAttendanceData(mapped);
    setAttendanceModal(emp);
  } catch {
    message.error("Failed to load attendance breakdown");
  }
};



  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    { title: "Emp Code", dataIndex: "employeeCode" },
    { title: "Employee Name", dataIndex: "employeeName" },
    {
      title: "Days",
      dataIndex: "daysWorked",
      render: (v, r) => (
        <Button type="link" onClick={() => openAttendance(r)}>
          {v}
        </Button>
      ),
    },
    {
      title: "OT Hrs",
      dataIndex: "otHours",
      render: (v, r) => (
        <Button type="link" onClick={() => openAttendance(r)}>
          {v}
        </Button>
      ),
    },
    { title: "Basic Pay", dataIndex: "basicPay" },
    { title: "OT Pay", dataIndex: "otPay" },
    { title: "Allow", dataIndex: "allowances" },
    { title: "Deduct", dataIndex: "deductions" },
    {
      title: "Net Pay",
      dataIndex: "netPay",
      render: (v, r) => (
        <Button type="link" onClick={() => setSalaryModal(r)}>
          {v}
        </Button>
      ),
    },
  ];

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">BASIC PAYROLL PREVIEW</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <Select
          placeholder="Company"
          style={{ width: 200 }}
          onChange={(v) =>
            setFilters({ companyId: v, projectId: null, month: filters.month })
          }
        >
          {companies.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.name}
            </Option>
          ))}
        </Select>

       <Select
  placeholder="Project"
  style={{ width: 200 }}
  allowClear
  onChange={(v) => setFilters({ ...filters, projectId: v || null })}
>
  {projects.map((p) => (
    <Option key={p.id} value={p.id}>
      {p.projectName}
    </Option>
  ))}
</Select>



        <Select
          value={filters.month}
          onChange={(v) => setFilters({ ...filters, month: v })}
          style={{ width: 140 }}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const m = dayjs().month(i).format("YYYY-MM");
            return (
              <Option key={m} value={m}>
                {dayjs(m).format("MMM YYYY")}
              </Option>
            );
          })}
        </Select>

        <Button type="primary" onClick={generatePreview}>
          Generate Preview
        </Button>
      </div>

      {/* Status */}
      <div className="mb-4">
        <Tag color="green">Attendance OK</Tag>
        <Tag color="green">Geo Verified</Tag>
        <Tag color="green">OT Calculated</Tag>
        <Tag color="green">Preview Ready</Tag>
      </div>

      {/* Table */}
      {loading ? (
        <Spin />
      ) : (
        <Table
          dataSource={payrollData}
          columns={columns}
          rowKey="employeeId"
          bordered
          pagination={false}
        />
      )}

      {/* ATTENDANCE MODAL */}
      <Modal
        open={!!attendanceModal}
        onCancel={() => setAttendanceModal(null)}
        footer={null}
        width={800}
        title={`Attendance – ${attendanceModal?.employeeName}`}
      >
        <Table
          dataSource={attendanceData}
          pagination={false}
          rowKey="date"
          columns={[
            { title: "Date", dataIndex: "date" },
            { title: "In", dataIndex: "in" },
            { title: "Out", dataIndex: "out" },
            { title: "Hours", dataIndex: "hours" },
            { title: "OT", dataIndex: "ot" },
            { title: "Project", dataIndex: "project" },
            {
              title: "Geo",
              dataIndex: "geo",
              render: (v) => (v ? "✔" : "❌"),
            },
          ]}
        />
      </Modal>

      {/* SALARY MODAL */}
      <Modal
        open={!!salaryModal}
        onCancel={() => setSalaryModal(null)}
        footer={null}
        title="SALARY PREVIEW"
      >
        {salaryModal && (
          <pre className="text-sm">
{JSON.stringify(salaryModal, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
};

export default PayrollPreview;
