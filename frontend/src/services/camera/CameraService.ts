// Camera Service - Handles photo capture, gallery selection, and image processing
// Requirements: 5.2

import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { ReportPhoto } from '../../types';

export interface CameraOptions {
  quality?: number; // 0-1, where 1 is highest quality
  maxWidth?: number;
  maxHeight?: number;
  allowsEditing?: boolean;
  mediaType?: 'photo' | 'video' | 'mixed';
}

export interface ImagePickerResponse {
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  width?: number;
  height?: number;
}

class CameraService {
  private defaultOptions: CameraOptions = {
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    allowsEditing: false,
    mediaType: 'photo',
  };

  /**
   * Request camera permissions
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos for reports',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS handles permissions automatically
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }

  /**
   * Request gallery permissions
   */
  async requestGalleryPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Gallery Permission',
            message: 'This app needs access to gallery to select photos for reports',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS handles permissions automatically
    } catch (error) {
      console.error('Gallery permission error:', error);
      return false;
    }
  }

  /**
   * Capture photo from camera
   */
  async capturePhoto(options?: CameraOptions): Promise<ReportPhoto | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return null;
      }

      // Mock implementation - in real app, use react-native-image-picker
      const mockResponse = await this.mockCameraCapture(options);
      
      if (mockResponse) {
        return this.processImageResponse(mockResponse, 'camera');
      }
      
      return null;
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
      return null;
    }
  }

  /**
   * Select photo from gallery
   */
  async selectFromGallery(options?: CameraOptions): Promise<ReportPhoto | null> {
    try {
      const hasPermission = await this.requestGalleryPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos');
        return null;
      }

      // Mock implementation - in real app, use react-native-image-picker
      const mockResponse = await this.mockGallerySelection(options);
      
      if (mockResponse) {
        return this.processImageResponse(mockResponse, 'gallery');
      }
      
      return null;
    } catch (error) {
      console.error('Gallery selection error:', error);
      Alert.alert('Error', 'Failed to select photo from gallery');
      return null;
    }
  }

  /**
   * Compress image for upload
   */
  async compressImage(photo: ReportPhoto, quality: number = 0.8): Promise<ReportPhoto> {
    try {
      // Mock compression - in real app, use react-native-image-resizer
      const compressedSize = Math.floor(photo.size * quality);
      
      return {
        ...photo,
        size: compressedSize,
        uri: photo.uri + '?compressed=true',
      };
    } catch (error) {
      console.error('Image compression error:', error);
      return photo; // Return original if compression fails
    }
  }

  /**
   * Create FormData for photo upload
   */
  createUploadFormData(photo: ReportPhoto): FormData {
    const formData = new FormData();
    
    formData.append('photo', {
      uri: photo.uri,
      type: photo.mimeType,
      name: photo.filename,
    } as any);
    
    formData.append('filename', photo.filename);
    formData.append('timestamp', photo.timestamp.toISOString());
    
    return formData;
  }

  /**
   * Validate photo before upload
   */
  validatePhoto(photo: ReportPhoto): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (photo.size > maxSize) {
      return {
        isValid: false,
        error: 'Photo size must be less than 10MB',
      };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(photo.mimeType)) {
      return {
        isValid: false,
        error: 'Only JPEG and PNG images are allowed',
      };
    }

    return { isValid: true };
  }

  /**
   * Get optimized camera options for construction reports
   */
  getConstructionReportOptions(): CameraOptions {
    return {
      quality: 0.8, // Good balance between quality and file size
      maxWidth: 1024,
      maxHeight: 1024,
      allowsEditing: false,
      mediaType: 'photo',
    };
  }

  // Private helper methods

  private async mockCameraCapture(options?: CameraOptions): Promise<ImagePickerResponse | null> {
    // Simulate camera capture delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful capture
    return {
      uri: `https://picsum.photos/800/600?random=${Date.now()}`,
      fileName: `camera_${Date.now()}.jpg`,
      fileSize: 1024 * 600, // 600KB
      type: 'image/jpeg',
      width: 800,
      height: 600,
    };
  }

  private async mockGallerySelection(options?: CameraOptions): Promise<ImagePickerResponse | null> {
    // Simulate gallery selection delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock successful selection
    return {
      uri: `https://picsum.photos/1024/768?random=${Date.now()}`,
      fileName: `gallery_${Date.now()}.jpg`,
      fileSize: 1024 * 800, // 800KB
      type: 'image/jpeg',
      width: 1024,
      height: 768,
    };
  }

  private processImageResponse(
    response: ImagePickerResponse,
    source: 'camera' | 'gallery'
  ): ReportPhoto {
    const timestamp = new Date();
    const filename = response.fileName || `${source}_${timestamp.getTime()}.jpg`;
    const photoId = `photo_${timestamp.getTime()}`;
    
    return {
      id: timestamp.getTime(),
      photoId,
      filename,
      url: response.uri, // Use URI as URL for local photos
      uri: response.uri,
      size: response.fileSize || 0,
      mimeType: response.type || 'image/jpeg',
      timestamp,
      category: 'progress', // Default category
      uploadedAt: timestamp.toISOString(),
    };
  }
}

// Export singleton instance
export const cameraService = new CameraService();
export default cameraService;