// Supervisor Profile Screen - Display supervisor-specific profile information
// Requirements: 15.1, 15.2, 15.3, 15.4, 15.5

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import {
  ConstructionCard,
  ConstructionButton,
  LoadingOverlay,
  ErrorDisplay,
} from '../../components/common';
import ProfilePhotoManager from '../../components/forms/ProfilePhotoManager';

interface SupervisorProfileData {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    profileImage?: string;
    employeeId: string;
    role: string;
  };
  supervisorInfo: {
    approvalLevel: 'basic' | 'advanced' | 'senior';
    specializations: string[];
    yearsOfExperience: number;
    department: string;
    joinDate: string;
  };
  teamAssignments: Array<{
    projectId: number;
    projectName: string;
    projectCode: string;
    location: string;
    teamSize: number;
    startDate: string;
    status: 'active' | 'completed' | 'on_hold';
    role: 'lead_supervisor' | 'assistant_supervisor' | 'site_supervisor';
  }>;
  projectResponsibilities: Array<{
    projectId: number;
    projectName: string;
    responsibilities: string[];
    budget: number;
    currency: string;
    completionPercentage: number;
  }>;
  certifications: Array<{
    id: number;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    certificateNumber: string;
    status: 'active' | 'expired' | 'expiring_soon';
    category: 'safety' | 'technical' | 'management' | 'regulatory';
  }>;
  performanceMetrics: {
    projectsCompleted: number;
    averageProjectRating: number;
    teamSatisfactionScore: number;
    safetyRecord: {
      incidentFreeMonths: number;
      safetyTrainingsCompleted: number;
      safetyAuditsScore: number;
    };
    approvalMetrics: {
      averageApprovalTime: number; // in hours
      approvalAccuracy: number; // percentage
      totalApprovalsProcessed: number;
    };
    teamPerformance: {
      averageTaskCompletion: number;
      teamProductivity: number;
      workerRetentionRate: number;
    };
  };
  achievements: Array<{
    id: number;
    title: string;
    description: string;
    dateAchieved: string;
    category: 'safety' | 'productivity' | 'quality' | 'leadership' | 'innovation';
    icon: string;
  }>;
}

interface SupervisorProfileScreenProps {
  navigation?: any;
}

