import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import quotationApi from '../../api/quotation/quotationApi';
import * as clientApi from '../../api/client/clientApi';
import { companyService } from '../../services/companyService';
import { toast } from '../../utils/toast';
import QuotationItemsTable from '../../components/quotation/QuotationItemsTable';

const QuotationFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [quotationStatus, setQuotationStatus] = useState('Draft');
  const [formData, setFormData] = useState({
    companyId: '', // Changed to empty string so user can select
    clientId: '',
    projectName: '',
    description: '',
    validUntil: null // Changed to null for dayjs compatibility
  });

  // Fetch clients and companies on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      await Promise.all([fetchClients(), fetchCompanies()]);
      if (isEdit) {
        await fetchQuotation();
      }
      setLoadingData(false);
    };
    
    loadInitialData();
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await clientApi.getClients();
      console.log('Clients API response:', response.data); // Debug log
      // Handle different response structures
      const clientsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyService.getAllCompanies();
      console.log('Companies API response:', response.data); // Debug log
      // Handle different response structures
      const companiesData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to fetch companies');
    }
  };

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationApi.getQuotationById(id);
      const quotation = response.data;
      
      setFormData({
        companyId: quotation.companyId,
        clientId: quotation.clientId,
        projectName: quotation.projectName,
        description: quotation.description || '',
        validUntil: quotation.validUntil ? dayjs(quotation.validUntil) : null
      });
      
      setQuotationStatus(quotation.status);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      toast.error('Failed to fetch quotation details');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.companyId || !formData.clientId || !formData.projectName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        clientId: parseInt(formData.clientId),
        companyId: parseInt(formData.companyId),
        validUntil: formData.validUntil ? formData.validUntil.toISOString() : null
      };

      console.log('Submitting quotation data:', submitData); // Debug log

      if (isEdit) {
        await quotationApi.updateQuotation(id, submitData);
        toast.success('Quotation updated successfully');
      } else {
        const response = await quotationApi.createQuotation(submitData);
        toast.success('Quotation created successfully');
        // Redirect to edit mode to allow adding items
        if (response.data && response.data._id) {
          navigate(`/quotations/${response.data._id}/edit`);
          return;
        }
      }
      
      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error(error.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/quotations');
  };

  if (loading && isEdit || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {loadingData ? 'Loading form data...' : 'Loading quotation...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Quotation' : 'Create Quotation'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update quotation details' : 'Fill in the details to create a new quotation'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <form onSubmit={handleSubmit}>
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quotation Details</h2>
          </div>

          {/* Tabs Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex space-x-1 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'basic'
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Basic Info
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'items'
                      ? 'text-blue-600 bg-blue-50 border border-blue-200'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Cost Breakdown
                </button>
              )}
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled
              >
                Terms & Conditions
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled
              >
                Approval
              </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.companyId}
                      onChange={(e) => handleInputChange('companyId', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={quotationStatus !== 'Draft'}
                    >
                      <option value="">Select Company</option>
                      {companies.length > 0 ? (
                        companies.map(company => (
                          <option key={company.id || company._id} value={company.id || company._id}>
                            {company.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No companies available</option>
                      )}
                    </select>
                  </div>

                  {/* Client */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => handleInputChange('clientId', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={quotationStatus !== 'Draft'}
                    >
                      <option value="">Select Client</option>
                      {clients.length > 0 ? (
                        clients.map(client => (
                          <option key={client.id || client._id} value={client.id || client._id}>
                            {client.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No clients available</option>
                      )}
                    </select>
                  </div>

                  {/* Project Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => handleInputChange('projectName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter project name"
                      required
                      disabled={quotationStatus !== 'Draft'}
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter project description"
                      disabled={quotationStatus !== 'Draft'}
                    />
                  </div>

                  {/* Valid Until */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until
                    </label>
                    <DatePicker
                      value={formData.validUntil}
                      onChange={(date) => handleInputChange('validUntil', date)}
                      format="DD/MM/YYYY"
                      placeholder="Select valid until date"
                      className="w-full"
                      size="large"
                      disabled={quotationStatus !== 'Draft'}
                      style={{
                        borderRadius: '0.375rem',
                        borderColor: '#d1d5db',
                        height: '42px'
                      }}
                      disabledDate={(current) => {
                        // Disable dates before today
                        return current && current < dayjs().startOf('day');
                      }}
                    />
                  </div>

                  {/* Status - Show in edit mode */}
                  {isEdit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <input
                        type="text"
                        value={quotationStatus}
                        disabled
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'items' && isEdit && (
              <QuotationItemsTable 
                quotationId={id} 
                isEditable={quotationStatus === 'Draft'}
              />
            )}

            {activeTab === 'terms' && (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                <p>Terms & conditions management will be implemented in the next phase.</p>
              </div>
            )}

            {activeTab === 'approval' && (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                <p>Approval workflow will be implemented in the next phase.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            {activeTab === 'basic' && (
              <button
                type="submit"
                disabled={loading || (quotationStatus !== 'Draft' && isEdit)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isEdit ? 'Update Quotation' : 'Create Quotation'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuotationFormPage;