import { Card, Typography, Button } from 'antd';

const { Text } = Typography;

export default function AttendanceSummaryCard({ data }) {
  return (
    <Card
      title="Attendance Summary"
      bordered
      actions={[
        <Button type="link" key="view">
          View Detailed Report
        </Button>
      ]}
    >
      {!data ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <p>Total Workers: <strong>{data.totalWorkers}</strong></p>
          <p>Avg Attendance: <strong>{data.averageAttendancePercent}%</strong></p>
          <p>Absenteeism Rate: <strong>{data.absentRate}%</strong></p>
          <p>Late Occurrences: <strong>{data.lateOccurrences}</strong></p>
        </>
      )}
    </Card>
  );
}
