import React, { useState } from 'react';
import { Card, Input, Button, Space, Typography, Divider } from 'antd';
import QuotationTermsPage from './QuotationTermsPage';

const { Title, Text } = Typography;

const QuotationTermsDemo = () => {
  const [quotationId, setQuotationId] = useState(12345);
  const [currentQuotationId, setCurrentQuotationId] = useState(12345);

  const handleLoadQuotation = () => {
    setCurrentQuotationId(quotationId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-sm border-0 rounded-lg mb-6">
            <Title level={4} className="!mb-2 text-gray-800">
              Quotation Terms Demo
            </Title>
            <Text type="secondary" className="text-sm block mb-4">
              Enter a quotation ID to manage its terms and conditions
            </Text>
            
            <Divider className="my-4" />
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Text className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Quotation ID:
              </Text>
              <Input
                type="number"
                value={quotationId}
                onChange={(e) => setQuotationId(Number(e.target.value))}
                placeholder="Enter quotation ID"
                className="w-full sm:w-48"
                size="large"
              />
              <Button 
                type="primary" 
                onClick={handleLoadQuotation}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                size="large"
              >
                Load Quotation
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Text type="secondary" className="text-sm">
                Currently viewing terms for Quotation ID: 
                <span className="font-semibold text-blue-700 ml-1">
                  {currentQuotationId}
                </span>
              </Text>
            </div>
          </Card>
        </div>
      </div>

      <QuotationTermsPage quotationId={currentQuotationId} />
    </div>
  );
};

export default QuotationTermsDemo;