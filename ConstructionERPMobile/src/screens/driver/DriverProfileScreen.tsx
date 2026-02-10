// DriverProfileScreen - Driver-specific profile information display
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
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useOffline } from '../../store/context/OfflineContext';
import { driverApiService } from '../../services/api/DriverApiService';

// Import common components
import { 
  ConstructionButton, 
  ConstructionCard, 
  ConstructionLoadingIndicator,
  ErrorDisplay,
  OfflineIndicator 
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface DriverProfileData {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    profileImage?: string;
    employeeId: string;
    companyName: string;
    employmentStatus: string;
  };
  driverInfo: {
    licenseNumber: string;
    licenseClass: string;
    licenseIssueDate: string | null;
    licenseExpiry: string;
    licenseIssuingAuthority: string;
    licensePhotoUrl: string | null;
    yearsOfExperience: number;
    specializations: string[];
  };
  emergencyContact: {
    name: string | null;
    relationship: string | null;
    phone: string | null;
  };
  assignedVehicles: Array<{
    id: number;
    plateNumber: string;
    model: string;
    isPrimary: boolean;
  }>;
  certifications: Array<{
    id: number;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'expiring_soon';
  }>;
  performanceSummary: {
    totalTrips: number;
    onTimePerformance: number;
    safetyScore: number;
    customerRating: number;
  };
}

interface CertificationAlert {
  certificationId: number;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
  alertLevel: 'warning' | 'urgent' | 'expired';
}

interface DriverProfileScreenProps {
  navigation: any;
}

const DriverProfileScreen: React.FC<DriverProfileScreenProps> = ({ navigation }) => {
  const { state: authState, logout } = useAuth();
  const { isOffline } = useOffline();

  // Profile data state
  const [profileData, setProfileData] = useState<DriverProfileData | null>(null);
  const [certificationAlerts, setCertificationAlerts] = useState<CertificationAlert[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load profile data
  const loadProfileData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('👤 Loading driver profile data...');

      const response = await driverApiService.getDriverProfile();
      if (response.success && response.data) {
        setProfileData(response.data);
        
        // Generate certification alerts
        const alerts = generateCertificationAlerts(response.data.certifications);
        setCertificationAlerts(alerts);
        
        console.log('✅ Driver profile loaded successfully');
      } else {
        throw new Error(response.message || 'Failed to load driver profile');
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('❌ Driver profile loading error:', error);
      setError(error.message || 'Failed to load driver profile');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Generate certification alerts
  const generateCertificationAlerts = (certifications: DriverProfileData['certifications']): CertificationAlert[] => {
    const alerts: CertificationAlert[] = [];
    const now = new Date();

    certifications.forEach(cert => {
      const expiryDate = new Date(cert.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (cert.status === 'expired' || daysUntilExpiry <= 0) {
        alerts.push({
          certificationId: cert.id,
          name: cert.name,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
          alertLevel: 'expired'
        });
      } else if (daysUntilExpiry <= 7) {
        alerts.push({
          certificationId: cert.id,
          name: cert.name,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
          alertLevel: 'urgent'
        });
      } else if (daysUntilExpiry <= 30) {
        alerts.push({
          certificationId: cert.id,
          name: cert.name,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
          alertLevel: 'warning'
        });
      }
    });

    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  // Initial load
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadProfileData(false);
  }, [loadProfileData]);

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

  // Handle edit phone
  const handleEditPhone = () => {
    Alert.prompt(
      'Update Phone Number',
      'Enter your new phone number',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newPhone) => {
            if (newPhone && newPhone.trim()) {
              try {
                const response = await driverApiService.updateDriverProfile({
                  phone: newPhone.trim()
                });
                
                if (response.success) {
                  Alert.alert('Success', 'Phone number updated successfully');
                  loadProfileData(); // Reload profile
                } else {
                  Alert.alert('Error', response.message || 'Failed to update phone number');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to update phone number');
              }
            }
          }
        }
      ],
      'plain-text',
      profileData?.user.phone || ''
    );
  };

  // Handle edit emergency contact
  const handleEditEmergencyContact = () => {
    // For simplicity, we'll use a series of prompts
    // In production, you'd want a proper modal form
    Alert.alert(
      'Update Emergency Contact',
      'This will open a form to update emergency contact details',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to emergency contact edit screen
            // For now, show a simple prompt
            Alert.prompt(
              'Emergency Contact Name',
              'Enter emergency contact name',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Next',
                  onPress: async (name) => {
                    Alert.prompt(
                      'Emergency Contact Phone',
                      'Enter emergency contact phone',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Update',
                          onPress: async (phone) => {
                            try {
                              const response = await driverApiService.updateDriverProfile({
                                emergencyContact: {
                                  name: name?.trim() || null,
                                  relationship: profileData?.emergencyContact?.relationship || null,
                                  phone: phone?.trim() || null
                                }
                              });
                              
                              if (response.success) {
                                Alert.alert('Success', 'Emergency contact updated successfully');
                                loadProfileData();
                              } else {
                                Alert.alert('Error', response.message || 'Failed to update emergency contact');
                              }
                            } catch (error: any) {
                              Alert.alert('Error', error.message || 'Failed to update emergency contact');
                            }
                          }
                        }
                      ],
                      'plain-text',
                      profileData?.emergencyContact?.phone || ''
                    );
                  }
                }
              ],
              'plain-text',
              profileData?.emergencyContact?.name || ''
            );
          }
        }
      ]
    );
  };

  // Handle view license
  const handleViewLicense = () => {
    if (profileData?.driverInfo.licensePhotoUrl) {
      // Navigate to image viewer or open in modal
      Alert.alert(
        'License Document',
        'License document viewer',
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'View',
            onPress: () => {
              // In production, open image viewer modal
              console.log('View license:', profileData.driverInfo.licensePhotoUrl);
            }
          }
        ]
      );
    }
  };

  // Utility functions
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCertificationStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return ConstructionTheme.colors.success;
      case 'expiring_soon':
        return ConstructionTheme.colors.warning;
      case 'expired':
        return ConstructionTheme.colors.error;
      default:
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  const getAlertLevelColor = (level: string): string => {
    switch (level) {
      case 'warning':
        return ConstructionTheme.colors.warning;
      case 'urgent':
        return ConstructionTheme.colors.error;
      case 'expired':
        return ConstructionTheme.colors.error;
      default:
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return ConstructionTheme.colors.success;
    if (score >= 75) return ConstructionTheme.colors.warning;
    return ConstructionTheme.colors.error;
  };

  // Render functions
  const renderCertificationAlerts = () => {
    if (!certificationAlerts || certificationAlerts.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚨 Certification Alerts</Text>
        {certificationAlerts.map((alert) => (
          <ConstructionCard
            key={alert.certificationId}
            variant="warning"
            style={[styles.alertCard, { borderLeftColor: getAlertLevelColor(alert.alertLevel) }]}
          >
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{alert.name}</Text>
              <View style={[
                styles.alertBadge,
                { backgroundColor: getAlertLevelColor(alert.alertLevel) }
              ]}>
                <Text style={styles.alertBadgeText}>
                  {alert.alertLevel.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.alertMessage}>
              {alert.alertLevel === 'expired' 
                ? `Expired on ${formatDate(alert.expiryDate)}`
                : `Expires in ${alert.daysUntilExpiry} days (${formatDate(alert.expiryDate)})`
              }
            </Text>
          </ConstructionCard>
        ))}
      </View>
    );
  };

  const renderPersonalInfo = () => {
    if (!profileData) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Personal Information</Text>
        <ConstructionCard variant="elevated" style={styles.card}>
          {/* Profile Image */}
          <View style={styles.profileHeader}>
            {profileData.user.profileImage ? (
              <Image 
                source={{ uri: profileData.user.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {profileData.user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.user.name}</Text>
              <Text style={styles.profileDetail}>ID: {profileData.user.employeeId}</Text>
              <Text style={styles.profileDetail}>Driver</Text>
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: profileData.user.employmentStatus === 'ACTIVE' 
                    ? ConstructionTheme.colors.success 
                    : profileData.user.employmentStatus === 'LEFT'
                    ? ConstructionTheme.colors.error
                    : ConstructionTheme.colors.warning
                }
              ]}>
                <Text style={styles.statusText}>
                  {profileData.user.employmentStatus}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏢 Company:</Text>
            <Text style={styles.infoValue}>{profileData.user.companyName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📧 Email:</Text>
            <Text style={styles.infoValue}>{profileData.user.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📱 Phone:</Text>
            <View style={styles.editableFieldContainer}>
              <Text style={styles.infoValue}>{profileData.user.phone}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditPhone()}
              >
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ConstructionCard>
      </View>
    );
  };

  const renderDriverInfo = () => {
    if (!profileData?.driverInfo) return null;

    const licenseExpiry = new Date(profileData.driverInfo.licenseExpiry);
    const isExpiringSoon = licenseExpiry.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days
    const isExpired = licenseExpiry < new Date();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚗 License & Certification</Text>
        <ConstructionCard variant="outlined" style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License Number:</Text>
            <Text style={styles.infoValue}>{profileData.driverInfo.licenseNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License Class:</Text>
            <Text style={styles.infoValue}>{profileData.driverInfo.licenseClass}</Text>
          </View>

          {profileData.driverInfo.licenseIssuingAuthority && profileData.driverInfo.licenseIssuingAuthority !== 'N/A' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issuing Authority:</Text>
              <Text style={styles.infoValue}>{profileData.driverInfo.licenseIssuingAuthority}</Text>
            </View>
          )}

          {profileData.driverInfo.licenseIssueDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issue Date:</Text>
              <Text style={styles.infoValue}>{formatDate(profileData.driverInfo.licenseIssueDate)}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License Expiry:</Text>
            <Text style={[
              styles.infoValue,
              isExpired && styles.expiredText,
              isExpiringSoon && !isExpired && styles.warningText
            ]}>
              {formatDate(profileData.driverInfo.licenseExpiry)}
              {isExpired && ' (EXPIRED)'}
              {isExpiringSoon && !isExpired && ' (Expiring Soon)'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Experience:</Text>
            <Text style={styles.infoValue}>
              {profileData.driverInfo.yearsOfExperience} years
            </Text>
          </View>

          {/* License Document View Button */}
          {profileData.driverInfo.licensePhotoUrl && (
            <TouchableOpacity 
              style={styles.viewLicenseButton}
              onPress={() => handleViewLicense()}
            >
              <Text style={styles.viewLicenseButtonText}>📄 View License Document</Text>
            </TouchableOpacity>
          )}
          
          {profileData.driverInfo.specializations.length > 0 && (
            <View style={styles.specializationsContainer}>
              <Text style={styles.specializationsTitle}>Specializations:</Text>
              <View style={styles.specializationsGrid}>
                {profileData.driverInfo.specializations.map((spec, index) => (
                  <View key={`spec-${spec}`} style={styles.specializationTag}>
                    <Text style={styles.specializationText}>{spec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ConstructionCard>
      </View>
    );
  };

  const renderVehicleAssignments = () => {
    if (!profileData?.assignedVehicles || profileData.assignedVehicles.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚛 Vehicle Assignments</Text>
        {profileData.assignedVehicles.map((vehicle) => (
          <ConstructionCard
            key={vehicle.id}
            variant={vehicle.isPrimary ? 'success' : 'outlined'}
            style={styles.card}
          >
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
              {vehicle.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              )}
            </View>
            <Text style={styles.vehicleModel}>{vehicle.model}</Text>
          </ConstructionCard>
        ))}
      </View>
    );
  };

  const renderEmergencyContact = () => {
    if (!profileData?.emergencyContact) return null;

    const hasEmergencyContact = profileData.emergencyContact.name || 
                                 profileData.emergencyContact.phone;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚨 Emergency Contact</Text>
        <ConstructionCard variant="outlined" style={styles.card}>
          {hasEmergencyContact ? (
            <>
              {profileData.emergencyContact.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{profileData.emergencyContact.name}</Text>
                </View>
              )}
              
              {profileData.emergencyContact.relationship && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Relationship:</Text>
                  <Text style={styles.infoValue}>{profileData.emergencyContact.relationship}</Text>
                </View>
              )}
              
              {profileData.emergencyContact.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <View style={styles.editableFieldContainer}>
                    <Text style={styles.infoValue}>{profileData.emergencyContact.phone}</Text>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => handleEditEmergencyContact()}
                    >
                      <Text style={styles.editButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No emergency contact set</Text>
              <ConstructionButton
                title="Add Emergency Contact"
                onPress={() => handleEditEmergencyContact()}
                variant="secondary"
                size="small"
                style={styles.addButton}
              />
            </View>
          )}
        </ConstructionCard>
      </View>
    );
  };

  const renderCertifications = () => {
    if (!profileData?.certifications || profileData.certifications.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📜 Certifications</Text>
        {profileData.certifications.map((cert) => (
          <ConstructionCard key={cert.id} variant="outlined" style={styles.card}>
            <View style={styles.certificationHeader}>
              <Text style={styles.certificationName}>{cert.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getCertificationStatusColor(cert.status) }
              ]}>
                <Text style={styles.statusText}>
                  {cert.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issuer:</Text>
              <Text style={styles.infoValue}>{cert.issuer}</Text>
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
          </ConstructionCard>
        ))}
      </View>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!profileData?.performanceSummary) return null;

    const { performanceSummary } = profileData;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Performance Summary</Text>
        <ConstructionCard variant="elevated" style={styles.card}>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{performanceSummary.totalTrips}</Text>
              <Text style={styles.performanceLabel}>Total Trips</Text>
            </View>
            
            <View style={styles.performanceDivider} />
            
            <View style={styles.performanceItem}>
              <Text style={[
                styles.performanceValue,
                { color: getPerformanceColor(performanceSummary.onTimePerformance) }
              ]}>
                {performanceSummary.onTimePerformance.toFixed(1)}%
              </Text>
              <Text style={styles.performanceLabel}>On-Time</Text>
            </View>
          </View>
          
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={[
                styles.performanceValue,
                { color: getPerformanceColor(performanceSummary.safetyScore) }
              ]}>
                {performanceSummary.safetyScore.toFixed(1)}
              </Text>
              <Text style={styles.performanceLabel}>Safety Score</Text>
            </View>
            
            <View style={styles.performanceDivider} />
            
            <View style={styles.performanceItem}>
              <Text style={[
                styles.performanceValue,
                { color: getPerformanceColor(performanceSummary.customerRating * 20) }
              ]}>
                {performanceSummary.customerRating.toFixed(1)}/5
              </Text>
              <Text style={styles.performanceLabel}>Rating</Text>
            </View>
          </View>
        </ConstructionCard>
      </View>
    );
  };

  const renderActions = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Actions</Text>
        <ConstructionCard variant="outlined" style={styles.card}>
          <ConstructionButton
            title="🔒 Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
            variant="secondary"
            size="medium"
            style={styles.actionButton}
          />
          
          <ConstructionButton
            title="📞 Help & Support"
            onPress={() => navigation.navigate('HelpSupport')}
            variant="secondary"
            size="medium"
            style={styles.actionButton}
          />
          
          <ConstructionButton
            title="🚪 Logout"
            onPress={handleLogout}
            variant="error"
            size="medium"
            style={styles.actionButton}
          />
        </ConstructionCard>
      </View>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ConstructionLoadingIndicator 
            message="Loading driver profile..."
            size="large"
          />
        </View>
      </View>
    );
  }

  // Render error state
  if (error && !profileData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <ErrorDisplay 
            error={error}
            onRetry={() => loadProfileData()}
            showRetry={!isOffline}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Driver Profile</Text>
          <Text style={styles.subtitle}>
            {authState.user?.name || 'Driver'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? '⟳' : '↻'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline indicator */}
      {isOffline && <OfflineIndicator />}

      {/* Content */}
      <ScrollView 
        style={styles.content}
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
        {renderCertificationAlerts()}
        {renderPersonalInfo()}
        {renderEmergencyContact()}
        {renderDriverInfo()}
        {renderVehicleAssignments()}
        {renderPerformanceMetrics()}
        {renderCertifications()}
        {renderActions()}

        {/* Last updated info */}
        {lastUpdated && (
          <View style={styles.lastUpdatedContainer}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.lg,
    backgroundColor: ConstructionTheme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimary + 'CC',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  refreshButtonText: {
    color: ConstructionTheme.colors.onPrimary,
    ...ConstructionTheme.typography.headlineSmall,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
  },
  section: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: ConstructionTheme.spacing.lg,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ConstructionTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ConstructionTheme.spacing.lg,
  },
  profileImageText: {
    ...ConstructionTheme.typography.headlineLarge,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileDetail: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline + '33',
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
  specializationsContainer: {
    marginTop: ConstructionTheme.spacing.md,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline + '33',
  },
  specializationsTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  specializationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ConstructionTheme.spacing.sm,
  },
  specializationTag: {
    backgroundColor: ConstructionTheme.colors.primary + '20',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  specializationText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  vehiclePlate: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  vehicleModel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  primaryBadge: {
    backgroundColor: ConstructionTheme.colors.success,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  primaryBadgeText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  certificationName: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    flex: 1,
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
  performanceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ConstructionTheme.spacing.md,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  performanceValue: {
    ...ConstructionTheme.typography.headlineLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  performanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: ConstructionTheme.colors.outline,
    marginHorizontal: ConstructionTheme.spacing.md,
  },
  alertCard: {
    borderLeftWidth: 4,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  alertTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    flex: 1,
  },
  alertBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  alertBadgeText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  alertMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  actionButton: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  lastUpdatedText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: ConstructionTheme.spacing.xl,
  },
  editableFieldContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  editButton: {
    marginLeft: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.primary + '20',
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  editButtonText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  viewLicenseButton: {
    marginTop: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.md,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    borderRadius: ConstructionTheme.borderRadius.md,
    alignItems: 'center',
  },
  viewLicenseButtonText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.lg,
  },
  emptyStateText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.md,
  },
  addButton: {
    marginTop: ConstructionTheme.spacing.sm,
  },
});

export default DriverProfileScreen;