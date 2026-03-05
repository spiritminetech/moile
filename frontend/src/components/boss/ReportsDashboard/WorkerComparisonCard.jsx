import { Card, List, Typography, Button } from 'antd';

export default function WorkerComparisonCard({ workers = [] }) {
  if (!Array.isArray(workers)) return null;

  return (
    <Card
      title="Worker Comparison"
      bordered
      actions={[
        <Button type="link" key="compare">
          View Comparison
        </Button>
      ]}
    >
      <Typography.Text strong>Top Performers</Typography.Text>

      <List
        style={{ marginTop: 8 }}
        dataSource={workers.slice(0, 3)}
        renderItem={(w, idx) => (
          <List.Item>
            {idx + 1}. {w.name} ({w.trade}) – {w.attendancePercent}%
          </List.Item>
        )}
      />
    </Card>
  );
}
