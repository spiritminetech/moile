import React, { useEffect, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { SupervisorDashboardResponse } from '../../types';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

// Import supervisor dashboard components
import TeamManagementCard from '../../components/supervisor/TeamManagementCard';
import AttendanceMonitorCard from '../../components/supervisor/AttendanceMonitorCard';
import TaskAssignmentCard from '../../components/supervisor/TaskAssignmentCard';
import ApprovalQueueCard from '../../components/supervisor/ApprovalQueueCard';
import ProgressReportCard from '../../components/supervisor/ProgressReportCard';

interface SupervisorDashboardProps {
  navigation?: any;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ navigation }) => {
  const { state: authState, logout } = useAuth();
  const { state: supervisorState, refreshAllData, clearError } = useSupervisorContext();
  
  // Local state for dashboard data
  const [dashboardData, setDashboardData] = useState<SupervisorDashboardResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      clearError();
      const response = await supervisorApiService.getDashboardData();
      
      if (response.success && response.data) {
        setDashboardData(response.data);
        setLastRefresh(new Date());
      } else {
        console.error('Failed to load dashboard data:', response.errors);
      }
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    }
  }, [clearError]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadDashboardData(),
        refreshAllData()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDashboardData, refreshAllData]);

  // Navigation handlers
  const handleViewTeamDetails = useCallback((projectId: number) => {
    // TODO: Navigate to team management screen
    console.log('Navigate to team details for project:', projectId);
  }, []);

  const handleViewAttendanceDetails = useCallback((projectId: number) => {
    // TODO: Navigate to attendance monitoring screen
    console.log('Navigate to attendance details for project:', projectId);
  }, []);

  const handleViewTaskDetails = useCallback((projectId: number) => {
    // TODO: Navigate to task assignment screen
    console.log('Navigate to task details for project:', projectId);
  }, []);

  const handleCreateTask = useCallback(() => {
    // TODO: Navigate to task creation screen
    console.log('Navigate to task creation');
  }, []);

  const handleAssignTask = useCallback((projectId: number) => {
    // TODO: Navigate to task assignment screen
    console.log('Navigate to task assignment for project:', projectId);
  }, []);

  const handleViewApproval = useCallback((approvalType: string) => {
    // TODO: Navigate to specific approval type screen
    console.log('Navigate to approval type:', approvalType);
  }, []);

  const handleQuickApprove = useCallback((approvalType: string) => {
    // TODO: Show quick approval modal
    console.log('Quick approve for type:', approvalType);
  }, []);

  const handleViewAllApprovals = useCallback(() => {
    // Navigate to Approvals tab
    navigation?.navigate('Approvals');
  }, [navigation]);

  const handleViewProgressDetails = useCallback((projectId: number) => {
    // TODO: Navigate to progress details screen
    console.log('Navigate to progress details for project:', projectId);
  }, []);

  const handleCreateReport = useCallback(() => {
    // Navigate to Reports tab which contains the ProgressReportScreen
    navigation?.navigate('Reports');
  }, [navigation]);

  const handleViewReports = useCallback(() => {
    // Navigate to Reports tab which contains the ProgressReportScreen
    navigation?.navigate('Reports');
  }, [navigation]);

  const handleResolveAlert = useCallback((alertId: number) => {
    // TODO: Handle alert resolution
    console.log('Resolve alert:', alertId);
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  // Show loading state during initial load
  if (!dashboardData && supervisorState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ConstructionTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading supervisor dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with real-time status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Supervisor Dashboard</Text>
          {lastRefresh && (
            <Text style={styles.lastRefreshText}>
              Last updated: {lastRefresh.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ConstructionTheme.colors.primary]}
            tintColor={ConstructionTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {authState.user?.name || 'Supervisor'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {authState.company?.name || 'Construction Site'} • {authState.user?.role || 'Supervisor'}
          </Text>
        </View>

        {/* Error Display */}
        {supervisorState.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{supervisorState.error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
              <Text style={styles.errorDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dashboard Cards */}
        {dashboardData && (
          <>
            {/* Team Management Card */}
            <TeamManagementCard
              projects={dashboardData.projects}
              isLoading={supervisorState.teamLoading}
              onViewTeamDetails={handleViewTeamDetails}
            />

            {/* Attendance Monitor Card */}
            <AttendanceMonitorCard
              projects={dashboardData.projects}
              alerts={dashboardData.alerts}
              isLoading={supervisorState.teamLoading}
              onViewAttendanceDetails={handleViewAttendanceDetails}
              onResolveAlert={handleResolveAlert}
            />

            {/* Task Assignment Card */}
            <TaskAssignmentCard
              projects={dashboardData.projects}
              isLoading={supervisorState.isLoading}
              onCreateTask={handleCreateTask}
              onViewTaskDetails={handleViewTaskDetails}
              onAssignTask={handleAssignTask}
            />

            {/* Approval Queue Card */}
            <ApprovalQueueCard
              pendingApprovals={dashboardData.pendingApprovals}
              isLoading={supervisorState.approvalsLoading}
              onViewApproval={handleViewApproval}
              onQuickApprove={handleQuickApprove}
              onViewAllApprovals={handleViewAllApprovals}
            />

            {/* Progress Report Card */}
            <ProgressReportCard
              projects={dashboardData.projects}
              alerts={dashboardData.alerts}
              isLoading={supervisorState.reportsLoading}
              onViewProgressDetails={handleViewProgressDetails}
              onCreateReport={handleCreateReport}
              onViewReports={handleViewReports}
            />
          </>
        )}

        {/* Priority Alerts Section */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.alertsSectionTitle}>Priority Alerts</Text>
            {dashboardData.alerts
              .filter(alert => alert.priority === 'critical' || alert.priority === 'high')
              .slice(0, 3)
              .map((alert) => (
                <TouchableOpacity
                  key={alert.id}
                  style={[styles.alertItem, styles[`alert_${alert.priority}`]]}
                  onPress={() => handleResolveAlert(alert.id)}
                >
                  <View style={styles.alertContent}>
                    <Text style={styles.alertType}>
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.alertPriorityBadge}>
                    <Text style={styles.alertPriorityText}>
                      {alert.priority.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Quick Actions Footer */}
        <View style={styles.quickActionsFooter}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <Text style={styles.quickActionIcon}>🔄</Text>
            <Text style={styles.quickActionText}>
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
  },
  logoutButtonText: {
    ...ConstructionTheme.typography.buttonSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ConstructionTheme.spacing.xl,
  },
  welcomeSection: {
    backgroundColor: ConstructionTheme.colors.surface,
    marginHorizontal: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    padding: ConstructionTheme.spacing.lg,
    borderRadius: ConstructionTheme.borderRadius.md,
    ...ConstructionTheme.shadows.small,
  },
  welcomeTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  welcomeSubtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE', // Light red background for error
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: '#C62828', // Dark red text for error
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  errorDismiss: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    backgroundColor: ConstructionTheme.colors.error,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: 32,
    justifyContent: 'center',
  },
  errorDismissText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  alertsSection: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  alertsSectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.sm,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.shadows.small,
  },
  alert_critical: {
    backgroundColor: '#FFCDD2',
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
  },
  alert_high: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
  },
  alert_medium: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  alert_low: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.success,
  },
  alertContent: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  alertType: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alertMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alertTime: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  alertPriorityBadge: {
    backgroundColor: ConstructionTheme.colors.error,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: 28,
    justifyContent: 'center',
  },
  alertPriorityText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  quickActionsFooter: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingVertical: ConstructionTheme.spacing.md,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    ...ConstructionTheme.shadows.small,
  },
  quickActionIcon: {
    fontSize: 18,
    marginRight: ConstructionTheme.spacing.sm,
  },
  quickActionText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
});

export default SupervisorDashboard;