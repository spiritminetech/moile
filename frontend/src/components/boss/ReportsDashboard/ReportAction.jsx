import { Card, Button, Space, notification } from 'antd';
import { exportReport, approveReport } from '../../../api/boss/bossReportsApi';

export default function ReportActions({ period }) {
  // -------------------- EXPORT HANDLER --------------------
  const handleExport = async (format) => {
    try {
      const res = await exportReport({
        reportType: 'FULL_REPORT',
        format,
        period,
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `Reports_${period.from}_${period.to}.${format === 'PDF' ? 'pdf' : 'xlsx'}`;
      link.click();

      // Clean up URL object to prevent memory leaks
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      notification.error({
        message: 'Export Failed',
        description: 'Could not download the report. Please try again.',
      });
    }
  };

  // -------------------- APPROVE HANDLER --------------------
  const handleApprove = async () => {
    try {
      await approveReport(period);
      notification.success({
        message: 'Report Approved',
        description: `Report for ${period.from} to ${period.to} has been approved.`,
      });
    } catch (error) {
      console.error('Approve failed:', error);
      notification.error({
        message: 'Approval Failed',
        description: 'Could not approve the report. Please try again.',
      });
    }
  };

  return (
    <Card title="Management Actions" bordered>
      <Space>
        <Button type="primary" onClick={handleApprove}>
          Approve Report
        </Button>
        <Button onClick={() => handleExport('PDF')}>Export PDF</Button>
        <Button onClick={() => handleExport('EXCEL')}>Export Excel</Button>
      </Space>
    </Card>
  );
}
