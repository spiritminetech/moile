import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../store/context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import ProjectInfoCard from '../../components/dashboard/ProjectInfoCard';
import AttendanceStatusCard from '../../components/dashboard/AttendanceStatusCard';
import CertificationAlertsCard from '../../components/dashboard/CertificationAlertsCard';
import { 
  LoadingOverlay, 
  ConstructionButton, 
  ConstructionCard,
  ErrorDisplay
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const WorkerDashboard: React.FC = () => {
  const { state, logout } = useAuth();
  const { data, isLoading, error, refreshData, lastRefresh, isRefreshing } = useDashboard();
  const navigation = useNavigation();
  const { handleError, clearError } = useErrorHandler();

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

  const handleRefresh = async () => {
    try {
      clearError();
      await refreshData();
    } catch (error) {
      if (error instanceof Error) {
        handleError(error, 'Dashboard Refresh');
      }
    }
  };

  const handleViewProfile = () => {
    // Navigate to profile screen
    navigation.navigate('Profile' as never);
  };

  const handleNavigateToTasks = () => {
    navigation.navigate('Tasks' as never);
  };

  const handleNavigateToAttendance = () => {
    navigation.navigate('Attendance' as never);
  };

  const handleNavigateToReports = () => {
    navigation.navigate('Report' as never);
  };

  const handleNavigateToRequests = () => {
    navigation.navigate('Requests' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Worker Dashboard</Text>
          {lastRefresh && (
            <Text style={styles.lastRefresh}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Text>
          )}
        </View>
        <ConstructionButton
          title="Logout"
          onPress={handleLogout}
          variant="error"
          size="small"
          style={styles.logoutButton}
        />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        <ConstructionCard
          title="Welcome back!"
          variant="default"
          style={styles.welcomeCard}
        >
          <Text style={styles.welcomeText}>
            Hello {state.user?.name || 'Worker'}
          </Text>
          <Text style={styles.companyText}>
            Company: {state.company?.name || 'N/A'}
          </Text>
          <Text style={styles.roleText}>
            Role: {state.user?.role || state.company?.role || 'Worker'}
          </Text>
        </ConstructionCard>

        {error && (
          <ErrorDisplay
            error={error}
            variant="card"
            onRetry={handleRefresh}
            onDismiss={clearError}
            title="Dashboard Error"
          />
        )}

        <CertificationAlertsCard 
          onViewProfile={handleViewProfile}
        />

        <ProjectInfoCard 
          project={data.project} 
          isLoading={isLoading} 
        />

        <AttendanceStatusCard 
          attendanceStatus={data.attendanceStatus}
          workingHours={data.workingHours}
          isLoading={isLoading}
        />

        {/* Daily Summary Card */}
        {data.dailySummary ? (
          <ConstructionCard
            title="Today's Progress"
            variant="default"
            style={styles.summaryCard}
          >
            {(data.dailySummary.totalTasks || 0) === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateTitle}>No Tasks Assigned Today</Text>
                <Text style={styles.emptyStateMessage}>
                  You don't have any tasks assigned for today. Check back later or contact your supervisor.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{data.dailySummary.totalTasks || 0}</Text>
                    <Text style={styles.summaryLabel}>Total Tasks</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{data.dailySummary.completedTasks || 0}</Text>
                    <Text style={styles.summaryLabel}>Completed</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{data.dailySummary.inProgressTasks || 0}</Text>
                    <Text style={styles.summaryLabel}>In Progress</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{data.dailySummary.overallProgress || 0}%</Text>
                    <Text style={styles.summaryLabel}>Progress</Text>
                  </View>
                </View>
                <View style={styles.hoursContainer}>
                  <Text style={styles.hoursText}>
                    Hours Worked: {data.dailySummary.totalHoursWorked || 0}h / Remaining: {data.dailySummary.remainingHours || 0}h
                  </Text>
                </View>
              </>
            )}
          </ConstructionCard>
        ) : null}

        {/* Tools and Materials Card */}
        {data.toolsAndMaterials && (
          <ConstructionCard
            title="Tools & Materials"
            variant="default"
            style={styles.resourcesCard}
          >
            {data.toolsAndMaterials.tools && data.toolsAndMaterials.tools.length > 0 && (
              <View style={styles.resourceSection}>
                <Text style={styles.resourceSectionTitle}>Tools</Text>
                {data.toolsAndMaterials.tools.map((tool) => (
                  <View key={tool.id} style={styles.resourceItem}>
                    <Text style={styles.resourceName}>{tool.name}</Text>
                    <Text style={styles.resourceDetails}>
                      {tool.quantity} {tool.unit} - {tool.location}
                    </Text>
                    <View style={[styles.statusIndicator, tool.allocated ? styles.allocated : styles.notAllocated]}>
                      <Text style={styles.statusText}>
                        {tool.allocated ? 'Allocated' : 'Not Allocated'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            {data.toolsAndMaterials.materials && data.toolsAndMaterials.materials.length > 0 && (
              <View style={styles.resourceSection}>
                <Text style={styles.resourceSectionTitle}>Materials</Text>
                {data.toolsAndMaterials.materials.map((material) => (
                  <View key={material.id} style={styles.resourceItem}>
                    <Text style={styles.resourceName}>{material.name}</Text>
                    <Text style={styles.resourceDetails}>
                      {material.allocated}/{material.quantity} {material.unit} - {material.location}
                    </Text>
                    <Text style={styles.resourceUsage}>
                      Used: {material.used} | Remaining: {material.remaining}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {(!data.toolsAndMaterials.tools || data.toolsAndMaterials.tools.length === 0) && 
             (!data.toolsAndMaterials.materials || data.toolsAndMaterials.materials.length === 0) && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>🔧</Text>
                <Text style={styles.emptyStateTitle}>No Tools or Materials Assigned</Text>
                <Text style={styles.emptyStateMessage}>
                  No tools or materials have been allocated for today's work.
                </Text>
              </View>
            )}
          </ConstructionCard>
        )}

        {/* Notifications removed - notification features not needed */}

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToTasks}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Today's Tasks</Text>
            <Text style={styles.actionSubtitle}>
              {(data.todaysTasks && data.todaysTasks.length > 0)
                ? `${data.todaysTasks.length} tasks assigned`
                : 'No tasks assigned today'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToAttendance}>
            <Text style={styles.actionIcon}>⏰</Text>
            <Text style={styles.actionTitle}>Clock In/Out</Text>
            <Text style={styles.actionSubtitle}>Track attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToReports}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Daily Report</Text>
            <Text style={styles.actionSubtitle}>Submit work progress</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToRequests}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionTitle}>Requests</Text>
            <Text style={styles.actionSubtitle}>Leave, materials, etc.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay 
        visible={isLoading && !lastRefresh} 
        message="Loading dashboard data..." 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: ConstructionTheme.spacing.lg,
    paddingTop: 50,
    backgroundColor: ConstructionTheme.colors.primary,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...ConstructionTheme.typography.displaySmall,
    color: ConstructionTheme.colors.onPrimary,
    marginBottom: 4,
  },
  lastRefresh: {
    ...ConstructionTheme.typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  logoutButton: {
    marginLeft: ConstructionTheme.spacing.md,
  },
  content: {
    flex: 1,
    padding: ConstructionTheme.spacing.lg,
  },
  welcomeCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  welcomeText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  companyText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  roleText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  errorCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  errorText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.error,
    marginBottom: ConstructionTheme.spacing.md,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  actionCard: {
    backgroundColor: ConstructionTheme.colors.surface,
    width: '48%',
    padding: ConstructionTheme.spacing.lg,
    borderRadius: ConstructionTheme.borderRadius.md,
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
    minHeight: ConstructionTheme.spacing.touchTarget * 2,
    ...ConstructionTheme.shadows.medium,
  },
  actionIcon: {
    fontSize: ConstructionTheme.dimensions.iconExtraLarge,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  actionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  summaryValue: {
    ...ConstructionTheme.typography.displaySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  summaryLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  hoursContainer: {
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
    paddingTop: ConstructionTheme.spacing.sm,
  },
  hoursText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  resourcesCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  resourceSection: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  resourceSectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: 'bold',
  },
  resourceItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  resourceName: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resourceDetails: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  resourceUsage: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  allocated: {
    backgroundColor: '#E8F5E8',
  },
  notAllocated: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: ConstructionTheme.spacing.md,
  },
  emptyStateTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
});

export default WorkerDashboard;