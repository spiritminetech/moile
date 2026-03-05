import React from 'react';
import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

const AIRiskPanel = ({ risk }) => (
  <div className="card shadow-lg rounded-xl p-4 bg-white">
    <h3 className="text-md font-bold mb-2">AI Risk Flags 🤖</h3>
    {risk?.flags?.map((f, i) => (
      <p key={i} className="mb-1">
        ⚠ {f}
      </p>
    ))}
    <p className="font-bold mt-2">Risk Level: {risk?.riskLevel}</p>
  </div>
);

export default AIRiskPanel;

