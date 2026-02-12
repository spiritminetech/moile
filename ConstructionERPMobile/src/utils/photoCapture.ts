// Photo Capture Utility for Pickup/Drop Completion
// Handles camera access, photo compression, and GPS tagging
// Uses expo-image-picker for Expo compatibility

import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GeoLocation } from '../types';

export interface PhotoResult {
  uri: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  type: string;
  timestamp: Date;
  location?: GeoLocation;
}

/**
 * Request camera permissions
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Camera permission error:', error);
    return false;
  }
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media library permission is required to select photos. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Media library permission error:', error);
    return false;
  }
};

/**
 * Take photo with camera
 */
export const takePhoto = async (location?: GeoLocation): Promise<PhotoResult | null> => {
  try {
    console.log('📷 Opening camera...');
    
    // Request permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return null;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.4, // Further reduced from 0.6 to 0.4 for much faster uploads
      allowsEditing: false,
      exif: true,
    });
    
    // User cancelled
    if (result.canceled) {
      console.log('📷 User cancelled camera');
      return null;
    }
    
    // Get the photo asset
    const asset = result.assets?.[0];
    if (!asset || !asset.uri) {
      console.error('❌ No photo captured');
      return null;
    }
    
    console.log('✅ Photo captured:', asset.uri);
    
    // Extract filename from URI
    const uriParts = asset.uri.split('/');
    const fileName = uriParts[uriParts.length - 1] || `photo_${Date.now()}.jpg`;
    
    return {
      uri: asset.uri,
      fileName: fileName,
      fileSize: asset.fileSize || 0,
      width: asset.width || 0,
      height: asset.height || 0,
      type: asset.type || 'image',
      timestamp: new Date(),
      location: location || (asset.exif ? {
        latitude: asset.exif.GPSLatitude || location?.latitude || 0,
        longitude: asset.exif.GPSLongitude || location?.longitude || 0,
        accuracy: 10,
        timestamp: new Date(),
      } : location),
    };
  } catch (error: any) {
    console.error('❌ Photo capture error:', error);
    Alert.alert('Error', 'Failed to capture photo: ' + (error.message || 'Unknown error'));
    return null;
  }
};

/**
 * Select photo from gallery
 */
export const selectPhoto = async (location?: GeoLocation): Promise<PhotoResult | null> => {
  try {
    console.log('🖼️ Opening gallery...');
    
    // Request permission
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      return null;
    }
    
    // Launch image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.4, // Further reduced from 0.6 to 0.4 for much faster uploads
      allowsEditing: false,
      exif: true,
    });
    
    // User cancelled
    if (result.canceled) {
      console.log('🖼️ User cancelled gallery');
      return null;
    }
    
    // Get the photo asset
    const asset = result.assets?.[0];
    if (!asset || !asset.uri) {
      console.error('❌ No photo selected');
      return null;
    }
    
    console.log('✅ Photo selected:', asset.uri);
    
    // Extract filename from URI
    const uriParts = asset.uri.split('/');
    const fileName = uriParts[uriParts.length - 1] || `photo_${Date.now()}.jpg`;
    
    return {
      uri: asset.uri,
      fileName: fileName,
      fileSize: asset.fileSize || 0,
      width: asset.width || 0,
      height: asset.height || 0,
      type: asset.type || 'image',
      timestamp: new Date(),
      location: location || (asset.exif ? {
        latitude: asset.exif.GPSLatitude || location?.latitude || 0,
        longitude: asset.exif.GPSLongitude || location?.longitude || 0,
        accuracy: 10,
        timestamp: new Date(),
      } : location),
    };
  } catch (error: any) {
    console.error('❌ Photo selection error:', error);
    Alert.alert('Error', 'Failed to select photo: ' + (error.message || 'Unknown error'));
    return null;
  }
};

/**
 * Compress image before upload
 */
export const compressImage = async (photo: PhotoResult): Promise<PhotoResult> => {
  try {
    console.log('🗜️ Image already compressed by expo-image-picker');
    // expo-image-picker already compresses with quality: 0.8
    // No additional compression needed
    return photo;
  } catch (error) {
    console.error('❌ Image compression error:', error);
    return photo;
  }
};

/**
 * Show photo capture options
 */
export const showPhotoOptions = async (location?: GeoLocation): Promise<PhotoResult | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      '📸 Add Photo',
      'Choose photo source',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
        {
          text: '📷 Take Photo',
          onPress: async () => {
            const photo = await takePhoto(location);
            resolve(photo);
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            const photo = await selectPhoto(location);
            resolve(photo);
          },
        },
      ]
    );
  });
};

/**
 * Prepare photo for upload (FormData)
 */
export const preparePhotoForUpload = (photo: PhotoResult): FormData => {
  const formData = new FormData();
  
  // Add photo file
  formData.append('photo', {
    uri: photo.uri,
    type: 'image/jpeg',
    name: photo.fileName,
  } as any);
  
  // Add GPS location if available
  if (photo.location) {
    formData.append('latitude', photo.location.latitude.toString());
    formData.append('longitude', photo.location.longitude.toString());
    formData.append('accuracy', (photo.location.accuracy || 0).toString());
  }
  
  // Add timestamp
  formData.append('timestamp', photo.timestamp.toISOString());
  
  console.log('📤 Photo prepared for upload:', photo.fileName);
  
  return formData;
};
