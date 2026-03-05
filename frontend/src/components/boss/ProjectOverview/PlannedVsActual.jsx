import React from 'react';
import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

const PlannedVsActual = ({ data }) => (
  <div className="card shadow-lg rounded-xl p-4 bg-white">
    <h3 className="text-md font-bold mb-2">Planned vs Actual Summary</h3>
    <p>Planned Progress: {data.plannedProgress}%</p>
    <div className="w-full bg-gray-200 rounded-full h-2 my-1">
      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${data.plannedProgress}%` }} />
    </div>

    <p>Actual Progress: {data.actualProgress}%</p>
    <div className="w-full bg-gray-200 rounded-full h-2 my-1">
      <div
        className={`h-2 rounded-full ${
          data.actualProgress < data.plannedProgress ? 'bg-red-500' : 'bg-green-500'
        }`}
        style={{ width: `${data.actualProgress}%` }}
      />
    </div>
    <p>Variance: {data.variance}%</p>
  </div>
);

export default PlannedVsActual;

