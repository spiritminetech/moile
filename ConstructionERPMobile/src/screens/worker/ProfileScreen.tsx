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
  Image,
} from 'react-native';
import { workerApiService } from '../../services/api/WorkerApiService';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ProfilePhotoManager from '../../components/forms/ProfilePhotoManager';

interface ProfileData {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    profileImage?: string;
    employeeId: string;
  };
  certifications: Array<{
    id: number;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    certificateNumber: string;
    status: 'active' | 'expired' | 'expiring_soon';
  }>;
  workPass: {
    id: number;
    passNumber: string;
    issueDate: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'suspended';
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

      // Load profile data and certification alerts in parallel
      const [profileResponse, alertsResponse] = await Promise.all([
        workerApiService.getProfile(),
        workerApiService.getCertificationExpiryAlerts(),
      ]);

      if (profileResponse.success) {
        setProfileData(profileResponse.data);
      } else {
        throw new Error(profileResponse.message || 'Failed to load profile data');
      }

      if (alertsResponse.success) {
        setCertificationAlerts(alertsResponse.data);
      } else {
        // Don't fail the whole screen if alerts fail
        console.warn('Failed to load certification alerts:', alertsResponse.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile data';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
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
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'expired':
        return '#F44336';
      case 'suspended':
        return '#FF9800';
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
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        {profileData.certifications.map((cert) => (
          <View key={cert.id} style={styles.card}>
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
          </View>
        ))}
      </View>
    );
  };

  const renderWorkPass = () => {
    if (!profileData?.workPass) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Pass</Text>
        <View style={styles.card}>
          <View style={styles.certificationHeader}>
            <Text style={styles.certificationName}>Work Authorization</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getWorkPassStatusColor(profileData.workPass.status) }
            ]}>
              <Text style={styles.statusText}>
                {profileData.workPass.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pass Number:</Text>
            <Text style={styles.infoValue}>{profileData.workPass.passNumber}</Text>
          </View>
          
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
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadProfileData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
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
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});

export default ProfileScreen;