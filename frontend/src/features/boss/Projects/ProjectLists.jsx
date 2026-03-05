import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Progress, Spin, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { fetchProjectList } from '../../../api/boss/bossProjectApi';

const statusColorMap = {
  ON_TRACK: 'green',
  DELAYED: 'red',
  COMPLETED: 'blue'
};

const ProjectLists = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);

  const companyId = 1; // ⚠️ replace with auth context later

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetchProjectList(companyId);

      setProjects(res.data.projects || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Project Code',
      dataIndex: 'projectCode',
      width: 140
    },
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      render: (text, record) => (
        <span
          className="text-blue-600 cursor-pointer hover:underline"
          onClick={() => navigate(`/boss/projects/${record.projectId}`)}
        >
          {text}
        </span>
      )
    },
    {
      title: 'Manager',
      dataIndex: 'manager',
      render: manager => manager?.name || '—'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: status => (
        <Tag color={statusColorMap[status] || 'default'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'overallProgress',
      width: 160,
      render: value => (
        <Progress
          percent={value}
          size="small"
          status={value === 100 ? 'success' : 'active'}
        />
      )
    },
    {
      title: 'Expected End',
      dataIndex: 'expectedEndDate',
      render: date =>
        date ? new Date(date).toLocaleDateString() : '—'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" message="Error" description={error} showIcon />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <div className="text-gray-500">Total</div>
            <div className="text-2xl font-semibold">{summary.total}</div>
          </Card>
          <Card>
            <div className="text-gray-500">On Track</div>
            <div className="text-2xl font-semibold text-green-600">
              {summary.onTrack}
            </div>
          </Card>
          <Card>
            <div className="text-gray-500">Delayed</div>
            <div className="text-2xl font-semibold text-red-600">
              {summary.delayed}
            </div>
          </Card>
          <Card>
            <div className="text-gray-500">Completed</div>
            <div className="text-2xl font-semibold text-blue-600">
              {summary.completed}
            </div>
          </Card>
        </div>
      )}

      <Card title="Projects">
        <Table
          rowKey="projectId"
          columns={columns}
          dataSource={projects}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default ProjectLists;
