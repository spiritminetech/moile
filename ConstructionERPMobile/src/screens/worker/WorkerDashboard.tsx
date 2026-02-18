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
import WorkInstructionsCard from '../../components/dashboard/WorkInstructionsCard';
import { 
  LoadingOverlay, 
  ConstructionButton, 
  ConstructionCard,
  ErrorDisplay
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { useErrorHandler } from '../../hooks/useErrorHandler';

// Mock data for work instructions - in real app, this would come from API
const mockWorkInstructions = [
  {
    id: 1,
    type: 'work_instruction' as const,
    title: 'Report to Project A – Tower B, Level 5',
    message: 'Today you are assigned to work on Tower B, Level 5. Please report to the site supervisor upon arrival and collect your safety equipment from the storage room. Your tasks include concrete pouring and rebar installation. Work area is Section C-5.',
    priority: 'high' as const,
    timestamp: new Date().toISOString(),
    isRead: false,
    source: 'admin' as const,
    sourceName: 'Project Manager',
  },
  {
    id: 2,
    type: 'transport_instruction' as const,
    title: 'Use company transport – Bus No. 3',
    message: 'Company transport is available today. Please board Bus No. 3 at the designated pickup point at 7:30 AM. The bus will depart promptly from Main Gate. Driver: Ahmad (Contact: +65-9876-5432). Return trip at 6:00 PM from the same location.',
    priority: 'medium' as const,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    isRead: false,
    source: 'manager' as const,
    sourceName: 'Transport Coordinator',
  },
  {
    id: 3,
    type: 'safety_message' as const,
    title: 'Mandatory Safety Briefing at 8:00 AM',
    message: 'All workers must attend the safety briefing at 8:00 AM in the main assembly area. Topics will include new safety protocols, emergency procedures, and proper use of fall protection equipment. Attendance is mandatory and will be recorded.',
    priority: 'critical' as const,
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    isRead: true,
    source: 'supervisor' as const,
    sourceName: 'Safety Officer',
  },
  {
    id: 4,
    type: 'supervisor_instruction' as const,
    title: 'Overtime approved till 7:00 PM',
    message: 'Your overtime request has been approved. You may work until 7:00 PM today to complete the concrete pouring task. Please ensure all safety protocols are followed during extended hours. Additional meal allowance will be provided.',
    priority: 'medium' as const,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: false,
    source: 'supervisor' as const,
    sourceName: 'Site Supervisor',
  },
  {
    id: 5,
    type: 'warning' as const,
    title: 'Weather Alert - Heavy Rain Expected',
    message: 'Heavy rain is expected between 2:00 PM - 4:00 PM today. All outdoor work must be suspended during this period. Please move to covered areas and secure all equipment. Work will resume once weather conditions improve.',
    priority: 'critical' as const,
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    isRead: false,
    source: 'system' as const,
    sourceName: 'Weather Monitoring System',
  },
  {
    id: 6,
    type: 'reminder' as const,
    title: 'Tomorrow assigned to new site',
    message: 'Please note that tomorrow you will be assigned to a different construction site: Marina Bay Project, Block D. Report to Site Office at 7:45 AM. New site supervisor: Mr. Lim Wei Ming. Check your dashboard tomorrow morning for detailed location and parking instructions.',
    priority: 'low' as const,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    isRead: true,
    source: 'system' as const,
    sourceName: 'Scheduling System',
  },
  {
    id: 7,
    type: 'safety_message' as const,
    title: 'New PPE Requirements Effective Today',
    message: 'New personal protective equipment requirements are now in effect. All workers must wear high-visibility vests, safety helmets with chin straps, and steel-toed boots. Safety glasses are mandatory in all work areas. Non-compliance will result in immediate removal from site.',
    priority: 'high' as const,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    isRead: false,
    source: 'admin' as const,
    sourceName: 'Safety Department',
  },
  {
    id: 8,
    type: 'transport_instruction' as const,
    title: 'Parking Instructions for Private Vehicles',
    message: 'If using private transport, please park in designated Area C (Yellow Zone). Parking passes are available at the security gate. Show your employee ID for verification. Parking fee: $5/day (deductible from salary). No parking allowed in visitor areas.',
    priority: 'low' as const,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isRead: true,
    source: 'manager' as const,
    sourceName: 'Site Administrator',
  },
];

const WorkerDashboard: React.FC = () => {
  const { state, logout } = useAuth();
  const { data, isLoading, error, refreshData, lastRefresh, isRefreshing } = useDashboard();
  const navigation = useNavigation();
  const { handleError, clearError } = useErrorHandler();

  // Get time-based greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  // Get employee ID - format as W-XXXX
  const getEmployeeId = (): string => {
    // Try to get employee ID from user object or format user ID
    const userId = state.user?.id;
    if (!userId) return 'N/A';
    
    // Format as W-XXXX (e.g., W-0107 for user ID 107)
    return `W-${userId.toString().padStart(4, '0')}`;
  };

  // Format current date with day of week
  const getCurrentDateFormatted = (): string => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
  };

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

  const handleMarkInstructionAsRead = (instructionId: number) => {
    // In real app, this would call an API to mark instruction as read
    console.log('Marking instruction as read:', instructionId);
  };

  const handleViewAllInstructions = () => {
    // Navigate to full instructions screen
    navigation.navigate('Instructions' as never);
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
          variant="elevated"
          style={styles.welcomeCard}
          padding="large"
        >
          <View style={styles.welcomeCardContent}>
            <View style={styles.greetingRow}>
              <Text style={styles.emojiIcon}>👷</Text>
              <View style={styles.greetingTextContainer}>
                <Text style={styles.greetingText}>
                  {getGreeting()}
                </Text>
                <Text style={styles.workerNameText}>
                  {(state.user?.name || 'WORKER').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee ID:</Text>
              <Text style={styles.infoValue}>{getEmployeeId()}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Today:</Text>
              <Text style={styles.infoValue}>{getCurrentDateFormatted()}</Text>
            </View>
          </View>
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

        <WorkInstructionsCard
          instructions={mockWorkInstructions}
          isLoading={isLoading}
          onMarkAsRead={handleMarkInstructionAsRead}
          onViewAll={handleViewAllInstructions}
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
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderLeftWidth: 6,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  welcomeCardContent: {
    gap: ConstructionTheme.spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ConstructionTheme.spacing.md,
  },
  emojiIcon: {
    fontSize: 48,
    lineHeight: 56,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 14,
    marginBottom: 4,
  },
  workerNameText: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: ConstructionTheme.colors.outline,
    opacity: 0.3,
    marginVertical: ConstructionTheme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xs,
  },
  infoLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    opacity: 0.8,
    fontWeight: '500',
  },
  infoValue: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '700',
    fontSize: 16,
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