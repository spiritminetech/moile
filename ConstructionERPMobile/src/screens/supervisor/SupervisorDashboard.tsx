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
  Animated,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../../store/context/AuthContext';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { SupervisorDashboardResponse } from '../../types';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

// Cache configuration
const CACHE_KEY = 'supervisor_dashboard_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Import supervisor dashboard components
import WorkforceMetricsCard from '../../components/supervisor/WorkforceMetricsCard';
import TaskMetricsCard from '../../components/supervisor/TaskMetricsCard';
import TeamManagementCard from '../../components/supervisor/TeamManagementCard';
import AttendanceMonitorCard from '../../components/supervisor/AttendanceMonitorCard';
import ApprovalQueueCard from '../../components/supervisor/ApprovalQueueCard';

interface SupervisorDashboardProps {
  navigation?: any;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ navigation }) => {
  const { state: authState, logout } = useAuth();
  const { state: supervisorState, clearError } = useSupervisorContext();
  
  // Local state for dashboard data
  const [dashboardData, setDashboardData] = useState<SupervisorDashboardResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loadedCards, setLoadedCards] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  
  // Animation values for progressive loading
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  // Load cached data first for instant display
  const loadCachedData = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
          console.log('📦 Loading from cache (age:', Math.round(age / 1000), 'seconds)');
          setDashboardData(data);
          setLastRefresh(new Date(timestamp));
          setIsLoading(false);
          
          // Animate fade-in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          
          return true;
        }
      }
    } catch (error) {
      console.error('Cache load error:', error);
    }
    return false;
  }, [fadeAnim]);

  // Save data to cache
  const saveCacheData = useCallback(async (data: SupervisorDashboardResponse) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
      console.log('💾 Dashboard data cached successfully');
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }, []);

  // Load dashboard data using SINGLE API call (optimized)
  const loadDashboardData = useCallback(async (skipCache = false) => {
    try {
      setError(null);
      clearError();
      
      // Load from cache first if not skipping
      if (!skipCache) {
        const cacheLoaded = await loadCachedData();
        if (cacheLoaded && !isRefreshing) {
          // Continue to fetch fresh data in background
          console.log('🔄 Fetching fresh data in background...');
        }
      }
      
      console.log('📊 Loading supervisor dashboard data (single API call)...');
      
      // OPTIMIZED: Single API call instead of N+1 queries
      const response = await supervisorApiService.getDashboardData();
      
      if (response.success && response.data) {
        console.log('✅ Dashboard data loaded successfully:', {
          projects: response.data.projects?.length || 0,
          totalWorkers: response.data.teamOverview?.totalMembers || 0,
          totalTasks: response.data.taskMetrics?.totalTasks || 0,
          alerts: response.data.alerts?.length || 0,
        });
        
        setDashboardData(response.data);
        setLastRefresh(new Date());
        
        // Save to cache
        await saveCacheData(response.data);
        
        // Haptic feedback on successful load
        if (isRefreshing) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Progressive card loading animation
        setLoadedCards(0);
        const cardInterval = setInterval(() => {
          setLoadedCards(prev => {
            if (prev >= 4) {
              clearInterval(cardInterval);
              return 4;
            }
            return prev + 1;
          });
        }, 100);
        
      } else {
        const errorMsg = response.errors?.[0] || 'Failed to load dashboard data';
        console.error('❌ Dashboard data loading failed:', errorMsg);
        setError(errorMsg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error('❌ Dashboard data loading error:', error);
      setError(error.message || 'An error occurred while loading dashboard');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [clearError, loadCachedData, saveCacheData, isRefreshing]);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      
      if (offline) {
        console.log('📡 Device is offline - using cached data');
      } else {
        console.log('📡 Device is online');
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Smart auto-refresh: only when app is active and online
  useEffect(() => {
    if (isOffline) {
      console.log('⏸️ Auto-refresh paused (offline)');
      return;
    }
    
    const interval = setInterval(() => {
      if (!isOffline && !isRefreshing) {
        console.log('🔄 Auto-refreshing dashboard...');
        loadDashboardData();
      }
    }, 60000); // 60 seconds (reduced frequency)

    return () => clearInterval(interval);
  }, [loadDashboardData, isOffline, isRefreshing]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await loadDashboardData(true); // Skip cache on manual refresh
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDashboardData]);

  // Navigation handlers with haptic feedback
  const handleViewTeamDetails = useCallback((projectId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (projectId === 0) {
      navigation.navigate('Team', { screen: 'TeamMain' });
    } else {
      navigation.navigate('Team', { 
        screen: 'TeamMain', 
        params: { projectId } 
      });
    }
  }, [navigation]);

  const handleViewAttendanceDetails = useCallback((projectId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate('Team', { 
      screen: 'AttendanceMonitoring',
      params: { projectId } 
    });
  }, [navigation]);

  const handleViewApproval = useCallback((approvalType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate('Approvals', { approvalType });
  }, [navigation]);

  const handleQuickApprove = useCallback((approvalType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation?.navigate('Approvals', { approvalType, quickApprove: true });
  }, [navigation]);

  const handleViewAllApprovals = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate('Approvals');
  }, [navigation]);

  const handleResolveAlert = useCallback(async (alertId: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // TODO: Call API to resolve alert
      console.log('Resolving alert:', alertId);
      
      // Simulate success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Refresh dashboard to update alerts
      await loadDashboardData();
    } catch (error) {
      console.error('Error resolving alert:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [loadDashboardData]);

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

  // Skeleton loading component
  const SkeletonCard = () => (
    <View style={[styles.skeletonCard, highContrast && styles.highContrastCard]}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </View>
  );

  // Show skeleton loading during initial load
  if (isLoading && !dashboardData) {
    return (
      <SafeAreaView style={[styles.container, highContrast && styles.highContrastBg]}>
        <StatusBar barStyle="light-content" backgroundColor={ConstructionTheme.colors.primary} />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Supervisor Dashboard</Text>
            <Text style={styles.lastRefreshText}>Loading...</Text>
          </View>
        </View>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.welcomeSection}>
            <View style={[styles.skeletonTitle, { width: '70%' }]} />
            <View style={[styles.skeletonLine, { width: '50%', marginTop: 8 }]} />
          </View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, highContrast && styles.highContrastBg]}>
      <StatusBar barStyle="light-content" backgroundColor={ConstructionTheme.colors.primary} />
      
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📡 Offline Mode - Showing cached data</Text>
        </View>
      )}
      
      {/* Header with real-time status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Supervisor Dashboard</Text>
          {lastRefresh && (
            <Text style={styles.lastRefreshText}>
              {isOffline ? '📦 Cached: ' : 'Last updated: '}
              {lastRefresh.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.contrastButton} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHighContrast(!highContrast);
            }}
            accessible={true}
            accessibilityLabel="Toggle high contrast mode"
            accessibilityRole="button"
          >
            <Text style={styles.contrastButtonText}>{highContrast ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            accessible={true}
            accessibilityLabel="Logout"
            accessibilityRole="button"
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
        {/* Welcome Section - Simplified */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {authState.user?.name || 'Supervisor'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {authState.company?.name || 'Construction Site'} • {authState.user?.role || 'Supervisor'}
          </Text>
        </View>

        {/* Error Display */}
        {(error || supervisorState.error) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || supervisorState.error}</Text>
            <TouchableOpacity onPress={() => { setError(null); clearError(); }} style={styles.errorDismiss}>
              <Text style={styles.errorDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dashboard Cards - As Per Menu Specification */}
        {dashboardData && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Card 1: Assigned Projects */}
            {loadedCards >= 1 && (
              <TeamManagementCard
                projects={dashboardData.projects || []}
                isLoading={false}
                onViewTeamDetails={handleViewTeamDetails}
                highContrast={highContrast}
              />
            )}

            {/* Card 2: Today's Workforce Count */}
            {loadedCards >= 2 && (
              <WorkforceMetricsCard
                teamOverview={dashboardData.teamOverview}
                attendanceMetrics={dashboardData.attendanceMetrics}
                isLoading={false}
                highContrast={highContrast}
              />
            )}

            {/* Card 3: Attendance Summary + Alerts (Geo-fence, Absence) */}
            {loadedCards >= 3 && (
              <AttendanceMonitorCard
                projects={dashboardData.projects || []}
                alerts={dashboardData.alerts || []}
                workerDetails={dashboardData.workerAttendanceDetails || []}
                isLoading={false}
                onViewAttendanceDetails={handleViewAttendanceDetails}
                onResolveAlert={handleResolveAlert}
                highContrast={highContrast}
              />
            )}

            {/* Card 4: Pending Approvals */}
            {loadedCards >= 4 && (
              <ApprovalQueueCard
                pendingApprovals={dashboardData.pendingApprovals}
                isLoading={false}
                onViewApproval={handleViewApproval}
                onQuickApprove={handleQuickApprove}
                onViewAllApprovals={handleViewAllApprovals}
                highContrast={highContrast}
              />
            )}
          </Animated.View>
        )}

        {/* Priority Alerts Section */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.alertsSectionTitle}>Priority Alerts</Text>
            {dashboardData.alerts
              .filter(alert => alert.priority === 'critical' || alert.priority === 'high')
              .slice(0, 3)
              .map((alert, index) => (
                <TouchableOpacity
                  key={`dashboard-alert-${alert.id}-${index}`}
                  style={[styles.alertItem, alert.priority === 'critical' ? styles.alert_critical : alert.priority === 'high' ? styles.alert_high : styles.alert_medium]}
                  onPress={() => handleResolveAlert(typeof alert.id === 'number' ? alert.id : parseInt(String(alert.id)))}
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
                      {(alert.priority || 'normal').toUpperCase()}
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation?.navigate('IssueEscalation');
            }}
          >
            <Text style={styles.quickActionIcon}>🚨</Text>
            <Text style={styles.quickActionText}>Escalate Issue</Text>
          </TouchableOpacity>
          
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  highContrastBg: {
    backgroundColor: '#000000',
  },
  highContrastCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  offlineBanner: {
    backgroundColor: '#FFA726',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skeletonCard: {
    backgroundColor: ConstructionTheme.colors.surface,
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.lg,
    borderRadius: ConstructionTheme.borderRadius.md,
    ...ConstructionTheme.shadows.small,
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 8,
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
    paddingTop: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primary,
    ...ConstructionTheme.shadows.medium,
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  contrastButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contrastButtonText: {
    fontSize: 20,
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
    marginBottom: ConstructionTheme.spacing.sm,
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