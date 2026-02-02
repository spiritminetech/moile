// Change Password Screen - Allow workers to change their password
// Requirements: 8.1, 8.2

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { workerApiService } from '../../services/api/WorkerApiService';
import ConstructionInput from '../../components/common/ConstructionInput';
import ConstructionButton from '../../components/common/ConstructionButton';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { validatePasswordChange } from '../../utils/validation';

interface ChangePasswordScreenProps {
  navigation: any;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const validation = validatePasswordChange(oldPassword, newPassword, confirmPassword);
    
    if (!validation.isValid) {
      const newErrors: {[key: string]: string} = {};
      
      validation.errors.forEach(error => {
        if (error.includes('Current password')) {
          newErrors.oldPassword = error;
        } else if (error.includes('confirm') || error.includes('match')) {
          newErrors.confirmPassword = error;
        } else {
          newErrors.newPassword = error;
        }
      });
      
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await workerApiService.changePassword({
        oldPassword,
        newPassword,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Your password has been changed successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (oldPassword || newPassword || confirmPassword) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isLoading} message="Changing password..." />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Create a strong password to keep your account secure
          </Text>
        </View>

        <View style={styles.form}>
          <ConstructionInput
            label="Current Password"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            placeholder="Enter your current password"
            error={errors.oldPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ConstructionInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Enter your new password"
            error={errors.newPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ConstructionInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm your new password"
            error={errors.confirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirement}>• At least 8 characters long</Text>
            <Text style={styles.requirement}>• Contains uppercase and lowercase letters</Text>
            <Text style={styles.requirement}>• Contains at least one number</Text>
            <Text style={styles.requirement}>• Different from current password</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <ConstructionButton
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
        />
        <ConstructionButton
          title="Change Password"
          onPress={handleChangePassword}
          disabled={isLoading}
          style={styles.submitButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  form: {
    padding: 20,
    paddingTop: 10,
  },
  passwordRequirements: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default ChangePasswordScreen;