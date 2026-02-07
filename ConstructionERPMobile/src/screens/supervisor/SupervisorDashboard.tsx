import React, { useEffect, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  Dimensions 
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
      
      // Get projects data
      const projectsResponse = await supervisorApiService.getSupervisorProjects();
      
      if (projectsResponse.success && projectsResponse.data) {
        // Get pending approvals summary (parallel with projects)
        const approvalsPromise = supervisorApiService.getPendingApprovalsSummary();
        
        // Transform projects data to match dashboard format
        const projects = await Promise.all(
          projectsResponse.data.map(async (project: any) => {
            // Get attendance data for this project
            const attendanceResponse = await supervisorApiService.getAttendanceMonitoring({
              projectId: project.id.toString(),
              date: new Date().toISOString().split('T')[0]
            });

            // Get workers assigned (workforce count)
            const workersResponse = await supervisorApiService.getWorkersAssigned({
              projectId: project.id.toString(),
              date: new Date().toISOString().split('T')[0]
            });

            // Get late/absent workers alerts
            const lateAbsentResponse = await supervisorApiService.getLateAbsentWorkers({
              projectId: project.id.toString(),
              date: new Date().toISOString().split('T')[0]
            });

            // Get geofence violations
            const geofenceResponse = await supervisorApiService.getGeofenceViolations({
              projectId: project.id.toString(),
              timeRange: 'today'
            });

            // Get task progress data
            const tasksResponse = await supervisorApiService.getActiveTasks(project.id);

            let attendanceSummary = {
              present: 0,
              absent: 0,
              late: 0,
              total: 0
            };

            let workforceCount = 0;

            // Use workers-assigned endpoint for workforce count
            if (workersResponse.success && workersResponse.data?.workers) {
              workforceCount = workersResponse.data.workers.length;
            }

            // Use attendance monitoring for attendance summary
            if (attendanceResponse.success && attendanceResponse.data?.workers) {
              const workers = attendanceResponse.data.workers;
              
              attendanceSummary = {
                present: workers.filter((w: any) => w.status === 'CHECKED_IN').length,
                absent: workers.filter((w: any) => w.status === 'ABSENT').length,
                late: workers.filter((w: any) => w.isLate).length,
                total: workers.length
              };
            }

            // Combine alerts from late/absent workers and geofence violations
            const projectAlerts = [];
            
            if (lateAbsentResponse.success && lateAbsentResponse.data) {
              const { lateWorkers = [], absentWorkers = [] } = lateAbsentResponse.data;
              
              // Add late worker alerts
              lateWorkers.forEach((worker: any) => {
                projectAlerts.push({
                  id: `late-${worker.employeeId}-${project.id}`,
                  type: 'attendance',
                  priority: 'medium',
                  message: `${worker.workerName} is late (${worker.minutesLate} min)`,
                  timestamp: new Date().toISOString(),
                  projectId: project.id
                });
              });

              // Add absent worker alerts
              absentWorkers.forEach((worker: any) => {
                projectAlerts.push({
                  id: `absent-${worker.employeeId}-${project.id}`,
                  type: 'attendance',
                  priority: 'high',
                  message: `${worker.workerName} is absent`,
                  timestamp: new Date().toISOString(),
                  projectId: project.id
                });
              });
            }

            // Add geofence violation alerts
            if (geofenceResponse.success && geofenceResponse.data?.violations) {
              geofenceResponse.data.violations.forEach((violation: any) => {
                projectAlerts.push({
                  id: `geofence-${violation.id}`,
                  type: 'geofence',
                  priority: violation.severity.toLowerCase(),
                  message: `${violation.workerName} outside geofence (${violation.distance}m away)`,
                  timestamp: violation.violationTime,
                  projectId: project.id
                });
              });
            }

            // Calculate progress summary (mock for now, TODO: implement real calculation)
            const progressSummary = {
              overallProgress: Math.floor(Math.random() * 100), // TODO: Calculate from actual task data
              completedTasks: 0,
              totalTasks: 0,
              onSchedule: true
            };

            return {
              id: project.id,
              name: project.projectName || project.name,
              location: project.location || 'Unknown',
              workforceCount,
              attendanceSummary,
              progressSummary,
              alerts: projectAlerts
            };
          })
        );

        // Wait for pending approvals summary
        const approvalsResponse = await approvalsPromise;
        
        let pendingApprovals = {
          leaveRequests: 0,
          materialRequests: 0,
          toolRequests: 0,
          urgent: 0,
          total: 0
        };

        // Update pending approvals from API response
        if (approvalsResponse.success && approvalsResponse.data?.summary) {
          const summary = approvalsResponse.data.summary;
          pendingApprovals = {
            leaveRequests: summary.byType.leave || 0,
            materialRequests: summary.byType.material || 0,
            toolRequests: summary.byType.tool || 0,
            urgent: summary.urgentCount || 0,
            total: summary.totalPending || 0
          };
        }

        // Collect all alerts from all projects
        const allAlerts = projects.flatMap(p => p.alerts || []);

        const dashboardData: SupervisorDashboardResponse = {
          projects,
          pendingApprovals,
          alerts: allAlerts
        };

        setDashboardData(dashboardData);
        setLastRefresh(new Date());
      } else {
        console.error('Failed to load dashboard data:', projectsResponse.errors);
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
    if (projectId === 0) {
      // Navigate to Team Management screen (view all teams)
      navigation.navigate('Team', { screen: 'TeamMain' });
    } else {
      // Navigate to specific project team details
      navigation.navigate('Team', { 
        screen: 'TeamMain', 
        params: { projectId } 
      });
    }
  }, [navigation]);

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
              projects={dashboardData.projects || []}
              isLoading={supervisorState.teamLoading}
              onViewTeamDetails={handleViewTeamDetails}
            />

            {/* Attendance Monitor Card */}
            <AttendanceMonitorCard
              projects={dashboardData.projects || []}
              alerts={dashboardData.alerts || []}
              isLoading={supervisorState.teamLoading}
              onViewAttendanceDetails={handleViewAttendanceDetails}
              onResolveAlert={handleResolveAlert}
            />

            {/* Task Assignment Card */}
            <TaskAssignmentCard
              projects={dashboardData.projects || []}
              isLoading={supervisorState.isLoading}
              onCreateTask={handleCreateTask}
              onViewTaskDetails={handleViewTaskDetails}
              onAssignTask={handleAssignTask}
            />

            {/* Approval Queue Card */}
            <ApprovalQueueCard
              pendingApprovals={dashboardData.pendingApprovals || {
                leaveRequests: 0,
                materialRequests: 0,
                toolRequests: 0,
                urgent: 0,
                total: 0
              }}
              isLoading={supervisorState.approvalsLoading}
              onViewApproval={handleViewApproval}
              onQuickApprove={handleQuickApprove}
              onViewAllApprovals={handleViewAllApprovals}
            />

            {/* Progress Report Card */}
            <ProgressReportCard
              projects={dashboardData.projects || []}
              alerts={dashboardData.alerts || []}
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