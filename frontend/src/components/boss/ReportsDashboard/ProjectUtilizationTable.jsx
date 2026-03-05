import { Card, Table, Tag } from 'antd';

export default function ProjectUtilizationTable({ projects }) {
const columns = [
  {
    title: 'Project',
    dataIndex: 'projectCode',
    key: 'projectCode'
  },
  {
    title: 'Planned',
    dataIndex: 'plannedManDays',   
    key: 'plannedManDays'
  },
  {
    title: 'Actual',
    dataIndex: 'actualManDays',    
    key: 'actualManDays'
  },
  {
    title: 'Variance',
    dataIndex: 'variance',
    key: 'variance',
    render: v => (
      <Tag color={v >= 0 ? 'green' : 'red'}>
        {v >= 0 ? `+${v}` : v}
      </Tag>
    )
  }
];

  return (
    <Card title="Project-wise Utilization" bordered>
      <Table
        rowKey="projectCode"
        columns={columns}
        dataSource={projects}
        pagination={false}
      />
    </Card>
  );
}
