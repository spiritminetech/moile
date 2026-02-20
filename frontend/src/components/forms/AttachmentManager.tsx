// Attachment Manager Component - Handle file uploads for requests
// Requirements: 6.1, 6.2, 6.3

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ReportPhoto } from '../../types';

interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface AttachmentManagerProps {
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  maxAttachments?: number;
  allowedTypes?: string[];
  title?: string;
  description?: string;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onAttachmentsChange,
  maxAttachments = 5,
  allowedTypes = ['image/*', 'application/pdf', 'text/*'],
  title = 'Attachments',
  description = 'Add supporting documents or images',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to upload attachments.'
      );
      return false;
    }
    return true;
  };

  const handleAddPhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file: AttachmentFile = {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0,
        } as AttachmentFile;

        if (attachments.length < maxAttachments) {
          onAttachmentsChange([...attachments, file]);
        } else {
          Alert.alert('Limit Reached', `You can only upload up to ${maxAttachments} attachments.`);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file: AttachmentFile = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        } as AttachmentFile;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
          return;
        }

        if (attachments.length < maxAttachments) {
          onAttachmentsChange([...attachments, file]);
        } else {
          Alert.alert('Limit Reached', `You can only upload up to ${maxAttachments} attachments.`);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    Alert.alert(
      'Remove Attachment',
      'Are you sure you want to remove this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newAttachments = attachments.filter((_, i) => i !== index);
            onAttachmentsChange(newAttachments);
          },
        },
      ]
    );
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('text/')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.limit}>
          {attachments.length}/{maxAttachments} attachments
        </Text>
      </View>

      {/* Add Buttons */}
      <View style={styles.addButtonsContainer}>
        <TouchableOpacity
          style={[styles.addButton, attachments.length >= maxAttachments && styles.addButtonDisabled]}
          onPress={handleAddPhoto}
          disabled={attachments.length >= maxAttachments}
        >
          <Text style={styles.addButtonIcon}>📷</Text>
          <Text style={styles.addButtonText}>Add Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, attachments.length >= maxAttachments && styles.addButtonDisabled]}
          onPress={handleAddDocument}
          disabled={attachments.length >= maxAttachments}
        >
          <Text style={styles.addButtonIcon}>📎</Text>
          <Text style={styles.addButtonText}>Add Document</Text>
        </TouchableOpacity>
      </View>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <ScrollView style={styles.attachmentsList} showsVerticalScrollIndicator={false}>
          {attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentItem}>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentIcon}>
                  {getFileIcon(attachment.type)}
                </Text>
                <View style={styles.attachmentDetails}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  <Text style={styles.attachmentMeta}>
                    {formatFileSize(attachment.size)} • {attachment.type.split('/')[1]?.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Preview for images */}
              {attachment.type.startsWith('image/') && (
                <Image source={{ uri: attachment.uri }} style={styles.imagePreview} />
              )}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveAttachment(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Empty State */}
      {attachments.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📎</Text>
          <Text style={styles.emptyStateText}>No attachments added</Text>
          <Text style={styles.emptyStateSubtext}>
            Add photos or documents to support your request
          </Text>
        </View>
      )}

      {/* File Type Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Supported file types:</Text>
        <Text style={styles.infoText}>
          Images (JPG, PNG), PDF documents, Text files
        </Text>
        <Text style={styles.infoText}>Maximum file size: 10MB per file</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  limit: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  addButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#BDBDBD',
  },
  addButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  attachmentsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  attachmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  attachmentMeta: {
    fontSize: 12,
    color: '#757575',
  },
  imagePreview: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#F0F4F8',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#1976D2',
    lineHeight: 16,
  },
});

export default AttachmentManager;