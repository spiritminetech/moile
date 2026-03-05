import React from 'react';
import { Card, Progress, Space, Typography } from 'antd';

const { Text } = Typography;

/**
 * Groups timeline entries by date (YYYY-MM-DD)
 * If multiple entries exist for the same day,
 * the latest one overwrites previous ones.
 */
const groupByDate = (timeline) => {
  const map = new Map();

  timeline.forEach(item => {
    const dateKey = new Date(item.date)
      .toISOString()
      .split('T')[0]; // YYYY-MM-DD

    map.set(dateKey, item.progress);
  });

  return Array.from(map.entries()).map(([date, progress]) => ({
    date,
    progress,
  }));
};

/**
 * Converts index to Day N label
 */
const getDayLabel = (index) => `Day ${index + 1}`;

const ProgressTimeline = ({ timeline = [] }) => {
  if (!timeline.length) {
    return (
      <Card title="PROJECT PROGRESS TIMELINE">
        <Text type="secondary">No progress data available</Text>
      </Card>
    );
  }

  const dailyTimeline = groupByDate(timeline);

  return (
    <Card
      title="PROJECT PROGRESS TIMELINE"
      bordered
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {dailyTimeline.map((item, index) => (
          <div
            key={item.date}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text
              style={{
                width: 60,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {getDayLabel(index)}
            </Text>

            <Progress
              percent={item.progress}
              size="small"
              style={{ flex: 1 }}
            />
          </div>
        ))}

        <Text type="secondary">
          (Based on Daily Supervisor Reports)
        </Text>
      </Space>
    </Card>
  );
};

export default ProgressTimeline;
