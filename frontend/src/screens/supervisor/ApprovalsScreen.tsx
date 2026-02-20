// ApprovalsScreen - Request review and approval interface for supervisors
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { PendingApproval } from '../../types';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import ConstructionCard from '../../components/common/ConstructionCard';
import ConstructionButton from '../../components/common/ConstructionButton';
import ConstructionInput from '../../components/common/ConstructionInput';
import ConstructionSelector from '../../components/common/ConstructionSelector';
import ApprovalActionComponent from '../../components/supervisor/ApprovalActionComponent';

interface ApprovalsScreenProps {
  navigation?: any;
}

interface ApprovalFilters {
  type: 'all' | 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance_payment';
  urgency: 'all' | 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'all';
  sortBy: 'date' | 'urgency' | 'type' | 'requester';
  sortOrder: 'asc' | 'desc';
}

interface ApprovalSummary {
  totalPending: number;
  urgentCount: number;
  overdueCount: number;
  byType: {
    leave: number;
    material: number;
    tool: number;
    reimbursement: number;
    advance_payment: number;
  };
}

const ApprovalsScreen: React.FC<ApprovalsScreenProps> = ({ navigation }) => {
  const { state: supervisorState } = useSupervisorContext();
  
  // Local state
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<PendingApproval[]>([]);
  const [summary, setSummary] = useState<ApprovalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Filter and view state
  const [filters, setFilters] = useState<ApprovalFilters>({
    type: 'all',
    urgency: 'all',
    status: 'pending',
    sortBy: 'urgency',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedApprovals, setSelectedApprovals] = useState<Set<number>>(new Set());
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);
  const [batchNotes, setBatchNotes] = useState('');
  
  // Detail modal state
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState<any>(null);

  // Load approvals data
  const loadApprovals = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      const params = {
        type: filters.type !== 'all' ? filters.type : undefined,
        urgency: filters.urgency !== 'all' ? filters.urgency : undefined,
        limit: 50,
        offset: 0,
      };

      const response = await supervisorApiService.getPendingApprovals(params);
      
      if (response.success && response.data) {
        // Ensure dates are properly converted from strings to Date objects
        const approvalsWithDates = response.data.approvals.map(approval => ({
          ...approval,
          requestDate: approval.requestDate instanceof Date 
            ? approval.requestDate 
            : new Date(approval.requestDate),
          approvalDeadline: approval.approvalDeadline 
            ? (approval.approvalDeadline instanceof Date 
                ? approval.approvalDeadline 
                : new Date(approval.approvalDeadline))
            : undefined,
        }));
        
        setApprovals(approvalsWithDates);
        setSummary(response.data.summary);
        setLastRefresh(new Date());
      } else {
        setError(response.errors?.[0] || 'Failed to load approvals');
      }
    } catch (error) {
      console.error('Load approvals error:', error);
      setError('Failed to load approvals. Please try again.');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [filters.type, filters.urgency]);

  // Load approval history
  const loadApprovalHistory = useCallback(async () => {
    try {
      const params = {
        status: filters.status !== 'all' ? filters.status : undefined,
        limit: 20,
        offset: 0,
      };

      const response = await supervisorApiService.getApprovalHistory(params);
      
      if (response.success && response.data) {
        // Convert the history response to PendingApproval format for display
        const historyApprovals: PendingApproval[] = response.data.approvals.map(item => ({
          id: item.id,
          requestType: item.requestType as PendingApproval['requestType'],
          requesterId: 0, // Not provided in history
          requesterName: item.requesterName,
          requestDate: new Date(item.requestDate),
          urgency: 'normal' as const, // Default for history
          details: {
            status: item.status,
            processedDate: item.processedDate,
            approverNotes: item.approverNotes,
            amount: item.amount,
          },
        }));
        
        setApprovalHistory(historyApprovals);
      }
    } catch (error) {
      console.error('Load approval history error:', error);
    }
  }, [filters.status]);

  // Initial load
  useEffect(() => {
    if (filters.status === 'pending') {
      loadApprovals();
    } else {
      loadApprovalHistory();
    }
  }, [filters.status, loadApprovals, loadApprovalHistory]);

  // Auto-refresh pending approvals every 60 seconds
  useEffect(() => {
    if (filters.status !== 'pending') return;

    const interval = setInterval(() => {
      loadApprovals(false);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [filters.status, loadApprovals]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (filters.status === 'pending') {
        await loadApprovals(false);
      } else {
        await loadApprovalHistory();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [filters.status, loadApprovals, loadApprovalHistory]);

  // Filter and sort approvals
  const filteredAndSortedApprovals = useMemo(() => {
    let filtered = filters.status === 'pending' ? approvals : approvalHistory;

    // Apply filters
    if (filters.type !== 'all') {
      filtered = filtered.filter(approval => approval.requestType === filters.type);
    }

    if (filters.urgency !== 'all') {
      filtered = filtered.filter(approval => approval.urgency === filters.urgency);
    }

    // Sort approvals
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          const dateA = a.requestDate instanceof Date ? a.requestDate : new Date(a.requestDate);
          const dateB = b.requestDate instanceof Date ? b.requestDate : new Date(b.requestDate);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'urgency':
          const urgencyOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          comparison = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          break;
        case 'type':
          comparison = a.requestType.localeCompare(b.requestType);
          break;
        case 'requester':
          comparison = a.requesterName.localeCompare(b.requesterName);
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [approvals, approvalHistory, filters]);

  // Handle approval actions
  const handleApprove = useCallback(async (approvalId: number, notes?: string) => {
    try {
      const response = await supervisorApiService.processApproval(approvalId, {
        action: 'approve',
        notes,
      });

      if (response.success) {
        Alert.alert('Success', 'Request approved successfully');
        await loadApprovals(false);
        setSelectedApprovals(prev => {
          const newSet = new Set(prev);
          newSet.delete(approvalId);
          return newSet;
        });
      } else {
        Alert.alert('Error', response.errors?.[0] || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Approve error:', error);
      Alert.alert('Error', 'Failed to approve request. Please try again.');
    }
  }, [loadApprovals]);

  const handleReject = useCallback(async (approvalId: number, reason: string) => {
    try {
      const response = await supervisorApiService.processApproval(approvalId, {
        action: 'reject',
        notes: reason,
      });

      if (response.success) {
        Alert.alert('Success', 'Request rejected successfully');
        await loadApprovals(false);
        setSelectedApprovals(prev => {
          const newSet = new Set(prev);
          newSet.delete(approvalId);
          return newSet;
        });
      } else {
        Alert.alert('Error', response.errors?.[0] || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Reject error:', error);
      Alert.alert('Error', 'Failed to reject request. Please try again.');
    }
  }, [loadApprovals]);

  const handleEscalate = useCallback(async (approvalId: number, reason: string) => {
    try {
      const response = await supervisorApiService.processApproval(approvalId, {
        action: 'request_more_info',
        notes: reason,
        escalate: true,
      });

      if (response.success) {
        Alert.alert('Success', 'Request escalated successfully');
        await loadApprovals(false);
      } else {
        Alert.alert('Error', response.errors?.[0] || 'Failed to escalate request');
      }
    } catch (error) {
      console.error('Escalate error:', error);
      Alert.alert('Error', 'Failed to escalate request. Please try again.');
    }
  }, [loadApprovals]);

  // Handle batch processing
  const handleBatchProcess = useCallback(async () => {
    if (selectedApprovals.size === 0 || !batchAction) return;

    try {
      const decisions = Array.from(selectedApprovals).map(approvalId => ({
        approvalId,
        action: batchAction,
        notes: batchNotes,
      }));

      const response = await supervisorApiService.batchProcessApprovals(decisions);

      if (response.success && response.data) {
        const { successful, failed } = response.data;
        Alert.alert(
          'Batch Processing Complete',
          `Successfully processed ${successful} requests. ${failed > 0 ? `${failed} requests failed.` : ''}`
        );
        
        await loadApprovals(false);
        setSelectedApprovals(new Set());
        setShowBatchModal(false);
        setBatchNotes('');
        setBatchAction(null);
      } else {
        Alert.alert('Error', response.errors?.[0] || 'Batch processing failed');
      }
    } catch (error) {
      console.error('Batch process error:', error);
      Alert.alert('Error', 'Batch processing failed. Please try again.');
    }
  }, [selectedApprovals, batchAction, batchNotes, loadApprovals]);

  // Handle approval detail view
  const handleViewDetails = useCallback(async (approval: PendingApproval) => {
    try {
      setSelectedApproval(approval);
      setIsLoading(true);

      const response = await supervisorApiService.getApprovalDetails(approval.id);
      
      if (response.success && response.data) {
        setApprovalDetails(response.data);
        setShowDetailModal(true);
      } else {
        Alert.alert('Error', 'Failed to load approval details');
      }
    } catch (error) {
      console.error('Load approval details error:', error);
      Alert.alert('Error', 'Failed to load approval details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle approval selection for batch processing
  const toggleApprovalSelection = useCallback((approvalId: number) => {
    setSelectedApprovals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(approvalId)) {
        newSet.delete(approvalId);
      } else {
        newSet.add(approvalId);
      }
      return newSet;
    });
  }, []);

  // Filter options
  const typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Leave Requests', value: 'leave' },
    { label: 'Material Requests', value: 'material' },
    { label: 'Tool Requests', value: 'tool' },
    { label: 'Reimbursements', value: 'reimbursement' },
    { label: 'Advance Payments', value: 'advance_payment' },
  ];

  const urgencyOptions = [
    { label: 'All Priorities', value: 'all' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'High Priority', value: 'high' },
    { label: 'Normal Priority', value: 'normal' },
    { label: 'Low Priority', value: 'low' },
  ];

  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'All History', value: 'all' },
  ];

  const sortOptions = [
    { label: 'By Urgency', value: 'urgency' },
    { label: 'By Date', value: 'date' },
    { label: 'By Type', value: 'type' },
    { label: 'By Requester', value: 'requester' },
  ];

  // Render approval item
  const renderApprovalItem = ({ item }: { item: PendingApproval }) => (
    <View style={styles.approvalItemContainer}>
      {filters.status === 'pending' && (
        <TouchableOpacity
          style={styles.selectionCheckbox}
          onPress={() => toggleApprovalSelection(item.id)}
        >
          <View style={[
            styles.checkbox,
            selectedApprovals.has(item.id) && styles.checkboxSelected
          ]}>
            {selectedApprovals.has(item.id) && (
              <Text style={styles.checkboxIcon}>✓</Text>
            )}
          </View>
        </TouchableOpacity>
      )}
      
      <View style={styles.approvalItemContent}>
        <ApprovalActionComponent
          approval={item}
          onApprove={handleApprove}
          onReject={handleReject}
          onEscalate={handleEscalate}
          onViewDetails={handleViewDetails}
          showActions={filters.status === 'pending'}
          isLoading={isLoading}
        />
      </View>
    </View>
  );

  // Show loading state during initial load
  if (isLoading && approvals.length === 0 && approvalHistory.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={ConstructionTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading approvals...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header with summary and controls */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Approvals</Text>
          {lastRefresh && (
            <Text style={styles.lastRefreshText}>
              Last updated: {lastRefresh.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterButtonIcon}>🔍</Text>
          </TouchableOpacity>
          
          {filters.status === 'pending' && selectedApprovals.size > 0 && (
            <TouchableOpacity
              style={styles.batchButton}
              onPress={() => setShowBatchModal(true)}
            >
              <Text style={styles.batchButtonText}>
                Batch ({selectedApprovals.size})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Summary Cards */}
      {summary && filters.status === 'pending' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.summaryContainer}
          contentContainerStyle={styles.summaryContent}
        >
          <ConstructionCard variant="default" style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.totalPending}</Text>
            <Text style={styles.summaryLabel}>Total Pending</Text>
          </ConstructionCard>
          
          <ConstructionCard variant="error" style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.urgentCount}</Text>
            <Text style={styles.summaryLabel}>Urgent</Text>
          </ConstructionCard>
          
          <ConstructionCard variant="warning" style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.overdueCount}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </ConstructionCard>
          
          <ConstructionCard variant="info" style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.byType.leave}</Text>
            <Text style={styles.summaryLabel}>Leave</Text>
          </ConstructionCard>
          
          <ConstructionCard variant="info" style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.byType.material}</Text>
            <Text style={styles.summaryLabel}>Material</Text>
          </ConstructionCard>
        </ScrollView>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <ConstructionCard style={styles.filtersPanel}>
          <Text style={styles.filtersPanelTitle}>Filters & Sorting</Text>
          
          <View style={styles.filtersRow}>
            <ConstructionSelector
              label="Status"
              value={filters.status}
              options={statusOptions}
              onSelect={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
              style={styles.filterSelector}
            />
            
            <ConstructionSelector
              label="Type"
              value={filters.type}
              options={typeOptions}
              onSelect={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
              style={styles.filterSelector}
            />
          </View>
          
          <View style={styles.filtersRow}>
            <ConstructionSelector
              label="Priority"
              value={filters.urgency}
              options={urgencyOptions}
              onSelect={(value) => setFilters(prev => ({ ...prev, urgency: value as any }))}
              style={styles.filterSelector}
            />
            
            <ConstructionSelector
              label="Sort By"
              value={filters.sortBy}
              options={sortOptions}
              onSelect={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
              style={styles.filterSelector}
            />
          </View>
          
          <View style={styles.filtersActions}>
            <ConstructionButton
              title="Clear Filters"
              onPress={() => setFilters({
                type: 'all',
                urgency: 'all',
                status: 'pending',
                sortBy: 'urgency',
                sortOrder: 'desc',
              })}
              variant="outline"
              size="small"
              style={styles.filterActionButton}
            />
            
            <ConstructionButton
              title={`Sort ${filters.sortOrder === 'asc' ? '↑' : '↓'}`}
              onPress={() => setFilters(prev => ({ 
                ...prev, 
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
              }))}
              variant="outline"
              size="small"
              style={styles.filterActionButton}
            />
          </View>
        </ConstructionCard>
      )}

      {/* Error Display */}
      {error && (
        <ConstructionCard variant="error" style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <ConstructionButton
            title="Retry"
            onPress={() => loadApprovals()}
            variant="outline"
            size="small"
            style={styles.retryButton}
          />
        </ConstructionCard>
      )}

      {/* Approvals List */}
      <FlatList
        data={filteredAndSortedApprovals}
        renderItem={renderApprovalItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.approvalsList}
        contentContainerStyle={styles.approvalsListContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ConstructionTheme.colors.primary]}
            tintColor={ConstructionTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ConstructionCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              {filters.status === 'pending' ? '✅' : '📋'}
            </Text>
            <Text style={styles.emptyTitle}>
              {filters.status === 'pending' ? 'No Pending Approvals' : 'No History Found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filters.status === 'pending' 
                ? 'All caught up! No requests need your attention right now.'
                : 'No approval history matches your current filters.'
              }
            </Text>
          </ConstructionCard>
        }
      />

      {/* Batch Processing Modal */}
      <Modal
        visible={showBatchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBatchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Batch Process Approvals</Text>
            
            <Text style={styles.modalSubtitle}>
              {selectedApprovals.size} requests selected
            </Text>
            
            <View style={styles.batchActionButtons}>
              <ConstructionButton
                title="Approve All"
                onPress={() => setBatchAction('approve')}
                variant={batchAction === 'approve' ? 'success' : 'outline'}
                style={styles.batchActionButton}
                icon="✅"
              />
              
              <ConstructionButton
                title="Reject All"
                onPress={() => setBatchAction('reject')}
                variant={batchAction === 'reject' ? 'error' : 'outline'}
                style={styles.batchActionButton}
                icon="❌"
              />
            </View>
            
            <ConstructionInput
              label="Notes (Optional)"
              value={batchNotes}
              onChangeText={setBatchNotes}
              placeholder="Add notes for batch processing..."
              multiline
              numberOfLines={3}
              maxLength={300}
              showCharacterCount
            />
            
            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => {
                  setShowBatchModal(false);
                  setBatchAction(null);
                  setBatchNotes('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              
              <ConstructionButton
                title={`${batchAction === 'approve' ? 'Approve' : 'Reject'} ${selectedApprovals.size} Requests`}
                onPress={handleBatchProcess}
                variant={batchAction === 'approve' ? 'success' : 'error'}
                style={styles.modalButton}
                disabled={!batchAction}
                loading={isLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Approval Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailModalContent]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedApproval && approvalDetails && (
                <>
                  <Text style={styles.modalTitle}>Approval Details</Text>
                  
                  <ConstructionCard variant="outlined" style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Request Information</Text>
                    <Text style={styles.detailText}>
                      Type: {selectedApproval.requestType.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.detailText}>
                      Requester: {approvalDetails.requesterInfo.name}
                    </Text>
                    <Text style={styles.detailText}>
                      Department: {approvalDetails.requesterInfo.department}
                    </Text>
                    <Text style={styles.detailText}>
                      Requested: {(selectedApproval.requestDate instanceof Date 
                        ? selectedApproval.requestDate 
                        : new Date(selectedApproval.requestDate)
                      ).toLocaleDateString()}
                    </Text>
                    <Text style={styles.detailText}>
                      Priority: {(selectedApproval.urgency || 'normal').toUpperCase()}
                    </Text>
                  </ConstructionCard>
                  
                  <ConstructionCard variant="outlined" style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Request Details</Text>
                    <Text style={styles.detailText}>
                      {JSON.stringify(approvalDetails.requestDetails, null, 2)}
                    </Text>
                  </ConstructionCard>
                  
                  {approvalDetails.requesterInfo.recentPerformance && (
                    <ConstructionCard variant="outlined" style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Requester Performance</Text>
                      <Text style={styles.detailText}>
                        Attendance Rate: {(approvalDetails.requesterInfo.recentPerformance.attendanceRate * 100).toFixed(1)}%
                      </Text>
                      <Text style={styles.detailText}>
                        Task Completion: {(approvalDetails.requesterInfo.recentPerformance.taskCompletionRate * 100).toFixed(1)}%
                      </Text>
                      <Text style={styles.detailText}>
                        Quality Score: {(approvalDetails.requesterInfo.recentPerformance.qualityScore * 100).toFixed(1)}%
                      </Text>
                    </ConstructionCard>
                  )}
                  
                  {approvalDetails.approvalHistory && approvalDetails.approvalHistory.length > 0 && (
                    <ConstructionCard variant="outlined" style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Approval History</Text>
                      {approvalDetails.approvalHistory.map((history: any, index: number) => (
                        <View key={index} style={styles.historyItem}>
                          <Text style={styles.historyAction}>{(history.action || 'unknown').toUpperCase()}</Text>
                          <Text style={styles.historyBy}>by {history.by}</Text>
                          <Text style={styles.historyTime}>
                            {new Date(history.timestamp).toLocaleString()}
                          </Text>
                          {history.notes && (
                            <Text style={styles.historyNotes}>{history.notes}</Text>
                          )}
                        </View>
                      ))}
                    </ConstructionCard>
                  )}
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <ConstructionButton
                title="Close"
                onPress={() => setShowDetailModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              
              {selectedApproval && filters.status === 'pending' && (
                <>
                  <ConstructionButton
                    title="Approve"
                    onPress={() => {
                      setShowDetailModal(false);
                      handleApprove(selectedApproval.id);
                    }}
                    variant="success"
                    style={styles.modalButton}
                    icon="✅"
                  />
                  
                  <ConstructionButton
                    title="Reject"
                    onPress={() => {
                      setShowDetailModal(false);
                      handleReject(selectedApproval.id, 'Rejected after detailed review');
                    }}
                    variant="error"
                    style={styles.modalButton}
                    icon="❌"
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.background,
  },
  loadingText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primary,
    ...ConstructionTheme.shadows.medium,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  lastRefreshText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    opacity: 0.8,
    marginTop: ConstructionTheme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ConstructionTheme.spacing.sm,
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
  },
  filterButtonIcon: {
    fontSize: 18,
  },
  batchButton: {
    backgroundColor: ConstructionTheme.colors.secondary,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
  },
  batchButtonText: {
    ...ConstructionTheme.typography.buttonSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  summaryContainer: {
    maxHeight: 100,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  summaryContent: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    gap: ConstructionTheme.spacing.sm,
  },
  summaryCard: {
    width: 80,
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  summaryLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  filtersPanel: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  filtersPanelTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  filterSelector: {
    flex: 1,
  },
  filtersActions: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
  },
  filterActionButton: {
    flex: 1,
  },
  errorCard: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.error,
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  retryButton: {
    minWidth: 80,
  },
  approvalsList: {
    flex: 1,
  },
  approvalsListContent: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.xl,
  },
  approvalItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  selectionCheckbox: {
    paddingTop: ConstructionTheme.spacing.md,
    paddingRight: ConstructionTheme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ConstructionTheme.colors.surface,
  },
  checkboxSelected: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  checkboxIcon: {
    color: ConstructionTheme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  approvalItemContent: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
    marginTop: ConstructionTheme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: ConstructionTheme.spacing.md,
  },
  emptyTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.lg,
    padding: ConstructionTheme.spacing.lg,
    width: '90%',
    maxHeight: '80%',
    ...ConstructionTheme.shadows.large,
  },
  detailModalContent: {
    width: '95%',
    maxHeight: '90%',
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  batchActionButtons: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  batchActionButton: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
  detailSection: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  detailSectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: '600',
  },
  detailText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  historyItem: {
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  historyAction: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: '600',
  },
  historyBy: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  historyTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  historyNotes: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginTop: ConstructionTheme.spacing.xs,
    fontStyle: 'italic',
  },
});

export default ApprovalsScreen;