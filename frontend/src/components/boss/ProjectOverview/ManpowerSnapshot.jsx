import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

const ManpowerSnapshot = ({ data }) => (
  <div className="card shadow-lg rounded-xl p-4 bg-white mt-4">
    <h3 className="text-md font-bold mb-2">Manpower & Attendance Snapshot</h3>
    <p>Required: {data.required}</p>
    <p>Present: {data.present}</p>
    <p>Absent: {data.absent}</p>
    <p className="mt-1">
      Attendance Impact: <span className="text-yellow-600 font-semibold">⚠ Delay Risk</span>
    </p>
  </div>
);

export default ManpowerSnapshot;

