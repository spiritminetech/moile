// Profile Photo Manager - Handle profile photo upload and management
// Requirements: 8.1, 8.2

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { workerApiService } from '../../services/api/WorkerApiService';
import LoadingOverlay from '../common/LoadingOverlay';

interface ProfilePhotoManagerProps {
  currentPhotoUrl?: string;
  onPhotoUpdated: (photoUrl: string) => void;
  disabled?: boolean;
}

const ProfilePhotoManager: React.FC<ProfilePhotoManagerProps> = ({
  currentPhotoUrl,
  onPhotoUpdated,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to update your profile photo.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImagePicker = async () => {
    if (disabled) return;

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    const options = [
      'Take Photo',
      'Choose from Library',
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
          title: 'Update Profile Photo',
        },
        (buttonIndex: number) => {
          if (buttonIndex === 0) {
            takePhoto();
          } else if (buttonIndex === 1) {
            pickFromLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Update Profile Photo',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickFromLibrary },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploading(true);

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (asset.fileSize && asset.fileSize > maxSize) {
        Alert.alert('Error', 'Photo size must be less than 5MB. Please choose a smaller photo.');
        return;
      }

      // Create file object for upload
      const file = {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: `profile_photo_${Date.now()}.jpg`,
      } as any;

      const response = await workerApiService.uploadProfilePhoto(file);

      if (response.success) {
        onPhotoUpdated(response.data.photoUrl);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to upload photo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const renderProfilePhoto = () => {
    if (currentPhotoUrl) {
      return (
        <Image
          source={{ uri: currentPhotoUrl }}
          style={styles.profilePhoto}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={styles.placeholderPhoto}>
        <Text style={styles.placeholderIcon}>📷</Text>
        <Text style={styles.placeholderText}>Add Photo</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isUploading} message="Uploading photo..." />
      
      <TouchableOpacity
        style={[styles.photoContainer, disabled && styles.disabled]}
        onPress={showImagePicker}
        disabled={disabled || isUploading}
      >
        {renderProfilePhoto()}
        
        <View style={styles.editOverlay}>
          <Text style={styles.editIcon}>✏️</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        Tap to {currentPhotoUrl ? 'change' : 'add'} your profile photo
      </Text>
      
      <Text style={styles.requirements}>
        • Square photos work best
        • Maximum file size: 5MB
        • Supported formats: JPG, PNG
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
  },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editIcon: {
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  instructions: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  requirements: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 250,
  },
});

export default ProfilePhotoManager;