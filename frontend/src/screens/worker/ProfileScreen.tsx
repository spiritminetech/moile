// Worker Profile Screen - Display read-only profile information with certifications and work pass
// Requirements: 8.1, 8.2, 8.4, 8.5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { workerApiService } from '../../services/api/WorkerApiService';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ProfilePhotoManager from '../../components/forms/ProfilePhotoManager';

interface ProfileData {
  user: {
    name: string;
    email: string;
    phone: string;
    profileImage?: string;
    employeeId: string;
  };
  employeeCode?: string;
  nationality?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  certifications: Array<{
    id: number;
    name: string;
    type?: string;
    certificationType?: string;
    ownership?: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    certificateNumber: string;
    status: 'active' | 'expired' | 'expiring_soon';
    documentPath?: string;
  }>;
  workPass: {
    id: number;
    passNumber: string;
    finNumber?: string;
    workPassType?: string;
    issueDate: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'suspended' | 'new' | 'renewal' | 'under_renewal';
    applicationDoc?: string;
    medicalDoc?: string;
    issuanceDoc?: string;
    momDoc?: string;
  };
  salaryInfo?: {
    basicSalary: number;
    allowances: number;
    totalEarnings: number;
    currency: string;
  };
}

interface CertificationAlert {
  certificationId: number;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
  alertLevel: 'warning' | 'urgent' | 'expired';
}

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [certificationAlerts, setCertificationAlerts] = useState<CertificationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfileData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('📊 Loading profile data...');

      // Load profile data and certification alerts in parallel
      const [profileResponse, alertsResponse] = await Promise.all([
        workerApiService.getProfile(),
        workerApiService.getCertificationExpiryAlerts(),
      ]);

      console.log('📥 Profile response:', {
        success: profileResponse.success,
        hasData: !!profileResponse.data,
        hasUser: !!profileResponse.data?.user,
        hasProfileImage: !!profileResponse.data?.user?.profileImage,
        profileImageUrl: profileResponse.data?.user?.profileImage,
        message: profileResponse.message
      });

      if (profileResponse.success && profileResponse.data) {
        setProfileData(profileResponse.data);
        console.log('✅ Profile data loaded successfully');
      } else {
        const errorMsg = profileResponse.message || 'Failed to load profile data';
        console.warn('❌ Profile loading failed:', errorMsg);
        throw new Error(errorMsg);
      }

      if (alertsResponse.success) {
        setCertificationAlerts(alertsResponse.data || []);
        console.log('✅ Certification alerts loaded successfully');
      } else {
        // Don't fail the whole screen if alerts fail
        console.warn('Failed to load certification alerts:', alertsResponse.message);
        setCertificationAlerts([]);
      }
    } catch (err) {
      console.error('❌ Profile loading error:', err);
      let errorMessage = 'Failed to load profile data';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      
      // Show user-friendly alert with retry option
      Alert.alert(
        'Profile Loading Error',
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            style: 'default',
            onPress: () => loadProfileData(false)
          },
          {
            text: 'Help',
            style: 'default',
            onPress: () => navigation.navigate('HelpSupport')
          }
        ]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const onRefresh = () => {
    loadProfileData(true);
  };

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
        return '#4CAF50';
      case 'expiring_soon':
        return '#FF9800';
      case 'expired':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getWorkPassStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4CAF50';
      case 'expired':
        return '#F44336';
      case 'suspended':
        return '#FF9800';
      case 'new':
        return '#2196F3';
      case 'renewal':
        return '#9C27B0';
      case 'under_renewal':
        return '#FF5722';
      default:
        return '#757575';
    }
  };

  const getAlertLevelColor = (level: string): string => {
    switch (level) {
      case 'warning':
        return '#FF9800';
      case 'urgent':
        return '#FF5722';
      case 'expired':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const handlePhotoUpdated = async (photoUrl: string) => {
    console.log('📸 Photo updated callback received:', photoUrl);
    
    if (profileData) {
      // Update the local state immediately for better UX
      const updatedProfileData = {
        ...profileData,
        user: {
          ...profileData.user,
          profileImage: photoUrl,
        },
      };
      
      console.log('🔄 Updating local profile state with new photo URL');
      setProfileData(updatedProfileData);
      
      // Optional: Refresh profile data from server after a short delay to ensure consistency
      setTimeout(() => {
        console.log('🔄 Refreshing profile data from server...');
        loadProfileData(false);
      }, 1000);
    }
  };

  const renderPersonalInfo = () => {
    if (!profileData) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.card}>
          <ProfilePhotoManager
            currentPhotoUrl={profileData.user.profileImage}
            onPhotoUpdated={handlePhotoUpdated}
          />
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileData.user.name}</Text>
          </View>

          {profileData.employeeCode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee Code:</Text>
              <Text style={styles.infoValue}>{profileData.employeeCode}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name:</Text>
            <Text style={styles.infoValue}>{profileData.user.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nationality:</Text>
            <Text style={styles.infoValue}>{profileData.nationality || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trade/Designation:</Text>
            <Text style={styles.infoValue}>{profileData.jobTitle || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{profileData.department || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company:</Text>
            <Text style={styles.infoValue}>{profileData.companyName || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{profileData.user.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{profileData.user.phone}</Text>
          </View>

          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={styles.changePasswordText}>🔒 Change Password</Text>
            <Text style={styles.changePasswordSubtext}>Update your account password</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCertifications = () => {
    if (!profileData?.certifications || !Array.isArray(profileData.certifications) || profileData.certifications.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <View style={styles.card}>
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📜</Text>
              <Text style={styles.emptyStateTitle}>No Certifications Found</Text>
              <Text style={styles.emptyStateMessage}>
                No certifications are currently on record. Contact your supervisor to add certifications.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        {profileData.certifications.map((cert) => (
          <View key={cert.id} style={styles.card}>
            <View style={styles.certificationHeader}>
              <Text style={styles.certificationName}>{cert.name || 'Unknown Certification'}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getCertificationStatusColor(cert.status || 'active') }
              ]}>
                <Text style={styles.statusText}>
                  {cert.status ? cert.status.replace('_', ' ').toUpperCase() : 'ACTIVE'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Certification Type:</Text>
              <Text style={styles.infoValue}>
                {cert.certificationType === 'NEW' ? 'New' : 'Renewal'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ownership:</Text>
              <Text style={styles.infoValue}>
                {cert.ownership === 'company' ? 'Company-sponsored' : 'Personal'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issuer:</Text>
              <Text style={styles.infoValue}>{cert.issuer || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Certificate #:</Text>
              <Text style={styles.infoValue}>{cert.certificateNumber || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issue Date:</Text>
              <Text style={styles.infoValue}>
                {cert.issueDate ? formatDate(cert.issueDate) : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expiry Date:</Text>
              <Text style={[
                styles.infoValue,
                cert.status === 'expired' && styles.expiredText,
                cert.status === 'expiring_soon' && styles.warningText
              ]}>
                {cert.expiryDate ? formatDate(cert.expiryDate) : 'No Expiry'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderWorkPass = () => {
    if (!profileData?.workPass) return null;

    const getWorkPassTypeDisplay = (type: string): string => {
      switch (type) {
        case 'WORK_PERMIT':
          return 'Work Permit';
        case 'S_PASS':
          return 'S Pass';
        case 'EMPLOYMENT_PASS':
          return 'Employment Pass';
        case 'DEPENDENT_PASS':
          return 'Dependent Pass';
        default:
          return 'Work Permit';
      }
    };

    const getWorkPassStatusDisplay = (status: string): string => {
      switch (status?.toLowerCase()) {
        case 'new':
          return 'New';
        case 'renewal':
          return 'Renewal';
        case 'under_renewal':
          return 'Under Renewal';
        case 'active':
          return 'Active';
        case 'expired':
          return 'Expired';
        case 'suspended':
          return 'Suspended';
        default:
          return 'Active';
      }
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Pass Details</Text>
        <View style={styles.card}>
          <View style={styles.certificationHeader}>
            <Text style={styles.certificationName}>Work Authorization</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getWorkPassStatusColor(profileData.workPass.status) }
            ]}>
              <Text style={styles.statusText}>
                {getWorkPassStatusDisplay(profileData.workPass.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Work Pass Type:</Text>
            <Text style={styles.infoValue}>
              {getWorkPassTypeDisplay(profileData.workPass.workPassType || 'WORK_PERMIT')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Work Permit Number:</Text>
            <Text style={styles.infoValue}>{profileData.workPass.passNumber}</Text>
          </View>

          {profileData.workPass.finNumber && profileData.workPass.finNumber !== profileData.workPass.passNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FIN Number:</Text>
              <Text style={styles.infoValue}>{profileData.workPass.finNumber}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Issue Date:</Text>
            <Text style={styles.infoValue}>{formatDate(profileData.workPass.issueDate)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expiry Date:</Text>
            <Text style={[
              styles.infoValue,
              profileData.workPass.status === 'expired' && styles.expiredText
            ]}>
              {formatDate(profileData.workPass.expiryDate)}
            </Text>
          </View>

          {/* Documents Section */}
          {(profileData.workPass.issuanceDoc || profileData.workPass.momDoc || 
            profileData.workPass.applicationDoc || profileData.workPass.medicalDoc) && (
            <>
              <View style={styles.documentsHeader}>
                <Text style={styles.documentsTitle}>Documents (View Only)</Text>
              </View>
              
              {profileData.workPass.issuanceDoc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Issuance Letter:</Text>
                  <Text style={styles.documentValue}>Available</Text>
                </View>
              )}

              {profileData.workPass.momDoc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>MOM Reference:</Text>
                  <Text style={styles.documentValue}>Available</Text>
                </View>
              )}

              {profileData.workPass.applicationDoc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Application Document:</Text>
                  <Text style={styles.documentValue}>Available</Text>
                </View>
              )}

              {profileData.workPass.medicalDoc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Medical Document:</Text>
                  <Text style={styles.documentValue}>Available</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderSalaryInfo = () => {
    if (!profileData?.salaryInfo) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Basic Salary:</Text>
            <Text style={styles.infoValue}>
              {profileData.salaryInfo.currency} {profileData.salaryInfo.basicSalary.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Allowances:</Text>
            <Text style={styles.infoValue}>
              {profileData.salaryInfo.currency} {profileData.salaryInfo.allowances.toLocaleString()}
            </Text>
          </View>
          
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Earnings:</Text>
            <Text style={styles.totalValue}>
              {profileData.salaryInfo.currency} {profileData.salaryInfo.totalEarnings.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCertificationAlerts = () => {
    if (!certificationAlerts || !Array.isArray(certificationAlerts) || certificationAlerts.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certification Alerts</Text>
        {certificationAlerts.map((alert) => (
          <TouchableOpacity
            key={alert.certificationId}
            style={[
              styles.alertCard,
              { borderLeftColor: getAlertLevelColor(alert.alertLevel) }
            ]}
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
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderHelpSupport = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Text style={styles.helpButtonText}>📞 Help & Support</Text>
            <Text style={styles.helpButtonSubtext}>Get help, report issues, or contact support</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading profile..." />;
  }

  if (error && !profileData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Profile Loading Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          
          <View style={styles.errorHintContainer}>
            <Text style={styles.errorHintTitle}>💡 Troubleshooting Tips:</Text>
            <Text style={styles.errorHintText}>• Check your internet connection</Text>
            <Text style={styles.errorHintText}>• Make sure you're logged in</Text>
            <Text style={styles.errorHintText}>• Try closing and reopening the app</Text>
            <Text style={styles.errorHintText}>• Contact support if issue persists</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => loadProfileData()}
          >
            <Text style={styles.retryButtonText}>🔄 Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.helpButton} 
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Text style={styles.helpButtonText}>📞 Contact Support</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
      {renderCertificationAlerts()}
      {renderPersonalInfo()}
      {renderCertifications()}
      {renderWorkPass()}
      {renderSalaryInfo()}
      {renderHelpSupport()}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileDetail: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  changePasswordButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginTop: 16,
  },
  changePasswordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  changePasswordSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    flex: 2,
    textAlign: 'right',
  },
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  certificationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expiredText: {
    color: '#F44336',
    fontWeight: '600',
  },
  warningText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '700',
    flex: 2,
    textAlign: 'right',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 300,
    width: '100%',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorHintContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  errorHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  errorHintText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  helpButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  helpButtonSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  documentsHeader: {
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  documentValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfileScreen;