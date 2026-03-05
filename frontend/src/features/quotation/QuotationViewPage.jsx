import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import quotationApi from '../../api/quotation/quotationApi';
import { toast } from '../../utils/toast';
import QuotationItemsTable from '../../components/quotation/QuotationItemsTable';

const QuotationViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationApi.getQuotationById(id);
      setQuotation(response.data);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      toast.error('Failed to fetch quotation details');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Submitted': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Converted': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-SG');
  };

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      let response;
      
      switch (action) {
        case 'edit':
          navigate(`/quotations/${id}/edit`);
          return;
        case 'clone':
          response = await quotationApi.cloneQuotation(id);
          toast.success('Quotation cloned successfully');
          navigate('/quotations');
          break;
        case 'submit':
          response = await quotationApi.submitQuotation(id);
          toast.success('Quotation submitted successfully');
          fetchQuotation(); // Refresh data
          break;
        case 'approve':
          response = await quotationApi.approveQuotation(id);
          toast.success('Quotation approved successfully');
          fetchQuotation(); // Refresh data
          break;
        case 'reject':
          const remarks = prompt('Please enter rejection remarks:');
          if (remarks !== null) {
            response = await quotationApi.rejectQuotation(id, remarks);
            toast.success('Quotation rejected');
            fetchQuotation(); // Refresh data
          }
          break;
        case 'convert':
          if (window.confirm('Are you sure you want to convert this quotation to a project?')) {
            response = await quotationApi.convertToProject(id);
            toast.success('Quotation converted to project successfully');
            fetchQuotation(); // Refresh data
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(error.message || `Failed to ${action} quotation`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Quotation not found</h2>
          <button
            onClick={() => navigate('/quotations')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Quotations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {quotation.quotationCode}
          </h1>
          <p className="text-gray-600 mt-1">{quotation.projectName}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
            {quotation.status}
          </span>
          <button
            onClick={() => navigate('/quotations')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Company</label>
                <p className="mt-1 text-sm text-gray-900">{quotation.company?.name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Client</label>
                <p className="mt-1 text-sm text-gray-900">{quotation.client?.name || 'N/A'}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Project Name</label>
                <p className="mt-1 text-sm text-gray-900">{quotation.projectName}</p>
              </div>
              
              {quotation.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{quotation.description}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Version</label>
                <p className="mt-1 text-sm text-gray-900">v{quotation.version}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Valid Until</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(quotation.validUntil)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Created Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(quotation.createdAt)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(quotation.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Manpower Cost</span>
                <span className="text-sm text-gray-900">{formatCurrency(quotation.totalManpowerCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Material Cost</span>
                <span className="text-sm text-gray-900">{formatCurrency(quotation.totalMaterialCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tool Cost</span>
                <span className="text-sm text-gray-900">{formatCurrency(quotation.totalToolCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transport Cost</span>
                <span className="text-sm text-gray-900">{formatCurrency(quotation.totalTransportCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Warranty Cost</span>
                <span className="text-sm text-gray-900">{formatCurrency(quotation.totalWarrantyCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Certification Cost</span>
                <span className="text-sm text-gray-900">{formatCurrency(quotation.totalCertificationCost)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Grand Total</span>
                  <span className="text-base font-semibold text-gray-900">{formatCurrency(quotation.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Information */}
          {(quotation.status === 'Approved' || quotation.status === 'Rejected') && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Information</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{quotation.status}</p>
                </div>
                {quotation.approvedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(quotation.approvedAt)}</p>
                  </div>
                )}
                {quotation.remarks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Remarks</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="space-y-3">
              {quotation.status === 'Draft' && (
                <>
                  <button
                    onClick={() => handleAction('edit')}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Edit Quotation
                  </button>
                  <button
                    onClick={() => handleAction('submit')}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Submit for Approval
                  </button>
                </>
              )}
              
              {quotation.status === 'Submitted' && (
                <>
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              
              {quotation.status === 'Approved' && (
                <button
                  onClick={() => handleAction('convert')}
                  disabled={actionLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Convert to Project
                </button>
              )}
              
              <button
                onClick={() => handleAction('clone')}
                disabled={actionLoading}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Clone Quotation
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Code</span>
                <span className="text-sm font-medium text-gray-900">{quotation.quotationCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium text-gray-900">v{quotation.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(quotation.status)}`}>
                  {quotation.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationViewPage;