// Team Management Screen - Supervisor role-specific screen for managing team members
// Requirements: 3.1, 3.2, 3.3

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
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { TeamMember, TaskAssignment } from '../../types';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import {
  ConstructionCard,
  ConstructionButton,
  ConstructionInput,
  ConstructionSelector,
  LoadingOverlay,
  ErrorDisplay,
} from '../../components/common';

// Filter and sort options
type AttendanceFilter = 'all' | 'present' | 'absent' | 'late' | 'on_break';
type SortOption = 'name' | 'status' | 'task_progress' | 'last_updated';

interface TeamManagementScreenProps {
  navigation?: any; // Navigation prop for future use
}

const TeamManagementScreen: React.FC<TeamManagementScreenProps> = ({ navigation }) => {
  const { state: supervisorState, refreshTeamMembers, updateTeamMemberStatus, clearError } = useSupervisorContext();
  
  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [loadingMemberDetails, setLoadingMemberDetails] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [communicationMessage, setCommunicationMessage] = useState('');
  const [communicationType, setCommunicationType] = useState<'message' | 'notification' | 'alert'>('message');

  // Filter and sort team members
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = supervisorState.teamMembers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        (member.currentTask?.name.toLowerCase().includes(query))
      );
    }

    // Apply attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(member => member.attendanceStatus === attendanceFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.attendanceStatus.localeCompare(b.attendanceStatus);
        case 'task_progress':
          const aProgress = a.currentTask?.progress || 0;
          const bProgress = b.currentTask?.progress || 0;
          return bProgress - aProgress; // Descending order
        case 'last_updated':
          return new Date(b.location.lastUpdated).getTime() - new Date(a.location.lastUpdated).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [supervisorState.teamMembers, searchQuery, attendanceFilter, sortBy]);

  // Get team summary statistics
  const teamSummary = useMemo(() => {
    const total = supervisorState.teamMembers.length;
    const present = supervisorState.teamMembers.filter(m => m.attendanceStatus === 'present').length;
    const absent = supervisorState.teamMembers.filter(m => m.attendanceStatus === 'absent').length;
    const late = supervisorState.teamMembers.filter(m => m.attendanceStatus === 'late').length;
    const onBreak = supervisorState.teamMembers.filter(m => m.attendanceStatus === 'on_break').length;
    const withTasks = supervisorState.teamMembers.filter(m => m.currentTask).length;
    const geofenceViolations = supervisorState.teamMembers.filter(m => !m.location.insideGeofence).length;

    return {
      total,
      present,
      absent,
      late,
      onBreak,
      withTasks,
      geofenceViolations,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [supervisorState.teamMembers]);

  // Get project-based team summary for display
  const projectTeamSummary = useMemo(() => {
    const projectMap = new Map();
    
    // Group team members by project
    supervisorState.teamMembers.forEach(member => {
      // Find the project this member belongs to
      const project = supervisorState.assignedProjects.find(p => {
        // For now, we'll assign members to projects based on some logic
        // TODO: This should come from the backend API
        return true; // Assign all members to first project for now
      });
      
      if (project) {
        if (!projectMap.has(project.id)) {
          projectMap.set(project.id, {
            project,
            members: [],
            summary: {
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
              onBreak: 0,
              progress: 0
            }
          });
        }
        
        const projectData = projectMap.get(project.id);
        projectData.members.push(member);
        projectData.summary.total++;
        
        switch (member.attendanceStatus) {
          case 'present':
            projectData.summary.present++;
            break;
          case 'absent':
            projectData.summary.absent++;
            break;
          case 'late':
            projectData.summary.late++;
            break;
          case 'on_break':
            projectData.summary.onBreak++;
            break;
        }
        
        // Calculate average task progress for the project
        const membersWithTasks = projectData.members.filter((m: TeamMember) => m.currentTask);
        if (membersWithTasks.length > 0) {
          const totalProgress = membersWithTasks.reduce((sum: number, m: TeamMember) => sum + (m.currentTask?.progress || 0), 0);
          projectData.summary.progress = Math.round(totalProgress / membersWithTasks.length);
        }
      }
    });
    
    return Array.from(projectMap.values());
  }, [supervisorState.teamMembers, supervisorState.assignedProjects]);

  // Load member details when selected
  const loadMemberDetails = useCallback(async (member: TeamMember) => {
    try {
      setLoadingMemberDetails(true);
      const response = await supervisorApiService.getWorkerDetails(member.id);
      
      if (response.success && response.data) {
        setMemberDetails(response.data);
      } else {
        Alert.alert('Error', 'Failed to load member details');
      }
    } catch (error) {
      console.error('Error loading member details:', error);
      Alert.alert('Error', 'Failed to load member details');
    } finally {
      setLoadingMemberDetails(false);
    }
  }, []);

  // Handle member selection
  const handleMemberPress = useCallback(async (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberDetail(true);
    await loadMemberDetails(member);
  }, [loadMemberDetails]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshTeamMembers();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshTeamMembers]);

  // Handle attendance status update
  const handleUpdateAttendanceStatus = useCallback(async (memberId: number, newStatus: TeamMember['attendanceStatus']) => {
    try {
      await updateTeamMemberStatus(memberId, newStatus);
      Alert.alert('Success', 'Attendance status updated successfully');
    } catch (error) {
      console.error('Error updating attendance status:', error);
      Alert.alert('Error', 'Failed to update attendance status');
    }
  }, [updateTeamMemberStatus]);

  // Handle task assignment (placeholder for future implementation)
  const handleAssignTask = useCallback((member: TeamMember) => {
    Alert.alert(
      'Assign Task',
      `Task assignment for ${member.name} will be implemented in the task assignment screen.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to Task Assignment', onPress: () => {
          // TODO: Navigate to task assignment screen
          console.log('Navigate to task assignment for member:', member.id);
        }}
      ]
    );
  }, []);

  // Handle team communication (enhanced implementation)
  const handleSendMessage = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setShowCommunicationModal(true);
    setCommunicationMessage('');
    setCommunicationType('message');
  }, []);

  // Send communication to team member
  const sendCommunication = useCallback(async () => {
    if (!selectedMember || !communicationMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      // TODO: Replace with actual API call when implemented
      console.log('Sending communication:', {
        memberId: selectedMember.id,
        type: communicationType,
        message: communicationMessage
      });

      Alert.alert(
        'Success',
        `${communicationType.charAt(0).toUpperCase() + communicationType.slice(1)} sent to ${selectedMember.name}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCommunicationModal(false);
              setCommunicationMessage('');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error sending communication:', error);
      Alert.alert('Error', 'Failed to send communication');
    }
  }, [selectedMember, communicationMessage, communicationType]);

  // Send notification to all team members
  const sendTeamNotification = useCallback(() => {
    Alert.alert(
      'Send Team Notification',
      'Send a notification to all team members?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // TODO: Implement team notification functionality
            Alert.alert('Success', 'Notification sent to all team members');
          }
        }
      ]
    );
  }, []);

  // Get status color
  const getStatusColor = (status: TeamMember['attendanceStatus']) => {
    switch (status) {
      case 'present':
        return ConstructionTheme.colors.success;
      case 'absent':
        return ConstructionTheme.colors.error;
      case 'late':
        return ConstructionTheme.colors.warning;
      case 'on_break':
        return ConstructionTheme.colors.info;
      default:
        return ConstructionTheme.colors.neutral;
    }
  };

  // Get status icon
  const getStatusIcon = (status: TeamMember['attendanceStatus']) => {
    switch (status) {
      case 'present':
        return '✅';
      case 'absent':
        return '❌';
      case 'late':
        return '⚠️';
      case 'on_break':
        return '☕';
      default:
        return '❓';
    }
  };

  // Show loading overlay during initial load
  if (supervisorState.teamLoading && supervisorState.teamMembers.length === 0) {
    return (
      <LoadingOverlay
        visible={true}
        message="Loading team members..."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={ConstructionTheme.colors.primary} barStyle="light-content" />
      <View style={styles.container}>
        {/* Header - Fixed at top */}
        <View style={styles.header}>
          <Text style={styles.title}>Team Management</Text>
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filtersButtonIcon}>⚙️</Text>
            <Text style={styles.filtersButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
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
          showsVerticalScrollIndicator={true}
          bounces={true}
          alwaysBounceVertical={false}
          nestedScrollEnabled={false}
          keyboardShouldPersistTaps="handled"
        >

        {/* Team Summary */}
        <ConstructionCard title="Team Summary" variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{teamSummary.total}</Text>
              <Text style={styles.summaryLabel}>Total Members</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: ConstructionTheme.colors.success }]}>
                {teamSummary.present}
              </Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: ConstructionTheme.colors.error }]}>
                {teamSummary.absent}
              </Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: ConstructionTheme.colors.warning }]}>
                {teamSummary.late}
              </Text>
              <Text style={styles.summaryLabel}>Late</Text>
            </View>
          </View>
          
          <View style={styles.summaryFooter}>
            <Text style={styles.attendanceRate}>
              Attendance Rate: {teamSummary.attendanceRate}%
            </Text>
            {teamSummary.geofenceViolations > 0 && (
              <Text style={styles.geofenceAlert}>
                ⚠️ {teamSummary.geofenceViolations} geofence violations
              </Text>
            )}
          </View>
        </ConstructionCard>

        {/* Attendance Monitoring Quick Access */}
        <ConstructionCard 
          title="📊 Attendance Monitoring" 
          variant="elevated" 
          style={styles.attendanceCard}
        >
          <View style={styles.attendanceCardContent}>
            <Text style={styles.attendanceDescription}>
              Monitor worker attendance, track late/absent workers, and review geofence violations in real-time
            </Text>
            
            {/* Alert Indicators */}
            {(teamSummary.late > 0 || teamSummary.absent > 0 || teamSummary.geofenceViolations > 0) && (
              <View style={styles.attendanceAlerts}>
                {teamSummary.late > 0 && (
                  <View style={[styles.alertBadge, styles.alertBadgeWarning]}>
                    <Text style={styles.alertIcon}>⚠️</Text>
                    <Text style={styles.alertText}>{teamSummary.late} Late</Text>
                  </View>
                )}
                {teamSummary.absent > 0 && (
                  <View style={[styles.alertBadge, styles.alertBadgeError]}>
                    <Text style={styles.alertIcon}>❌</Text>
                    <Text style={styles.alertText}>{teamSummary.absent} Absent</Text>
                  </View>
                )}
                {teamSummary.geofenceViolations > 0 && (
                  <View style={[styles.alertBadge, styles.alertBadgeError]}>
                    <Text style={styles.alertIcon}>📍</Text>
                    <Text style={styles.alertText}>{teamSummary.geofenceViolations} Violations</Text>
                  </View>
                )}
              </View>
            )}
            
            <ConstructionButton
              title="Open Attendance Monitoring"
              onPress={() => {
                if (navigation) {
                  navigation.navigate('AttendanceMonitoring', {
                    projectId: supervisorState.assignedProjects[0]?.id,
                    date: new Date().toISOString().split('T')[0]
                  });
                }
              }}
              variant="primary"
              size="large"
              style={styles.attendanceButton}
            />
          </View>
        </ConstructionCard>

        {/* Project-based Team Overview */}
        {projectTeamSummary.length > 0 && (
          <ConstructionCard title="Projects Overview" variant="elevated" style={styles.summaryCard}>
            {projectTeamSummary.map((projectData) => (
              <View key={projectData.project.id} style={styles.projectSummaryCard}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{projectData.project.name}</Text>
                  <Text style={styles.projectWorkerCount}>
                    {projectData.summary.total} workers
                  </Text>
                </View>
                
                <View style={styles.projectStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: ConstructionTheme.colors.success }]}>
                      {projectData.summary.present}
                    </Text>
                    <Text style={styles.statLabel}>Present</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: ConstructionTheme.colors.error }]}>
                      {projectData.summary.absent}
                    </Text>
                    <Text style={styles.statLabel}>Absent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: ConstructionTheme.colors.warning }]}>
                      {projectData.summary.late}
                    </Text>
                    <Text style={styles.statLabel}>Late</Text>
                  </View>
                </View>
                
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>
                    Progress: {projectData.summary.progress}%
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${projectData.summary.progress}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{projectData.summary.progress}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </ConstructionCard>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <ConstructionInput
            placeholder="Search team members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="🔍"
            style={styles.searchInput}
          />
        </View>

        {/* Error Display */}
        {supervisorState.error && (
          <ErrorDisplay
            error={supervisorState.error}
            onRetry={handleRefresh}
            onDismiss={clearError}
          />
        )}

        {/* Team Members List */}
        <View style={styles.membersList}>
        {filteredAndSortedMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateTitle}>No Team Members Found</Text>
            <Text style={styles.emptyStateMessage}>
              {searchQuery || attendanceFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No team members have been assigned yet'}
            </Text>
            <ConstructionButton
              title="Refresh"
              onPress={handleRefresh}
              variant="outline"
              size="medium"
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          <View style={styles.membersContainer}>
            {filteredAndSortedMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => handleMemberPress(member)}
                activeOpacity={0.7}
              >
                <ConstructionCard variant="default" padding="medium">
                  <View style={styles.memberCardHeader}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
                        {member.name}
                      </Text>
                      <Text style={styles.memberRole} numberOfLines={1} ellipsizeMode="tail">
                        {member.role}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <Text style={styles.statusIcon}>{getStatusIcon(member.attendanceStatus)}</Text>
                      <Text 
                        style={[styles.statusText, { color: getStatusColor(member.attendanceStatus) }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {(member.attendanceStatus || 'unknown').replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.memberCardContent}>
                    {/* Current Task */}
                    {member.currentTask ? (
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskLabel}>Current Task:</Text>
                        <Text style={styles.taskName} numberOfLines={2} ellipsizeMode="tail">
                          {member.currentTask.name}
                        </Text>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${member.currentTask.progress}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>{member.currentTask.progress}%</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.taskInfo}>
                        <Text style={styles.noTaskText} numberOfLines={1}>
                          No active task assigned
                        </Text>
                      </View>
                    )}

                    {/* Location Status */}
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>Location:</Text>
                      <View style={styles.locationStatus}>
                        <Text style={styles.locationIcon}>
                          {member.location.insideGeofence ? '📍' : '⚠️'}
                        </Text>
                        <Text 
                          style={[
                            styles.locationText,
                            { color: member.location.insideGeofence ? ConstructionTheme.colors.success : ConstructionTheme.colors.warning }
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {member.location.insideGeofence ? 'On Site' : 'Outside Geofence'}
                        </Text>
                      </View>
                      <Text style={styles.lastUpdated} numberOfLines={1}>
                        Updated: {new Date(member.location.lastUpdated).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Quick Actions */}
                  <View style={styles.quickActions}>
                    <TouchableOpacity
                      style={[styles.quickActionButton, styles.messageButton]}
                      onPress={() => handleSendMessage(member)}
                    >
                      <Text style={styles.quickActionIcon}>💬</Text>
                      <Text style={styles.quickActionText}>Message</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.quickActionButton, styles.taskButton]}
                      onPress={() => handleAssignTask(member)}
                    >
                      <Text style={styles.quickActionIcon}>📋</Text>
                      <Text style={styles.quickActionText}>Assign Task</Text>
                    </TouchableOpacity>
                  </View>
                </ConstructionCard>
              </TouchableOpacity>
            ))}
          </View>
        )}
        </View>
      </ScrollView>
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort Options</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Attendance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filter by Attendance Status</Text>
              <View style={styles.filterOptions}>
                {(['all', 'present', 'absent', 'late', 'on_break'] as AttendanceFilter[]).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterOption,
                      attendanceFilter === filter && styles.filterOptionActive
                    ]}
                    onPress={() => setAttendanceFilter(filter)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      attendanceFilter === filter && styles.filterOptionTextActive
                    ]}>
                      {filter.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort by</Text>
              <View style={styles.filterOptions}>
                {([
                  { key: 'name', label: 'Name' },
                  { key: 'status', label: 'Status' },
                  { key: 'task_progress', label: 'Task Progress' },
                  { key: 'last_updated', label: 'Last Updated' }
                ] as Array<{ key: SortOption; label: string }>).map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      sortBy === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => setSortBy(option.key)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      sortBy === option.key && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Team Actions */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Team Actions</Text>
              <ConstructionButton
                title="Send Team Notification"
                onPress={sendTeamNotification}
                variant="outline"
                size="medium"
                style={styles.teamActionButton}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Worker Detail Modal */}
      <Modal
        visible={showMemberDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMemberDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedMember?.name || 'Worker Details'}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMemberDetail(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {loadingMemberDetails ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={ConstructionTheme.colors.primary} />
                <Text style={styles.modalLoadingText}>Loading worker details...</Text>
              </View>
            ) : selectedMember ? (
              <>
                {/* Worker Basic Info */}
                <ConstructionCard title="Basic Information" variant="elevated" style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{selectedMember.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role:</Text>
                    <Text style={styles.detailValue}>{selectedMember.role}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusIcon}>{getStatusIcon(selectedMember.attendanceStatus)}</Text>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedMember.attendanceStatus) }]}>
                        {(selectedMember.attendanceStatus || 'unknown').replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </ConstructionCard>

                {/* Current Task */}
                <ConstructionCard title="Current Task" variant="elevated" style={styles.detailCard}>
                  {selectedMember.currentTask ? (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Task:</Text>
                        <Text style={styles.detailValue}>{selectedMember.currentTask.name}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Progress:</Text>
                        <View style={styles.progressDetailContainer}>
                          <View style={styles.progressDetailBar}>
                            <View 
                              style={[
                                styles.progressDetailFill, 
                                { width: `${selectedMember.currentTask.progress}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressDetailText}>{selectedMember.currentTask.progress}%</Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noDataText}>No active task assigned</Text>
                  )}
                </ConstructionCard>

                {/* Location Information */}
                <ConstructionCard title="Location Status" variant="elevated" style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Geofence Status:</Text>
                    <View style={styles.locationStatusDetail}>
                      <Text style={styles.locationIcon}>
                        {selectedMember.location.insideGeofence ? '📍' : '⚠️'}
                      </Text>
                      <Text style={[
                        styles.locationStatusText,
                        { color: selectedMember.location.insideGeofence ? ConstructionTheme.colors.success : ConstructionTheme.colors.warning }
                      ]}>
                        {selectedMember.location.insideGeofence ? 'On Site' : 'Outside Geofence'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Updated:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedMember.location.lastUpdated).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Coordinates:</Text>
                    <Text style={styles.detailValue}>
                      {selectedMember.location.latitude.toFixed(6)}, {selectedMember.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </ConstructionCard>

                {/* Certifications */}
                <ConstructionCard title="Certifications" variant="elevated" style={styles.detailCard}>
                  {selectedMember.certifications && selectedMember.certifications.length > 0 ? (
                    selectedMember.certifications.map((cert, index) => (
                      <View key={index} style={styles.certificationItem}>
                        <View style={styles.certificationHeader}>
                          <Text style={styles.certificationName}>{cert.name || 'Unknown Certification'}</Text>
                          <View style={[
                            styles.certificationStatusBadge,
                            { backgroundColor: cert.status === 'active' ? ConstructionTheme.colors.success : 
                                               cert.status === 'expiring' ? ConstructionTheme.colors.warning : 
                                               ConstructionTheme.colors.error }
                          ]}>
                            <Text style={styles.certificationStatusText}>
                              {(cert.status || 'unknown').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.certificationExpiry}>
                          Expires: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No certifications on record</Text>
                  )}
                </ConstructionCard>

                {/* Performance Metrics (Mock Data) */}
                <ConstructionCard title="Performance Overview" variant="elevated" style={styles.detailCard}>
                  <View style={styles.performanceGrid}>
                    <View style={styles.performanceItem}>
                      <Text style={styles.performanceValue}>95%</Text>
                      <Text style={styles.performanceLabel}>Attendance Rate</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <Text style={styles.performanceValue}>87%</Text>
                      <Text style={styles.performanceLabel}>Task Completion</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <Text style={styles.performanceValue}>4.2</Text>
                      <Text style={styles.performanceLabel}>Quality Score</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <Text style={styles.performanceValue}>12</Text>
                      <Text style={styles.performanceLabel}>Tasks This Week</Text>
                    </View>
                  </View>
                </ConstructionCard>

                {/* Action Buttons */}
                <View style={styles.detailActions}>
                  <ConstructionButton
                    title="Send Message"
                    onPress={() => {
                      setShowMemberDetail(false);
                      handleSendMessage(selectedMember);
                    }}
                    variant="primary"
                    size="medium"
                    style={styles.detailActionButton}
                  />
                  <ConstructionButton
                    title="Assign Task"
                    onPress={() => {
                      setShowMemberDetail(false);
                      handleAssignTask(selectedMember);
                    }}
                    variant="outline"
                    size="medium"
                    style={styles.detailActionButton}
                  />
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* Communication Modal */}
      <Modal
        visible={showCommunicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCommunicationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Send Message to {selectedMember?.name}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCommunicationModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Communication Type Selector */}
            <View style={styles.communicationTypeSection}>
              <Text style={styles.sectionTitle}>Message Type</Text>
              <View style={styles.communicationTypes}>
                {(['message', 'notification', 'alert'] as Array<typeof communicationType>).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.communicationTypeOption,
                      communicationType === type && styles.communicationTypeOptionActive
                    ]}
                    onPress={() => setCommunicationType(type)}
                  >
                    <Text style={[
                      styles.communicationTypeText,
                      communicationType === type && styles.communicationTypeTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message Input */}
            <View style={styles.messageInputSection}>
              <Text style={styles.sectionTitle}>Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder={`Enter your ${communicationType} here...`}
                value={communicationMessage}
                onChangeText={setCommunicationMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Quick Message Templates */}
            <View style={styles.quickMessagesSection}>
              <Text style={styles.sectionTitle}>Quick Messages</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  'Please check in at the site',
                  'Task assignment updated',
                  'Safety briefing at 2 PM',
                  'Good work today!',
                  'Please report to supervisor'
                ].map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickMessageButton}
                    onPress={() => setCommunicationMessage(template)}
                  >
                    <Text style={styles.quickMessageText}>{template}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Send Button */}
            <View style={styles.communicationActions}>
              <ConstructionButton
                title={`Send ${communicationType.charAt(0).toUpperCase() + communicationType.slice(1)}`}
                onPress={sendCommunication}
                variant="primary"
                size="large"
                disabled={!communicationMessage.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Increased padding to ensure content is fully visible above navigation
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
    zIndex: 1, // Ensure header stays on top
  },
  title: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
  },
  filtersButtonIcon: {
    fontSize: 16,
    marginRight: ConstructionTheme.spacing.xs,
  },
  filtersButtonText: {
    ...ConstructionTheme.typography.buttonSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  summaryCard: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    ...ConstructionTheme.typography.headlineLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  summaryLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryFooter: {
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
    paddingTop: ConstructionTheme.spacing.md,
    alignItems: 'center',
  },
  attendanceRate: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  geofenceAlert: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.warning,
    fontWeight: 'bold',
  },
  // Attendance Monitoring Quick Access Card styles
  attendanceCard: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  attendanceCardContent: {
    gap: ConstructionTheme.spacing.md,
  },
  attendanceDescription: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    lineHeight: 20,
  },
  attendanceAlerts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ConstructionTheme.spacing.sm,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    gap: ConstructionTheme.spacing.xs,
  },
  alertBadgeWarning: {
    backgroundColor: ConstructionTheme.colors.warningContainer,
  },
  alertBadgeError: {
    backgroundColor: ConstructionTheme.colors.errorContainer,
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  attendanceButton: {
    marginTop: ConstructionTheme.spacing.sm,
  },
  // Project summary styles
  projectSummaryCard: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  projectName: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  projectWorkerCount: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  progressInfo: {
    marginTop: ConstructionTheme.spacing.sm,
  },
  progressLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  membersList: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingTop: ConstructionTheme.spacing.sm,
    paddingBottom: ConstructionTheme.spacing.lg, // Added bottom padding for member cards
  },
  membersContainer: {
    // Container for all member cards
  },
  membersListContent: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.xl,
  },
  memberCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.md,
    minHeight: 50,
  },
  memberInfo: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  memberName: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  memberRole: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  statusContainer: {
    alignItems: 'center',
    minWidth: 80,
    maxWidth: 100,
    flexShrink: 0,
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statusText: {
    ...ConstructionTheme.typography.labelSmall,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  memberCardContent: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  taskInfo: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  taskLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  taskName: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noTaskText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 4,
    marginRight: ConstructionTheme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
  locationInfo: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  locationLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: ConstructionTheme.spacing.xs,
  },
  locationText: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: 'bold',
    flex: 1,
  },
  lastUpdated: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
    paddingTop: ConstructionTheme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginHorizontal: ConstructionTheme.spacing.xs,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
  },
  messageButton: {
    backgroundColor: ConstructionTheme.colors.info,
  },
  taskButton: {
    backgroundColor: ConstructionTheme.colors.primary,
  },
  quickActionIcon: {
    fontSize: 16,
    marginRight: ConstructionTheme.spacing.xs,
  },
  quickActionText: {
    ...ConstructionTheme.typography.buttonSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xxl,
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  emptyStateTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  emptyStateButton: {
    minWidth: 120,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primary,
    ...ConstructionTheme.shadows.medium,
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: ConstructionTheme.spacing.md,
  },
  modalLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ConstructionTheme.spacing.xxl,
  },
  modalLoadingText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.md,
  },

  // Filter Modal Styles
  filterSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  filterSectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.md,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ConstructionTheme.spacing.sm,
  },
  filterOption: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    backgroundColor: ConstructionTheme.colors.surface,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
  },
  filterOptionActive: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  filterOptionText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    textAlign: 'center',
  },
  filterOptionTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  teamActionButton: {
    marginTop: ConstructionTheme.spacing.sm,
  },

  // Worker Detail Modal Styles
  detailCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
    minHeight: 24,
  },
  detailLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  detailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  statusBadgeText: {
    ...ConstructionTheme.typography.labelSmall,
    fontWeight: 'bold',
    marginLeft: ConstructionTheme.spacing.xs,
  },
  progressDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  progressDetailBar: {
    flex: 1,
    height: 8,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 4,
    marginRight: ConstructionTheme.spacing.sm,
  },
  progressDetailFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.primary,
    borderRadius: 4,
  },
  progressDetailText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
  locationStatusDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  locationStatusText: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: 'bold',
    marginLeft: ConstructionTheme.spacing.xs,
  },
  noDataText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
  },

  // Certification Styles
  certificationItem: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  certificationName: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  certificationStatusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  certificationStatusText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  certificationExpiry: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },

  // Performance Styles
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  performanceValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  performanceLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },

  // Detail Actions
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  detailActionButton: {
    flex: 1,
  },

  // Communication Modal Styles
  communicationTypeSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.md,
  },
  communicationTypes: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
  },
  communicationTypeOption: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    backgroundColor: ConstructionTheme.colors.surface,
    alignItems: 'center',
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
  },
  communicationTypeOptionActive: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  communicationTypeText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
  },
  communicationTypeTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  messageInputSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surface,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    minHeight: 120,
  },
  quickMessagesSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  quickMessageButton: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginRight: ConstructionTheme.spacing.sm,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
  },
  quickMessageText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  communicationActions: {
    paddingTop: ConstructionTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
});

export default TeamManagementScreen;