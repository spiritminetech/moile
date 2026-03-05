import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Row,
  Col
} from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { managerTaskApi } from '../../../api/manager/managerTaskApi';
import { useAuth } from '../../../context/AuthContext';

const { Option } = Select;
const { RangePicker } = DatePicker;

const TaskListView = ({ onEditTask, onViewTask, onDeleteTask }) => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 1000,
    total: 0
  });

  const [filters, setFilters] = useState({
    projectId: 'all',
    tradeId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filters, pagination.current, pagination.pageSize]);

  const loadMasterData = async () => {
    try {
      const res = await managerTaskApi.getMasterData(user?.companyId);
      if (res.data.success) {
        setProjects(res.data.data.projects || []);
        setTrades(res.data.data.trades || []);
      }
    } catch {
      message.error('Failed to load master data');
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const payload = {
        ...filters,
        companyId: user?.companyId,
        page: pagination.current,
        limit: pagination.pageSize
      };

      const res = await managerTaskApi.getTasks(payload);

      if (res.data.success) {
        const tasksData = res.data.data || [];
        setAllTasks(tasksData);
        setTasks(tasksData);
        setFilteredTasks(tasksData);
        setPagination(prev => ({
          ...prev,
          total: tasksData.length
        }));
        if (isInitialLoad) setIsInitialLoad(false);
      }
    } catch {
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pag) => {
    setPagination({
      current: pag.current,
      pageSize: pag.pageSize,
      total: pagination.total
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    let filtered = [...allTasks];

    if (filters.projectId !== 'all') {
      filtered = filtered.filter(t => t.projectId == filters.projectId);
    }
    if (filters.tradeId !== 'all') {
      filtered = filtered.filter(t => t.tradeId == filters.tradeId);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.dateFrom && filters.dateTo) {
      filtered = filtered.filter(t => {
        const d = new Date(t.date || t.createdAt);
        return d >= new Date(filters.dateFrom) && d <= new Date(filters.dateTo);
      });
    }

    setTasks(filtered);
    setFilteredTasks(filtered);
    setPagination(p => ({
      ...p,
      current: 1,
      total: filtered.length
    }));
  };

  const resetFilters = () => {
    setFilters({
      projectId: 'all',
      tradeId: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setTasks(allTasks);
    setFilteredTasks(allTasks);
    setPagination({
      current: 1,
      pageSize: 1000,
      total: allTasks.length
    });
  };

  const getStatusColor = status => ({
    PLANNED: 'blue',
    ASSIGNED: 'orange',
    IN_PROGRESS: 'processing',
    COMPLETED: 'success',
    CANCELLED: 'error'
  }[status] || 'default');

  const columns = [
    { title: 'Project', dataIndex: 'projectName', key: 'projectName', ellipsis: true },
    { title: 'Task Name', dataIndex: 'taskName', key: 'taskName', ellipsis: true },
    { title: 'Trade', dataIndex: 'tradeName', key: 'tradeName', ellipsis: true },
    {
      title: 'Location',
      key: 'location',
      width: 140,
      render: r => r.additionalData?.workLocation || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: s => <Tag color={getStatusColor(s)}>{s.replace('_', ' ')}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => onViewTask(r)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => onEditTask(r)} />
          <Popconfirm title="Delete this task?" onConfirm={() => onDeleteTask(r.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Card size="small" className="mb-4">
        <Row gutter={[16, 12]}>
          <Col span={6}>Project</Col>
          <Col span={18}>
            <Select value={filters.projectId} onChange={v => handleFilterChange('projectId', v)} style={{ width: '100%' }}>
              <Option value="all">All Projects</Option>
              {projects.map(p => <Option key={p.id} value={p.id}>{p.projectName}</Option>)}
            </Select>
          </Col>

          <Col span={6}>Date</Col>
          <Col span={18}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={d => {
                handleFilterChange('dateFrom', d?.[0]?.format('YYYY-MM-DD') || '');
                handleFilterChange('dateTo', d?.[1]?.format('YYYY-MM-DD') || '');
              }}
            />
          </Col>

          <Col span={6}>Trade</Col>
          <Col span={18}>
            <Select value={filters.tradeId} onChange={v => handleFilterChange('tradeId', v)} style={{ width: '100%' }}>
              <Option value="all">All Trades</Option>
              {trades.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
          </Col>

          <Col span={6}>Status</Col>
          <Col span={18}>
            <Select value={filters.status} onChange={v => handleFilterChange('status', v)} style={{ width: '100%' }}>
              <Option value="all">All Status</Option>
              <Option value="PLANNED">Planned</Option>
              <Option value="ASSIGNED">Assigned</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="COMPLETED">Completed</Option>
            </Select>
          </Col>

          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={resetFilters}>Reset</Button>
              <Button type="primary" onClick={applyFilters}>Apply Filters</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="flex-1 overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          rowKey={(record) =>
            `${record.id}-${record.projectId}-${record.tradeId}-${record.createdAt}`
          }
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={pagination}
          scroll={{ x: 'max-content', y: 'calc(100vh - 380px)' }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default TaskListView;
