// Materials and Tools Screen - Supervisor role-specific screen for material request and tool allocation management
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import {
  ConstructionCard,
  ConstructionButton,
  ConstructionInput,
  ConstructionLoadingIndicator,
  ConstructionSelector,
  ErrorDisplay,
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { MaterialRequest, ToolAllocation } from '../../types';

interface MaterialInventoryItem {
  materialId: number;
  name: string;
  category: string;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  unit: string;
  reorderLevel: number;
  isLowStock: boolean;
  lastUpdated: string;
}

interface InventoryAlert {
  materialId: number;
  materialName: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overdue_delivery';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface MaterialRequestFormData {
  requestType: 'MATERIAL' | 'TOOL';
  itemName: string;
  itemCategory?: 'concrete' | 'steel' | 'wood' | 'electrical' | 'plumbing' | 'finishing' | 'hardware' | 'power_tools' | 'hand_tools' | 'safety_equipment' | 'measuring_tools' | 'other';
  quantity: number;
  unit?: string;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  requiredDate: string;
  purpose: string;
  justification?: string;
  specifications?: string;
  estimatedCost?: number;
}

interface ToolAllocationFormData {
  toolId: number;
  toolName: string;
  workerId: number;
  workerName: string;
  expectedReturnDate: string;
  purpose: string;
  instructions: string;
}
const MaterialsToolsScreen: React.FC = () => {
  const { state, loadMaterialsAndTools, createMaterialRequest, allocateTool, returnTool, acknowledgeDelivery, returnMaterials, getToolUsageLog, logToolUsage } = useSupervisorContext();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'tools' | 'inventory'>('materials');
  
  // Modal states
  const [showMaterialRequestModal, setShowMaterialRequestModal] = useState(false);
  const [showToolAllocationModal, setShowToolAllocationModal] = useState(false);
  const [showToolReturnModal, setShowToolReturnModal] = useState(false);
  
  // NEW: Additional modal states for missing features
  const [showAcknowledgeDeliveryModal, setShowAcknowledgeDeliveryModal] = useState(false);
  const [showReturnMaterialsModal, setShowReturnMaterialsModal] = useState(false);
  const [showToolUsageLogModal, setShowToolUsageLogModal] = useState(false);
  const [selectedMaterialRequest, setSelectedMaterialRequest] = useState<MaterialRequest | null>(null);
  const [toolUsageLogData, setToolUsageLogData] = useState<any[]>([]);
  
  // Form states
  const [materialRequestForm, setMaterialRequestForm] = useState<MaterialRequestFormData>({
    requestType: 'MATERIAL',
    itemName: '',
    itemCategory: 'other', // Valid default enum value
    quantity: 0,
    unit: 'pieces',
    urgency: 'NORMAL',
    requiredDate: new Date().toISOString().split('T')[0],
    purpose: '',
    justification: '',
    specifications: '',
    estimatedCost: 0,
  });

  const [toolAllocationForm, setToolAllocationForm] = useState<ToolAllocationFormData>({
    toolId: 0,
    toolName: '',
    workerId: 0,
    workerName: '',
    expectedReturnDate: new Date().toISOString().split('T')[0],
    purpose: '',
    instructions: '',
  });

  // NEW: Form states for missing features
  const [acknowledgeDeliveryForm, setAcknowledgeDeliveryForm] = useState({
    deliveredQuantity: 0,
    deliveryCondition: 'good' as 'good' | 'partial' | 'damaged' | 'wrong',
    receivedBy: '',
    deliveryNotes: '',
    deliveryPhotos: [] as string[],
  });

  const [returnMaterialsForm, setReturnMaterialsForm] = useState({
    returnQuantity: 0,
    returnReason: 'excess' as 'excess' | 'defect' | 'scope_change' | 'completion',
    returnCondition: 'unused' as 'unused' | 'damaged',
    returnNotes: '',
    returnPhotos: [] as string[],
  });

  // Inventory and alerts state
  const [inventoryData, setInventoryData] = useState<MaterialInventoryItem[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [selectedToolReturn, setSelectedToolReturn] = useState<ToolAllocation | null>(null);
  const [returnCondition, setReturnCondition] = useState<'good' | 'fair' | 'needs_maintenance' | 'damaged'>('good');
  const [returnNotes, setReturnNotes] = useState('');
  
  // Filter states
  const [materialFilter, setMaterialFilter] = useState<'all' | 'pending' | 'approved' | 'urgent'>('all');
  const [toolFilter, setToolFilter] = useState<'all' | 'allocated' | 'overdue' | 'damaged'>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Load inventory data
  const loadInventoryData = useCallback(async () => {
    try {
      const response = await supervisorApiService.getMaterialInventory({
        projectId: state.assignedProjects[0]?.id,
        lowStock: showLowStockOnly,
      });
      
      if (response.success && response.data) {
        setInventoryData(response.data.inventory);
        setInventoryAlerts(response.data.alerts);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
    }
  }, [state.assignedProjects, showLowStockOnly]);

  // Load data on mount
  useEffect(() => {
    loadMaterialsAndTools();
    loadInventoryData();
  }, [loadMaterialsAndTools, loadInventoryData]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadMaterialsAndTools(),
        loadInventoryData(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadMaterialsAndTools, loadInventoryData]);

  // Reset material request form
  const resetMaterialRequestForm = useCallback(() => {
    setMaterialRequestForm({
      requestType: 'MATERIAL',
      itemName: '',
      itemCategory: 'other', // Valid default enum value
      quantity: 0,
      unit: 'pieces',
      urgency: 'NORMAL',
      requiredDate: new Date().toISOString().split('T')[0],
      purpose: '',
      justification: '',
      specifications: '',
      estimatedCost: 0,
    });
  }, []);

  // Reset tool allocation form
  const resetToolAllocationForm = useCallback(() => {
    setToolAllocationForm({
      toolId: 0,
      toolName: '',
      workerId: 0,
      workerName: '',
      expectedReturnDate: new Date().toISOString().split('T')[0],
      purpose: '',
      instructions: '',
    });
  }, []);

  // Create material request
  const handleCreateMaterialRequest = useCallback(async () => {
    if (!materialRequestForm.itemName.trim() || materialRequestForm.quantity <= 0) {
      Alert.alert('Validation Error', 'Please provide valid material information.');
      return;
    }

    try {
      const requestData = {
        projectId: state.assignedProjects[0]?.id || 1,
        ...materialRequestForm,
        requiredDate: new Date(materialRequestForm.requiredDate),
      };

      await createMaterialRequest(requestData);
      Alert.alert('Success', 'Material request created successfully!');
      setShowMaterialRequestModal(false);
      resetMaterialRequestForm();
    } catch (error) {
      console.error('Error creating material request:', error);
      Alert.alert('Error', 'Failed to create material request. Please try again.');
    }
  }, [materialRequestForm, state.assignedProjects, createMaterialRequest, resetMaterialRequestForm]);

  // Allocate tool
  const handleAllocateTool = useCallback(async () => {
    if (!toolAllocationForm.toolName.trim() || !toolAllocationForm.workerName.trim()) {
      Alert.alert('Validation Error', 'Please provide valid tool allocation information.');
      return;
    }

    try {
      const allocationData = {
        toolId: toolAllocationForm.toolId || Date.now(), // Mock ID if not provided
        toolName: toolAllocationForm.toolName,
        allocatedTo: toolAllocationForm.workerId || 1,
        allocatedToName: toolAllocationForm.workerName,
        allocationDate: new Date(),
        expectedReturnDate: new Date(toolAllocationForm.expectedReturnDate),
        condition: 'good' as const,
        location: 'Site A - Zone 1', // This would be dynamic
      };

      await allocateTool(allocationData);
      Alert.alert('Success', 'Tool allocated successfully!');
      setShowToolAllocationModal(false);
      resetToolAllocationForm();
    } catch (error) {
      console.error('Error allocating tool:', error);
      Alert.alert('Error', 'Failed to allocate tool. Please try again.');
    }
  }, [toolAllocationForm, allocateTool, resetToolAllocationForm]);

  // Return tool
  const handleReturnTool = useCallback(async () => {
    if (!selectedToolReturn) return;

    try {
      await returnTool(selectedToolReturn.id, returnCondition, returnNotes);
      Alert.alert('Success', 'Tool returned successfully!');
      setShowToolReturnModal(false);
      setSelectedToolReturn(null);
      setReturnCondition('good');
      setReturnNotes('');
    } catch (error) {
      console.error('Error returning tool:', error);
      Alert.alert('Error', 'Failed to return tool. Please try again.');
    }
  }, [selectedToolReturn, returnCondition, returnNotes, returnTool]);

  // Process material request
  const handleProcessMaterialRequest = useCallback(async (request: MaterialRequest, action: 'approve' | 'reject') => {
    Alert.alert(
      `${action === 'approve' ? 'Approve' : 'Reject'} Request`,
      `Are you sure you want to ${action} this material request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : 'Reject',
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await supervisorApiService.processMaterialRequest(request.id, {
                action,
                notes: `${action === 'approve' ? 'Approved' : 'Rejected'} by supervisor`,
              });
              Alert.alert('Success', `Material request ${action}d successfully!`);
              await loadMaterialsAndTools();
            } catch (error) {
              console.error(`Error ${action}ing material request:`, error);
              Alert.alert('Error', `Failed to ${action} material request. Please try again.`);
            }
          },
        },
      ]
    );
  }, [loadMaterialsAndTools]);

  // NEW: Acknowledge Delivery Handler
  const handleAcknowledgeDelivery = useCallback(async () => {
    if (!selectedMaterialRequest) return;

    if (!acknowledgeDeliveryForm.deliveredQuantity || acknowledgeDeliveryForm.deliveredQuantity <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid delivered quantity.');
      return;
    }

    try {
      await acknowledgeDelivery(selectedMaterialRequest.id, {
        deliveredQuantity: acknowledgeDeliveryForm.deliveredQuantity,
        deliveryCondition: acknowledgeDeliveryForm.deliveryCondition,
        receivedBy: acknowledgeDeliveryForm.receivedBy || 'Supervisor',
        deliveryNotes: acknowledgeDeliveryForm.deliveryNotes,
        deliveryPhotos: acknowledgeDeliveryForm.deliveryPhotos,
      });

      Alert.alert('Success', 'Delivery acknowledged successfully! Inventory updated.');
      setShowAcknowledgeDeliveryModal(false);
      setSelectedMaterialRequest(null);
      setAcknowledgeDeliveryForm({
        deliveredQuantity: 0,
        deliveryCondition: 'good',
        receivedBy: '',
        deliveryNotes: '',
        deliveryPhotos: [],
      });
    } catch (error) {
      console.error('Error acknowledging delivery:', error);
      Alert.alert('Error', 'Failed to acknowledge delivery. Please try again.');
    }
  }, [selectedMaterialRequest, acknowledgeDeliveryForm, acknowledgeDelivery]);

  // NEW: Return Materials Handler
  const handleReturnMaterials = useCallback(async () => {
    if (!selectedMaterialRequest) return;

    if (!returnMaterialsForm.returnQuantity || returnMaterialsForm.returnQuantity <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid return quantity.');
      return;
    }

    if (returnMaterialsForm.returnQuantity > (selectedMaterialRequest.quantity || 0)) {
      Alert.alert('Validation Error', 'Return quantity cannot exceed requested quantity.');
      return;
    }

    try {
      await returnMaterials({
        requestId: selectedMaterialRequest.id,
        returnQuantity: returnMaterialsForm.returnQuantity,
        returnReason: returnMaterialsForm.returnReason,
        returnCondition: returnMaterialsForm.returnCondition,
        returnNotes: returnMaterialsForm.returnNotes,
        returnPhotos: returnMaterialsForm.returnPhotos,
      });

      Alert.alert('Success', 'Materials returned successfully! Inventory updated.');
      setShowReturnMaterialsModal(false);
      setSelectedMaterialRequest(null);
      setReturnMaterialsForm({
        returnQuantity: 0,
        returnReason: 'excess',
        returnCondition: 'unused',
        returnNotes: '',
        returnPhotos: [],
      });
    } catch (error) {
      console.error('Error returning materials:', error);
      Alert.alert('Error', 'Failed to return materials. Please try again.');
    }
  }, [selectedMaterialRequest, returnMaterialsForm, returnMaterials]);

  // NEW: Load Tool Usage Log
  const handleLoadToolUsageLog = useCallback(async () => {
    try {
      const projectId = state.assignedProjects[0]?.id;
      const tools = await getToolUsageLog(projectId);
      setToolUsageLogData(tools);
      setShowToolUsageLogModal(true);
    } catch (error) {
      console.error('Error loading tool usage log:', error);
      Alert.alert('Error', 'Failed to load tool usage log.');
    }
  }, [state.assignedProjects, getToolUsageLog]);

  // Filter material requests
  const filteredMaterialRequests = useMemo(() => {
    let filtered = state.materialRequests;
    
    switch (materialFilter) {
      case 'pending':
        filtered = filtered.filter(request => request.status === 'pending');
        break;
      case 'approved':
        filtered = filtered.filter(request => request.status === 'approved');
        break;
      case 'urgent':
        filtered = filtered.filter(request => request.urgency?.toUpperCase() === 'URGENT');
        break;
    }
    
    return filtered;
  }, [state.materialRequests, materialFilter]);

  // Filter tool allocations
  const filteredToolAllocations = useMemo(() => {
    let filtered = state.toolAllocations;
    
    switch (toolFilter) {
      case 'allocated':
        filtered = filtered.filter(allocation => !allocation.actualReturnDate);
        break;
      case 'overdue':
        filtered = filtered.filter(allocation => 
          !allocation.actualReturnDate && 
          new Date(allocation.expectedReturnDate) < new Date()
        );
        break;
      case 'damaged':
        filtered = filtered.filter(allocation => 
          allocation.condition === 'damaged' || allocation.condition === 'needs_maintenance'
        );
        break;
    }
    
    return filtered;
  }, [state.toolAllocations, toolFilter]);

  // Filter inventory data
  const filteredInventoryData = useMemo(() => {
    return showLowStockOnly 
      ? inventoryData.filter(item => item.isLowStock)
      : inventoryData;
  }, [inventoryData, showLowStockOnly]);
  // Render material request item
  const renderMaterialRequestItem = useCallback(({ item }: { item: MaterialRequest }) => (
    <ConstructionCard
      title={item.itemName}
      subtitle={`${item.quantity} ${item.unit} • ${item.category}`}
      variant={item.urgency?.toUpperCase() === 'URGENT' ? 'warning' : 'default'}
      style={styles.requestCard}
    >
      <View style={styles.requestContent}>
        <Text style={styles.requestPurpose}>{item.purpose}</Text>
        <Text style={styles.requestJustification} numberOfLines={2}>
          {item.justification}
        </Text>
        
        <View style={styles.requestMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Required Date</Text>
            <Text style={styles.metricValue}>
              {new Date(item.requiredDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Est. Cost</Text>
            <Text style={styles.metricValue}>
              ${item.estimatedCost?.toLocaleString() || 'N/A'}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Urgency</Text>
            <Text style={[styles.metricValue, { color: getUrgencyColor(item.urgency) }]}>
              {(item.urgency || 'normal').toUpperCase()}
            </Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.requestActions}>
            <ConstructionButton
              title="Approve"
              onPress={() => handleProcessMaterialRequest(item, 'approve')}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
            <ConstructionButton
              title="Reject"
              onPress={() => handleProcessMaterialRequest(item, 'reject')}
              variant="outline"
              size="small"
              style={styles.actionButton}
            />
          </View>
        )}

        {/* NEW: Acknowledge Delivery for Approved Requests */}
        {item.status === 'approved' && (
          <View style={styles.requestActions}>
            <ConstructionButton
              title="📦 Acknowledge Delivery"
              onPress={() => {
                setSelectedMaterialRequest(item);
                setShowAcknowledgeDeliveryModal(true);
              }}
              variant="primary"
              size="small"
            />
          </View>
        )}

        {/* NEW: Return Materials for Fulfilled Requests */}
        {item.status === 'fulfilled' && (
          <View style={styles.requestActions}>
            <ConstructionButton
              title="↩️ Return Materials"
              onPress={() => {
                setSelectedMaterialRequest(item);
                setShowReturnMaterialsModal(true);
              }}
              variant="secondary"
              size="small"
            />
          </View>
        )}

        <View style={styles.requestStatus}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {(item.status || 'pending').toUpperCase()}
          </Text>
        </View>
      </View>
    </ConstructionCard>
  ), [handleProcessMaterialRequest]);

  // Render tool allocation item
  const renderToolAllocationItem = useCallback(({ item }: { item: ToolAllocation }) => (
    <ConstructionCard
      title={item.toolName}
      subtitle={`Allocated to: ${item.allocatedToName}`}
      variant={item.condition === 'damaged' ? 'error' : 'default'}
      style={styles.allocationCard}
    >
      <View style={styles.allocationContent}>
        <View style={styles.allocationMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Allocated</Text>
            <Text style={styles.metricValue}>
              {new Date(item.allocationDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Expected Return</Text>
            <Text style={styles.metricValue}>
              {new Date(item.expectedReturnDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Condition</Text>
            <Text style={[styles.metricValue, { color: getConditionColor(item.condition) }]}>
              {(item.condition || 'good').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.allocationLocation}>Location: {item.location}</Text>

        {!item.actualReturnDate && (
          <View style={styles.allocationActions}>
            <ConstructionButton
              title="Return Tool"
              onPress={() => {
                setSelectedToolReturn(item);
                setShowToolReturnModal(true);
              }}
              variant="secondary"
              size="small"
            />
          </View>
        )}

        {item.actualReturnDate && (
          <Text style={styles.returnedText}>
            Returned: {new Date(item.actualReturnDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    </ConstructionCard>
  ), []);

  // Render inventory item
  const renderInventoryItem = useCallback(({ item }: { item: MaterialInventoryItem }) => (
    <ConstructionCard
      title={item.name}
      subtitle={item.category}
      variant={item.isLowStock ? 'warning' : 'default'}
      style={styles.inventoryCard}
    >
      <View style={styles.inventoryContent}>
        <View style={styles.inventoryMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Current Stock</Text>
            <Text style={styles.metricValue}>{item.currentStock} {item.unit}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Allocated</Text>
            <Text style={styles.metricValue}>{item.allocatedStock} {item.unit}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Available</Text>
            <Text style={[styles.metricValue, { color: item.availableStock > 0 ? ConstructionTheme.colors.success : ConstructionTheme.colors.error }]}>
              {item.availableStock} {item.unit}
            </Text>
          </View>
        </View>

        {item.isLowStock && (
          <View style={styles.lowStockAlert}>
            <Text style={styles.lowStockText}>
              ⚠️ Low Stock Alert - Reorder Level: {item.reorderLevel} {item.unit}
            </Text>
          </View>
        )}

        <Text style={styles.lastUpdated}>
          Last Updated: {new Date(item.lastUpdated).toLocaleString()}
        </Text>
      </View>
    </ConstructionCard>
  ), []);

  // Get urgency color
  const getUrgencyColor = (urgency: string): string => {
    const normalizedUrgency = urgency?.toUpperCase();
    switch (normalizedUrgency) {
      case 'URGENT':
        return ConstructionTheme.colors.error;
      case 'HIGH':
        return ConstructionTheme.colors.warning;
      case 'NORMAL':
        return ConstructionTheme.colors.info;
      case 'LOW':
        return ConstructionTheme.colors.success;
      default:
        return ConstructionTheme.colors.onSurface;
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return ConstructionTheme.colors.success;
      case 'rejected':
        return ConstructionTheme.colors.error;
      case 'delivered':
        return ConstructionTheme.colors.success;
      case 'pending':
        return ConstructionTheme.colors.warning;
      default:
        return ConstructionTheme.colors.onSurface;
    }
  };

  // Get condition color
  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case 'good':
        return ConstructionTheme.colors.success;
      case 'fair':
        return ConstructionTheme.colors.info;
      case 'needs_maintenance':
        return ConstructionTheme.colors.warning;
      case 'damaged':
        return ConstructionTheme.colors.error;
      default:
        return ConstructionTheme.colors.onSurface;
    }
  };

  if (state.materialsLoading && state.materialRequests.length === 0 && state.toolAllocations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ConstructionLoadingIndicator message="Loading materials and tools..." />
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.errorContainer}>
        <ErrorDisplay
          error={state.error}
          onRetry={handleRefresh}
        />
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header with tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Materials & Tools</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'materials' && styles.activeTab]}
            onPress={() => setActiveTab('materials')}
          >
            <Text style={[styles.tabText, activeTab === 'materials' && styles.activeTabText]}>
              Materials
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tools' && styles.activeTab]}
            onPress={() => setActiveTab('tools')}
          >
            <Text style={[styles.tabText, activeTab === 'tools' && styles.activeTabText]}>
              Tools
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
            onPress={() => setActiveTab('inventory')}
          >
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>
              Inventory
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alerts Section */}
      {inventoryAlerts.length > 0 && (
        <View style={styles.alertsSection}>
          <Text style={styles.alertsSectionTitle}>Inventory Alerts ({inventoryAlerts.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {inventoryAlerts.slice(0, 3).map((alert) => (
              <TouchableOpacity
                key={alert.materialId}
                style={[styles.alertItem, styles[`alert_${alert.severity}`]]}
              >
                <Text style={styles.alertType}>{(alert.alertType || 'general').replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content based on active tab */}
      {activeTab === 'materials' && (
        <View style={styles.tabContent}>
          {/* Materials Header */}
          <View style={styles.contentHeader}>
            <View style={styles.filterContainer}>
              <ConstructionSelector
                value={materialFilter}
                onValueChange={setMaterialFilter}
                options={[
                  { label: 'All Requests', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Urgent', value: 'urgent' },
                ]}
                style={styles.filterSelector}
              />
            </View>
            <ConstructionButton
              title="New Request"
              onPress={() => setShowMaterialRequestModal(true)}
              variant="primary"
              size="medium"
            />
          </View>

          {/* Materials List */}
          <FlatList
            data={filteredMaterialRequests}
            renderItem={renderMaterialRequestItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[ConstructionTheme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <ConstructionCard title="No Material Requests" variant="outlined">
                <Text style={styles.emptyText}>
                  No material requests found. Create your first request to get started.
                </Text>
              </ConstructionCard>
            }
          />
        </View>
      )}

      {activeTab === 'tools' && (
        <View style={styles.tabContent}>
          {/* Tools Header */}
          <View style={styles.contentHeader}>
            <View style={styles.filterContainer}>
              <ConstructionSelector
                value={toolFilter}
                onValueChange={setToolFilter}
                options={[
                  { label: 'All Allocations', value: 'all' },
                  { label: 'Currently Allocated', value: 'allocated' },
                  { label: 'Overdue Returns', value: 'overdue' },
                  { label: 'Damaged/Maintenance', value: 'damaged' },
                ]}
                style={styles.filterSelector}
              />
            </View>
            <ConstructionButton
              title="📋 Usage Log"
              onPress={handleLoadToolUsageLog}
              variant="secondary"
              size="small"
              style={{ marginRight: ConstructionTheme.spacing.sm }}
            />
            <ConstructionButton
              title="Allocate Tool"
              onPress={() => setShowToolAllocationModal(true)}
              variant="primary"
              size="medium"
            />
          </View>

          {/* Tools List */}
          <FlatList
            data={filteredToolAllocations}
            renderItem={renderToolAllocationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[ConstructionTheme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <ConstructionCard title="No Tool Allocations" variant="outlined">
                <Text style={styles.emptyText}>
                  No tool allocations found. Allocate your first tool to get started.
                </Text>
              </ConstructionCard>
            }
          />
        </View>
      )}

      {activeTab === 'inventory' && (
        <View style={styles.tabContent}>
          {/* Inventory Header */}
          <View style={styles.contentHeader}>
            <View style={styles.filterContainer}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Low Stock Only</Text>
                <Switch
                  value={showLowStockOnly}
                  onValueChange={(value) => {
                    setShowLowStockOnly(value);
                    loadInventoryData();
                  }}
                  trackColor={{ false: ConstructionTheme.colors.disabled, true: ConstructionTheme.colors.primary }}
                  thumbColor={showLowStockOnly ? ConstructionTheme.colors.onPrimary : ConstructionTheme.colors.onSurface}
                />
              </View>
            </View>
            <ConstructionButton
              title="Refresh"
              onPress={loadInventoryData}
              variant="secondary"
              size="medium"
            />
          </View>

          {/* Inventory List */}
          <FlatList
            data={filteredInventoryData}
            renderItem={renderInventoryItem}
            keyExtractor={(item) => item.materialId.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[ConstructionTheme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <ConstructionCard title="No Inventory Data" variant="outlined">
                <Text style={styles.emptyText}>
                  No inventory data available. Check your connection and try again.
                </Text>
              </ConstructionCard>
            }
          />
        </View>
      )}
      {/* Material Request Modal */}
      <Modal
        visible={showMaterialRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMaterialRequestModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Material Request</Text>
            <TouchableOpacity onPress={() => setShowMaterialRequestModal(false)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <ConstructionInput
              label="Material Name"
              value={materialRequestForm.itemName}
              onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, itemName: text }))}
              placeholder="Enter material name..."
            />

            <ConstructionInput
              label="Category"
              value={materialRequestForm.category}
              onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, category: text }))}
              placeholder="e.g., Construction Materials, Safety Equipment..."
            />

            <View style={styles.inputRow}>
              <ConstructionInput
                label="Quantity"
                value={materialRequestForm.quantity.toString()}
                onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, quantity: parseInt(text) || 0 }))}
                keyboardType="numeric"
                style={styles.halfInput}
              />
              <ConstructionInput
                label="Unit"
                value={materialRequestForm.unit}
                onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, unit: text }))}
                placeholder="e.g., bags, pieces, meters..."
                style={styles.halfInput}
              />
            </View>

            <ConstructionSelector
              label="Urgency"
              value={materialRequestForm.urgency}
              onValueChange={(value) => setMaterialRequestForm(prev => ({ ...prev, urgency: value as any }))}
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Normal', value: 'NORMAL' },
                { label: 'High', value: 'HIGH' },
                { label: 'Urgent', value: 'URGENT' },
              ]}
            />

            <ConstructionInput
              label="Required Date"
              value={materialRequestForm.requiredDate}
              onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, requiredDate: text }))}
              placeholder="YYYY-MM-DD"
            />

            <ConstructionInput
              label="Purpose"
              value={materialRequestForm.purpose}
              onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, purpose: text }))}
              placeholder="What will this material be used for?"
            />

            <ConstructionInput
              label="Justification"
              value={materialRequestForm.justification}
              onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, justification: text }))}
              placeholder="Why is this material needed?"
              multiline
              numberOfLines={3}
            />

            <ConstructionInput
              label="Estimated Cost ($)"
              value={materialRequestForm.estimatedCost.toString()}
              onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, estimatedCost: parseFloat(text) || 0 }))}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => {
                  setShowMaterialRequestModal(false);
                  resetMaterialRequestForm();
                }}
                variant="outline"
                style={styles.actionButton}
              />
              <ConstructionButton
                title="Create Request"
                onPress={handleCreateMaterialRequest}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Tool Allocation Modal */}
      <Modal
        visible={showToolAllocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowToolAllocationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Allocate Tool</Text>
            <TouchableOpacity onPress={() => setShowToolAllocationModal(false)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <ConstructionInput
              label="Tool Name"
              value={toolAllocationForm.toolName}
              onChangeText={(text) => setToolAllocationForm(prev => ({ ...prev, toolName: text }))}
              placeholder="Enter tool name..."
            />

            <ConstructionInput
              label="Worker Name"
              value={toolAllocationForm.workerName}
              onChangeText={(text) => setToolAllocationForm(prev => ({ ...prev, workerName: text }))}
              placeholder="Enter worker name..."
            />

            <ConstructionInput
              label="Expected Return Date"
              value={toolAllocationForm.expectedReturnDate}
              onChangeText={(text) => setToolAllocationForm(prev => ({ ...prev, expectedReturnDate: text }))}
              placeholder="YYYY-MM-DD"
            />

            <ConstructionInput
              label="Purpose"
              value={toolAllocationForm.purpose}
              onChangeText={(text) => setToolAllocationForm(prev => ({ ...prev, purpose: text }))}
              placeholder="What will this tool be used for?"
            />

            <ConstructionInput
              label="Instructions"
              value={toolAllocationForm.instructions}
              onChangeText={(text) => setToolAllocationForm(prev => ({ ...prev, instructions: text }))}
              placeholder="Any special instructions for tool usage..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => {
                  setShowToolAllocationModal(false);
                  resetToolAllocationForm();
                }}
                variant="outline"
                style={styles.actionButton}
              />
              <ConstructionButton
                title="Allocate Tool"
                onPress={handleAllocateTool}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Tool Return Modal */}
      <Modal
        visible={showToolReturnModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowToolReturnModal(false)}
      >
        <View style={styles.overlayModal}>
          <View style={styles.returnModal}>
            <Text style={styles.modalTitle}>Return Tool</Text>
            
            {selectedToolReturn && (
              <>
                <Text style={styles.returnToolName}>{selectedToolReturn.toolName}</Text>
                <Text style={styles.returnWorkerName}>From: {selectedToolReturn.allocatedToName}</Text>
                
                <ConstructionSelector
                  label="Tool Condition"
                  value={returnCondition}
                  onValueChange={setReturnCondition}
                  options={[
                    { label: 'Good', value: 'good' },
                    { label: 'Fair', value: 'fair' },
                    { label: 'Needs Maintenance', value: 'needs_maintenance' },
                    { label: 'Damaged', value: 'damaged' },
                  ]}
                />
                
                <ConstructionInput
                  label="Return Notes"
                  value={returnNotes}
                  onChangeText={setReturnNotes}
                  placeholder="Any notes about the tool condition..."
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => setShowToolReturnModal(false)}
                variant="outline"
                style={styles.actionButton}
              />
              <ConstructionButton
                title="Return Tool"
                onPress={handleReturnTool}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* NEW: Acknowledge Delivery Modal */}
      <Modal
        visible={showAcknowledgeDeliveryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAcknowledgeDeliveryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📦 Acknowledge Delivery</Text>
            <TouchableOpacity onPress={() => setShowAcknowledgeDeliveryModal(false)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedMaterialRequest && (
              <>
                <ConstructionCard variant="outlined" style={{ marginBottom: ConstructionTheme.spacing.md }}>
                  <Text style={styles.modalSubtitle}>Material Details</Text>
                  <Text style={styles.modalInfoText}>Item: {selectedMaterialRequest.itemName}</Text>
                  <Text style={styles.modalInfoText}>Requested: {selectedMaterialRequest.quantity} {selectedMaterialRequest.unit}</Text>
                  <Text style={styles.modalInfoText}>Category: {selectedMaterialRequest.category}</Text>
                </ConstructionCard>

                <ConstructionInput
                  label="Delivered Quantity *"
                  value={acknowledgeDeliveryForm.deliveredQuantity.toString()}
                  onChangeText={(text) => setAcknowledgeDeliveryForm(prev => ({ 
                    ...prev, 
                    deliveredQuantity: parseInt(text) || 0 
                  }))}
                  keyboardType="numeric"
                  placeholder="Enter delivered quantity"
                />

                <ConstructionSelector
                  label="Delivery Condition *"
                  value={acknowledgeDeliveryForm.deliveryCondition}
                  onValueChange={(value) => setAcknowledgeDeliveryForm(prev => ({ 
                    ...prev, 
                    deliveryCondition: value as any 
                  }))}
                  options={[
                    { label: '✅ Received in Full (Good Condition)', value: 'good' },
                    { label: '⚠️ Partial Delivery', value: 'partial' },
                    { label: '❌ Damaged Items', value: 'damaged' },
                    { label: '❌ Wrong Items Delivered', value: 'wrong' },
                  ]}
                />

                <ConstructionInput
                  label="Received By"
                  value={acknowledgeDeliveryForm.receivedBy}
                  onChangeText={(text) => setAcknowledgeDeliveryForm(prev => ({ ...prev, receivedBy: text }))}
                  placeholder="Name of person who received delivery"
                />

                <ConstructionInput
                  label="Delivery Notes"
                  value={acknowledgeDeliveryForm.deliveryNotes}
                  onChangeText={(text) => setAcknowledgeDeliveryForm(prev => ({ ...prev, deliveryNotes: text }))}
                  placeholder="Any notes about the delivery condition, packaging, etc."
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.helperText}>
                  💡 Tip: Take photos of delivery for documentation (feature coming soon)
                </Text>
              </>
            )}

            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => setShowAcknowledgeDeliveryModal(false)}
                variant="outline"
                style={styles.actionButton}
              />
              <ConstructionButton
                title="Confirm Delivery"
                onPress={handleAcknowledgeDelivery}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* NEW: Return Materials Modal */}
      <Modal
        visible={showReturnMaterialsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReturnMaterialsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>↩️ Return Materials</Text>
            <TouchableOpacity onPress={() => setShowReturnMaterialsModal(false)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedMaterialRequest && (
              <>
                <ConstructionCard variant="outlined" style={{ marginBottom: ConstructionTheme.spacing.md }}>
                  <Text style={styles.modalSubtitle}>Material Details</Text>
                  <Text style={styles.modalInfoText}>Item: {selectedMaterialRequest.itemName}</Text>
                  <Text style={styles.modalInfoText}>Delivered: {selectedMaterialRequest.quantity} {selectedMaterialRequest.unit}</Text>
                  <Text style={styles.modalInfoText}>Category: {selectedMaterialRequest.category}</Text>
                </ConstructionCard>

                <ConstructionInput
                  label="Return Quantity *"
                  value={returnMaterialsForm.returnQuantity.toString()}
                  onChangeText={(text) => setReturnMaterialsForm(prev => ({ 
                    ...prev, 
                    returnQuantity: parseInt(text) || 0 
                  }))}
                  keyboardType="numeric"
                  placeholder="Enter quantity to return"
                />

                <ConstructionSelector
                  label="Return Reason *"
                  value={returnMaterialsForm.returnReason}
                  onValueChange={(value) => setReturnMaterialsForm(prev => ({ 
                    ...prev, 
                    returnReason: value as any 
                  }))}
                  options={[
                    { label: 'Excess Materials', value: 'excess' },
                    { label: 'Defective/Damaged', value: 'defect' },
                    { label: 'Scope Change', value: 'scope_change' },
                    { label: 'Project Completion', value: 'completion' },
                  ]}
                />

                <ConstructionSelector
                  label="Return Condition *"
                  value={returnMaterialsForm.returnCondition}
                  onValueChange={(value) => setReturnMaterialsForm(prev => ({ 
                    ...prev, 
                    returnCondition: value as any 
                  }))}
                  options={[
                    { label: 'Unused (Good Condition)', value: 'unused' },
                    { label: 'Damaged/Defective', value: 'damaged' },
                  ]}
                />

                <ConstructionInput
                  label="Return Notes"
                  value={returnMaterialsForm.returnNotes}
                  onChangeText={(text) => setReturnMaterialsForm(prev => ({ ...prev, returnNotes: text }))}
                  placeholder="Explain why materials are being returned..."
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.helperText}>
                  💡 Tip: Document returned materials with photos (feature coming soon)
                </Text>
              </>
            )}

            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => setShowReturnMaterialsModal(false)}
                variant="outline"
                style={styles.actionButton}
              />
              <ConstructionButton
                title="Process Return"
                onPress={handleReturnMaterials}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* NEW: Tool Usage Log Modal */}
      <Modal
        visible={showToolUsageLogModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowToolUsageLogModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔧 Tool Usage Log</Text>
            <TouchableOpacity onPress={() => setShowToolUsageLogModal(false)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {toolUsageLogData.length > 0 ? (
              toolUsageLogData.map((tool, index) => (
                <ConstructionCard key={`tool-${index}-${tool.toolName || 'unknown'}`} variant="outlined" style={{ marginBottom: ConstructionTheme.spacing.md }}>
                  <Text style={styles.toolLogName}>{tool.toolName}</Text>
                  <Text style={styles.toolLogDetail}>Category: {tool.category}</Text>
                  <Text style={styles.toolLogDetail}>Quantity: {tool.totalQuantity}</Text>
                  <Text style={styles.toolLogDetail}>Status: {tool.status}</Text>
                  <Text style={styles.toolLogDetail}>Condition: {tool.condition}</Text>
                  <Text style={styles.toolLogDetail}>Location: {tool.location}</Text>
                  
                  {tool.allocationHistory && tool.allocationHistory.length > 0 && (
                    <>
                      <Text style={styles.toolLogSubtitle}>Allocation History:</Text>
                      {tool.allocationHistory.slice(0, 3).map((history: any, idx: number) => (
                        <View key={`history-${idx}-${history.requestedDate}-${history.purpose?.substring(0, 10) || ''}`} style={styles.historyItem}>
                          <Text style={styles.historyText}>
                            • {new Date(history.requestedDate).toLocaleDateString()} - {history.purpose}
                          </Text>
                          <Text style={styles.historyStatus}>Status: {history.status}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </ConstructionCard>
              ))
            ) : (
              <Text style={styles.emptyText}>No tool usage data available</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.background,
    padding: ConstructionTheme.spacing.md,
  },
  header: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
    paddingTop: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: ConstructionTheme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  activeTabText: {
    color: ConstructionTheme.colors.primary,
    fontWeight: '600',
  },
  alertsSection: {
    backgroundColor: ConstructionTheme.colors.surface,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
  },
  alertsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  alertItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginHorizontal: ConstructionTheme.spacing.xs,
    minWidth: 200,
    borderLeftWidth: 4,
  },
  alert_critical: {
    borderLeftColor: ConstructionTheme.colors.error,
  },
  alert_high: {
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  alert_medium: {
    borderLeftColor: ConstructionTheme.colors.info,
  },
  alert_low: {
    borderLeftColor: ConstructionTheme.colors.success,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alertMessage: {
    fontSize: 12,
    color: ConstructionTheme.colors.onSurface,
  },
  tabContent: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
  },
  filterContainer: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  filterSelector: {
    minWidth: 150,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ConstructionTheme.spacing.sm,
  },
  switchLabel: {
    fontSize: 14,
    color: ConstructionTheme.colors.onSurface,
  },
  listContainer: {
    padding: ConstructionTheme.spacing.md,
  },
  requestCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  requestContent: {
    gap: ConstructionTheme.spacing.sm,
  },
  requestPurpose: {
    fontSize: 16,
    fontWeight: '500',
    color: ConstructionTheme.colors.onSurface,
  },
  requestJustification: {
    fontSize: 14,
    color: ConstructionTheme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  requestMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
  },
  requestActions: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
    paddingTop: ConstructionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.border,
  },
  requestStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  allocationCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  allocationContent: {
    gap: ConstructionTheme.spacing.sm,
  },
  allocationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  allocationLocation: {
    fontSize: 14,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  allocationActions: {
    paddingTop: ConstructionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.border,
  },
  returnedText: {
    fontSize: 12,
    color: ConstructionTheme.colors.success,
    fontWeight: '500',
  },
  inventoryCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  inventoryContent: {
    gap: ConstructionTheme.spacing.sm,
  },
  inventoryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  lowStockAlert: {
    backgroundColor: '#FFF8E1',
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  lowStockText: {
    fontSize: 12,
    color: ConstructionTheme.colors.warning,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  emptyText: {
    textAlign: 'center',
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
  },
  closeButton: {
    fontSize: 24,
    color: ConstructionTheme.colors.onSurface,
    padding: ConstructionTheme.spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: ConstructionTheme.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
    paddingTop: ConstructionTheme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
  },
  returnModal: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  returnToolName: {
    fontSize: 16,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  returnWorkerName: {
    fontSize: 14,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.md,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  modalInfoText: {
    fontSize: 14,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  helperText: {
    fontSize: 12,
    color: ConstructionTheme.colors.info,
    fontStyle: 'italic',
    marginTop: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  toolLogName: {
    fontSize: 16,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  toolLogDetail: {
    fontSize: 14,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  toolLogSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
    marginTop: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  historyItem: {
    marginLeft: ConstructionTheme.spacing.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  historyText: {
    fontSize: 12,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  historyStatus: {
    fontSize: 11,
    color: ConstructionTheme.colors.info,
    marginLeft: ConstructionTheme.spacing.md,
  },
});

export default MaterialsToolsScreen;