const SupervisorProfileScreen: React.FC<SupervisorProfileScreenProps> = ({ navigation }) => {
  const { state: authState, logout } = useAuth();
  const { state: supervisorState, clearError } = useSupervisorContext();
  
  // Local state
  const [profileData, setProfileData] = useState<SupervisorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load supervisor profile data
  const loadProfileData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // TODO: Replace with actual API call when implemented
      // For now, using mock data based on the interface
      const mockProfileData: SupervisorProfileData = {
        user: {
          id: authState.user?.id || 1,
          name: authState.user?.name || 'John Supervisor',
          email: authState.user?.email || 'john.supervisor@construction.com',
          phone: authState.user?.phone || '+1-555-0123',
          profileImage: authState.user?.profileImage,
          employeeId: authState.user?.employeeId || 'SUP001',
          role: 'Site Supervisor',
        },
        supervisorInfo: {
          approvalLevel: 'advanced',
          specializations: ['Concrete Work', 'Steel Structure', 'Safety Management'],
          yearsOfExperience: 8,
          department: 'Construction Operations',
          joinDate: '2018-03-15',
        },
        teamAssignments: [
          {
            projectId: 1,
            projectName: 'Downtown Office Complex',
            projectCode: 'DOC-2024-001',
            location: 'Downtown District',
            teamSize: 15,
            startDate: '2024-01-15',
            status: 'active',
            role: 'lead_supervisor',
          },
          {
            projectId: 2,
            projectName: 'Residential Tower Phase 2',
            projectCode: 'RTP2-2024-002',
            location: 'North District',
            teamSize: 8,
            startDate: '2024-02-01',
            status: 'active',
            role: 'site_supervisor',
          },
        ],
        projectResponsibilities: [
          {
            projectId: 1,
            projectName: 'Downtown Office Complex',
            responsibilities: [
              'Team coordination and task assignment',
              'Quality control and safety oversight',
              'Progress reporting and documentation',
              'Material and resource management',
            ],
            budget: 2500000,
            currency: 'USD',
            completionPercentage: 65,
          },
        ],
        certifications: [
          {
            id: 1,
            name: 'OSHA 30-Hour Construction Safety',
            issuer: 'OSHA',
            issueDate: '2023-01-15',
            expiryDate: '2026-01-15',
            certificateNumber: 'OSHA-30-2023-001',
            status: 'active',
            category: 'safety',
          },
          {
            id: 2,
            name: 'Project Management Professional (PMP)',
            issuer: 'PMI',
            issueDate: '2022-06-20',
            expiryDate: '2025-06-20',
            certificateNumber: 'PMP-2022-456',
            status: 'active',
            category: 'management',
          },
          {
            id: 3,
            name: 'First Aid/CPR Certification',
            issuer: 'Red Cross',
            issueDate: '2023-08-10',
            expiryDate: '2025-08-10',
            certificateNumber: 'RC-FA-2023-789',
            status: 'expiring_soon',
            category: 'safety',
          },
        ],
        performanceMetrics: {
          projectsCompleted: 12,
          averageProjectRating: 4.7,
          teamSatisfactionScore: 4.5,
          safetyRecord: {
            incidentFreeMonths: 18,
            safetyTrainingsCompleted: 24,
            safetyAuditsScore: 96,
          },
          approvalMetrics: {
            averageApprovalTime: 2.5,
            approvalAccuracy: 98,
            totalApprovalsProcessed: 342,
          },
          teamPerformance: {
            averageTaskCompletion: 94,
            teamProductivity: 87,
            workerRetentionRate: 92,
          },
        },
        achievements: [
          {
            id: 1,
            title: 'Safety Excellence Award',
            description: '18 months incident-free record',
            dateAchieved: '2024-01-15',
            category: 'safety',
            icon: '🏆',
          },
          {
            id: 2,
            title: 'Team Leadership Recognition',
            description: 'Highest team satisfaction score in division',
            dateAchieved: '2023-12-01',
            category: 'leadership',
            icon: '👥',
          },
          {
            id: 3,
            title: 'Quality Champion',
            description: 'Zero quality defects in Q3 2023',
            dateAchieved: '2023-09-30',
            category: 'quality',
            icon: '⭐',
          },
        ],
      };

      setProfileData(mockProfileData);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile data';
      setError(errorMessage);
      console.error('Profile data loading error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authState.user]);

  // Initial data load
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await loadProfileData(true);
  }, [loadProfileData]);

  // Handle photo update
  const handlePhotoUpdated = useCallback(async (photoUrl: string) => {
    if (profileData) {
      // Update the local state immediately for better UX
      setProfileData({
        ...profileData,
        user: {
          ...profileData.user,
          profileImage: photoUrl,
        },
      });
      
      // Refresh the profile data from server to ensure consistency
      try {
        await loadProfileData();
      } catch (error) {
        console.warn('Failed to refresh profile data after photo update:', error);
      }
    }
  }, [profileData, loadProfileData]);

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get certification status color
  const getCertificationStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return ConstructionTheme.colors.success;
      case 'expiring_soon':
        return ConstructionTheme.colors.warning;
      case 'expired':
        return ConstructionTheme.colors.error;
      default:
        return ConstructionTheme.colors.neutral;
    }
  };

  // Get project status color
  const getProjectStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return ConstructionTheme.colors.success;
      case 'completed':
        return ConstructionTheme.colors.info;
      case 'on_hold':
        return ConstructionTheme.colors.warning;
      default:
        return ConstructionTheme.colors.neutral;
    }
  };

  // Get achievement category color
  const getAchievementCategoryColor = (category: string): string => {
    switch (category) {
      case 'safety':
        return ConstructionTheme.colors.error;
      case 'productivity':
        return ConstructionTheme.colors.primary;
      case 'quality':
        return ConstructionTheme.colors.success;
      case 'leadership':
        return ConstructionTheme.colors.info;
      case 'innovation':
        return ConstructionTheme.colors.secondary;
      default:
        return ConstructionTheme.colors.neutral;
    }
  };

  // Handle logout
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

  // Render personal information section
  const renderPersonalInfo = () => {
    if (!profileData) return null;

    return (
      <ConstructionCard title="Personal Information" variant="elevated" style={styles.section}>
        <ProfilePhotoManager
          currentPhotoUrl={profileData.user.profileImage}
          onPhotoUpdated={handlePhotoUpdated}
        />
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profileData.user.name}</Text>
          <Text style={styles.profileRole}>{profileData.user.role}</Text>
          <Text style={styles.profileDetail}>ID: {profileData.user.employeeId}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{profileData.user.email}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{profileData.user.phone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department:</Text>
          <Text style={styles.infoValue}>{profileData.supervisorInfo.department}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Experience:</Text>
          <Text style={styles.infoValue}>{profileData.supervisorInfo.yearsOfExperience} years</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Join Date:</Text>
          <Text style={styles.infoValue}>{formatDate(profileData.supervisorInfo.joinDate)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Approval Level:</Text>
          <View style={styles.approvalLevelBadge}>
            <Text style={styles.approvalLevelText}>
              {profileData.supervisorInfo.approvalLevel.toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => navigation?.navigate('ChangePassword')}
        >
          <Text style={styles.changePasswordText}>🔒 Change Password</Text>
          <Text style={styles.changePasswordSubtext}>Update your account password</Text>
        </TouchableOpacity>
      </ConstructionCard>
    );
  };

  // Render specializations section
  const renderSpecializations = () => {
    if (!profileData?.supervisorInfo.specializations || profileData.supervisorInfo.specializations.length === 0) {
      return null;
    }

    return (
      <ConstructionCard title="Specializations" variant="elevated" style={styles.section}>
        <View style={styles.specializationsContainer}>
          {profileData.supervisorInfo.specializations.map((specialization, index) => (
            <View key={index} style={styles.specializationBadge}>
              <Text style={styles.specializationText}>{specialization}</Text>
            </View>
          ))}
        </View>
      </ConstructionCard>
    );
  };

  // Render team assignments section
  const renderTeamAssignments = () => {
    if (!profileData?.teamAssignments || profileData.teamAssignments.length === 0) {
      return null;
    }

    return (
      <ConstructionCard title="Team Assignments" variant="elevated" style={styles.section}>
        {profileData.teamAssignments.map((assignment) => (
          <View key={assignment.projectId} style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentProjectName}>{assignment.projectName}</Text>
                <Text style={styles.assignmentProjectCode}>{assignment.projectCode}</Text>
                <Text style={styles.assignmentLocation}>📍 {assignment.location}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getProjectStatusColor(assignment.status) }
              ]}>
                <Text style={styles.statusText}>
                  {assignment.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.assignmentDetails}>
              <View style={styles.assignmentDetailItem}>
                <Text style={styles.assignmentDetailLabel}>Role:</Text>
                <Text style={styles.assignmentDetailValue}>
                  {assignment.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
              <View style={styles.assignmentDetailItem}>
                <Text style={styles.assignmentDetailLabel}>Team Size:</Text>
                <Text style={styles.assignmentDetailValue}>{assignment.teamSize} members</Text>
              </View>
              <View style={styles.assignmentDetailItem}>
                <Text style={styles.assignmentDetailLabel}>Start Date:</Text>
                <Text style={styles.assignmentDetailValue}>{formatDate(assignment.startDate)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ConstructionCard>
    );
  };

  // Render project responsibilities section
  const renderProjectResponsibilities = () => {
    if (!profileData?.projectResponsibilities || profileData.projectResponsibilities.length === 0) {
      return null;
    }

    return (
      <ConstructionCard title="Project Responsibilities" variant="elevated" style={styles.section}>
        {profileData.projectResponsibilities.map((project) => (
          <View key={project.projectId} style={styles.responsibilityCard}>
            <View style={styles.responsibilityHeader}>
              <Text style={styles.responsibilityProjectName}>{project.projectName}</Text>
              <View style={styles.budgetInfo}>
                <Text style={styles.budgetText}>
                  {project.currency} {project.budget.toLocaleString()}
                </Text>
                <Text style={styles.completionText}>
                  {project.completionPercentage}% Complete
                </Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${project.completionPercentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{project.completionPercentage}%</Text>
            </View>

            <Text style={styles.responsibilitiesTitle}>Key Responsibilities:</Text>
            {project.responsibilities.map((responsibility, index) => (
              <View key={index} style={styles.responsibilityItem}>
                <Text style={styles.responsibilityBullet}>•</Text>
                <Text style={styles.responsibilityText}>{responsibility}</Text>
              </View>
            ))}
          </View>
        ))}
      </ConstructionCard>
    );
  };

  // Render certifications section
  const renderCertifications = () => {
    if (!profileData?.certifications || profileData.certifications.length === 0) {
      return null;
    }

    return (
      <ConstructionCard title="Certifications" variant="elevated" style={styles.section}>
        {profileData.certifications.map((cert) => (
          <View key={cert.id} style={styles.certificationCard}>
            <View style={styles.certificationHeader}>
              <View style={styles.certificationInfo}>
                <Text style={styles.certificationName}>{cert.name}</Text>
                <Text style={styles.certificationIssuer}>Issued by {cert.issuer}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getCertificationStatusColor(cert.status) }
              ]}>
                <Text style={styles.statusText}>
                  {cert.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.certificationDetails}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Certificate #:</Text>
                <Text style={styles.infoValue}>{cert.certificateNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Issue Date:</Text>
                <Text style={styles.infoValue}>{formatDate(cert.issueDate)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expiry Date:</Text>
                <Text style={[
                  styles.infoValue,
                  cert.status === 'expired' && styles.expiredText,
                  cert.status === 'expiring_soon' && styles.warningText
                ]}>
                  {formatDate(cert.expiryDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoValue}>
                  {cert.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ConstructionCard>
    );
  };

  // Render performance metrics section
  const renderPerformanceMetrics = () => {
    if (!profileData?.performanceMetrics) return null;

    const { performanceMetrics } = profileData;

    return (
      <ConstructionCard title="Performance Overview" variant="elevated" style={styles.section}>
        {/* Overall Performance */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.projectsCompleted}</Text>
            <Text style={styles.metricLabel}>Projects Completed</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.averageProjectRating.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Avg Project Rating</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performanceMetrics.teamSatisfactionScore.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Team Satisfaction</Text>
          </View>
        </View>

        {/* Safety Record */}
        <View style={styles.metricsSection}>
          <Text style={styles.metricsSectionTitle}>Safety Record</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: ConstructionTheme.colors.success }]}>
                {performanceMetrics.safetyRecord.incidentFreeMonths}
              </Text>
              <Text style={styles.metricLabel}>Incident-Free Months</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {performanceMetrics.safetyRecord.safetyTrainingsCompleted}
              </Text>
              <Text style={styles.metricLabel}>Safety Trainings</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {performanceMetrics.safetyRecord.safetyAuditsScore}%
              </Text>
              <Text style={styles.metricLabel}>Safety Audit Score</Text>
            </View>
          </View>
        </View>

        {/* Approval Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.metricsSectionTitle}>Approval Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {performanceMetrics.approvalMetrics.averageApprovalTime.toFixed(1)}h
              </Text>
              <Text style={styles.metricLabel}>Avg Approval Time</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {performanceMetrics.approvalMetrics.approvalAccuracy}%
              </Text>
              <Text style={styles.metricLabel}>Approval Accuracy</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {performanceMetrics.approvalMetrics.totalApprovalsProcessed}
              </Text>
              <Text style={styles.metricLabel}>Total Approvals</Text>
            </View>
          </View>
        </View>

        {/* Team Performance */}
        <View style={styles.metricsSection}>
          <Text style={styles.metricsSectionTitle}>Team Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {performanceMetrics.teamPerformance.averageTaskCompletion}%
              </Text>
              <Text style={styles.metricLabel}>Task Completion</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {performanceMetrics.teamPerformance.teamProductivity}%
              </Text>
              <Text style={styles.metricLabel}>Team Productivity</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {performanceMetrics.teamPerformance.workerRetentionRate}%
              </Text>
              <Text style={styles.metricLabel}>Worker Retention</Text>
            </View>
          </View>
        </View>
      </ConstructionCard>
    );
  };

  // Render achievements section
  const renderAchievements = () => {
    if (!profileData?.achievements || profileData.achievements.length === 0) {
      return null;
    }

    return (
      <ConstructionCard title="Achievements & Recognition" variant="elevated" style={styles.section}>
        {profileData.achievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementCard}>
            <View style={styles.achievementHeader}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>
                  Achieved on {formatDate(achievement.dateAchieved)}
                </Text>
              </View>
              <View style={[
                styles.achievementCategoryBadge,
                { backgroundColor: getAchievementCategoryColor(achievement.category) }
              ]}>
                <Text style={styles.achievementCategoryText}>
                  {achievement.category.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ConstructionCard>
    );
  };

  // Render help and support section
  const renderHelpSupport = () => {
    return (
      <ConstructionCard title="Help & Support" variant="elevated" style={styles.section}>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => navigation?.navigate('HelpSupport')}
        >
          <Text style={styles.helpButtonText}>📞 Help & Support</Text>
          <Text style={styles.helpButtonSubtext}>Get help, report issues, or contact support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          <Text style={styles.logoutButtonSubtext}>Sign out of your supervisor account</Text>
        </TouchableOpacity>
      </ConstructionCard>
    );
  };

  // Show loading state during initial load
  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading supervisor profile..." />;
  }

  // Show error state if data failed to load
  if (error && !profileData) {
    return (
      <View style={styles.errorContainer}>
        <ErrorDisplay
          error={error}
          onRetry={() => loadProfileData()}
          onDismiss={() => setError(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Supervisor Profile</Text>
          {lastRefresh && (
            <Text style={styles.lastRefreshText}>
              Last updated: {lastRefresh.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
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
        {/* Error Display */}
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={handleRefresh}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Profile Sections */}
        {renderPersonalInfo()}
        {renderSpecializations()}
        {renderTeamAssignments()}
        {renderProjectResponsibilities()}
        {renderCertifications()}
        {renderPerformanceMetrics()}
        {renderAchievements()}
        {renderHelpSupport()}
      </ScrollView>
    </View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ConstructionTheme.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    padding: ConstructionTheme.spacing.md,
  },
  section: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.md,
  },

  // Personal Info Styles
  profileInfo: {
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  profileName: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
    textAlign: 'center',
  },
  profileRole: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
    textAlign: 'center',
  },
  profileDetail: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
    minHeight: 40,
  },
  infoLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 2,
    textAlign: 'right',
  },
  approvalLevelBadge: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  approvalLevelText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  changePasswordButton: {
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    marginTop: ConstructionTheme.spacing.md,
  },
  changePasswordText: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: 'bold',
    color: ConstructionTheme.colors.primary,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  changePasswordSubtext: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },

  // Specializations Styles
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ConstructionTheme.spacing.sm,
  },
  specializationBadge: {
    backgroundColor: ConstructionTheme.colors.secondary,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  specializationText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSecondary,
    fontWeight: 'bold',
  },

  // Team Assignments Styles
  assignmentCard: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  assignmentInfo: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  assignmentProjectName: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  assignmentProjectCode: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  assignmentLocation: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  assignmentDetails: {
    gap: ConstructionTheme.spacing.xs,
  },
  assignmentDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentDetailLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  assignmentDetailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '500',
  },

  // Project Responsibilities Styles
  responsibilityCard: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  responsibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  responsibilityProjectName: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  budgetInfo: {
    alignItems: 'flex-end',
  },
  budgetText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  completionText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
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
  },
  responsibilitiesTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  responsibilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  responsibilityBullet: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.primary,
    marginRight: ConstructionTheme.spacing.sm,
    marginTop: 2,
  },
  responsibilityText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },

  // Certifications Styles
  certificationCard: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  certificationInfo: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  certificationName: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  certificationIssuer: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  certificationDetails: {
    gap: ConstructionTheme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  statusText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  expiredText: {
    color: ConstructionTheme.colors.error,
    fontWeight: 'bold',
  },
  warningText: {
    color: ConstructionTheme.colors.warning,
    fontWeight: 'bold',
  },

  // Performance Metrics Styles
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  metricLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  metricsSection: {
    marginTop: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  metricsSectionTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.md,
  },

  // Achievements Styles
  achievementCard: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.xs,
  },
  achievementInfo: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  achievementTitle: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  achievementDescription: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  achievementDate: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  achievementCategoryBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  achievementCategoryText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },

  // Help and Support Styles
  helpButton: {
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    marginBottom: ConstructionTheme.spacing.md,
  },
  helpButtonText: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: 'bold',
    color: ConstructionTheme.colors.info,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  helpButtonSubtext: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  logoutButton: {
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    backgroundColor: '#FFEBEE', // Light red background
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.error,
  },
  logoutButtonText: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: 'bold',
    color: ConstructionTheme.colors.error,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  logoutButtonSubtext: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
});

export default SupervisorProfileScreen;