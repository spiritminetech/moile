// Photo Manager Component - Handles photo capture, gallery selection, and management
// Requirements: 5.2

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { ReportPhoto } from '../../types';
import { cameraService } from '../../services/camera';

interface PhotoManagerProps {
  photos: ReportPhoto[];
  onPhotosChange: (photos: ReportPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  category?: 'progress' | 'issue' | 'completion' | 'material';
  label?: string;
  required?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - 64) / 3; // 3 photos per row with margins

const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  disabled = false,
  category = 'progress',
  label = 'Photos',
  required = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ReportPhoto | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleAddPhoto = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can only add up to ${maxPhotos} photos`);
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => capturePhoto() },
        { text: 'Gallery', onPress: () => selectFromGallery() },
      ]
    );
  };

  const capturePhoto = async () => {
    setIsLoading(true);
    try {
      const photo = await cameraService.capturePhoto(
        cameraService.getConstructionReportOptions()
      );
      
      if (photo) {
        // Validate photo before adding
        const validation = cameraService.validatePhoto(photo);
        if (!validation.isValid) {
          Alert.alert('Invalid Photo', validation.error);
          return;
        }

        // Compress photo for better performance
        const compressedPhoto = await cameraService.compressImage(photo, 0.8);
        const newPhotos = [...photos, compressedPhoto];
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsLoading(false);
    }
  };

  const selectFromGallery = async () => {
    setIsLoading(true);
    try {
      const photo = await cameraService.selectFromGallery(
        cameraService.getConstructionReportOptions()
      );
      
      if (photo) {
        // Validate photo before adding
        const validation = cameraService.validatePhoto(photo);
        if (!validation.isValid) {
          Alert.alert('Invalid Photo', validation.error);
          return;
        }

        // Compress photo for better performance
        const compressedPhoto = await cameraService.compressImage(photo, 0.8);
        const newPhotos = [...photos, compressedPhoto];
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo from gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = (photoId: string | number | undefined) => {
    if (!photoId) return;
    
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newPhotos = photos.filter(photo => 
              (photo.id && photo.id !== photoId) || 
              (photo.photoId && photo.photoId !== photoId)
            );
            onPhotosChange(newPhotos);
          },
        },
      ]
    );
  };

  const handlePhotoPress = (photo: ReportPhoto) => {
    setSelectedPhoto(photo);
    setShowPreview(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      {/* Photo Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id || photo.photoId} style={styles.photoContainer}>
              <TouchableOpacity
                style={styles.photoWrapper}
                onPress={() => handlePhotoPress(photo)}
              >
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoSize}>
                    {formatFileSize(photo.size)}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {!disabled && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(photo.id || photo.photoId)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add Photo Button */}
          {!disabled && photos.length < maxPhotos && (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleAddPhoto}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#666" />
              ) : (
                <>
                  <Text style={styles.addPhotoIcon}>📷</Text>
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Photo Count */}
      <View style={styles.photoInfo}>
        <Text style={styles.photoCount}>
          {photos.length} of {maxPhotos} photos
        </Text>
        {photos.length > 0 && (
          <Text style={styles.photoHint}>
            Tap photo to preview, long press to delete
          </Text>
        )}
      </View>

      {/* Photo Preview Modal */}
      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photo Preview</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                
                <View style={styles.photoDetails}>
                  <Text style={styles.photoDetailText}>
                    Filename: {selectedPhoto.filename}
                  </Text>
                  <Text style={styles.photoDetailText}>
                    Size: {formatFileSize(selectedPhoto.size)}
                  </Text>
                  <Text style={styles.photoDetailText}>
                    Taken: {selectedPhoto.timestamp.toLocaleString()}
                  </Text>
                </View>

                {!disabled && (
                  <TouchableOpacity
                    style={styles.deletePhotoButton}
                    onPress={() => {
                      handleDeletePhoto(selectedPhoto.id || selectedPhoto.photoId);
                      setShowPreview(false);
                    }}
                  >
                    <Text style={styles.deletePhotoButtonText}>Delete Photo</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  photoContainer: {
    marginHorizontal: 4,
    position: 'relative',
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: photoSize,
    height: photoSize,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoSize: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5722',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  addPhotoButton: {
    width: photoSize,
    height: photoSize,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    marginHorizontal: 4,
  },
  addPhotoIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  photoInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: screenWidth - 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  photoDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  photoDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deletePhotoButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  deletePhotoButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoManager;