// Attachment Viewer Component - Display and manage request attachments
// Requirements: 6.4, 6.5

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { workerApiService } from '../../services/api/WorkerApiService';

interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
}

interface AttachmentViewerProps {
  requestId: number;
  requestType: 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance-payment';
  attachments: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  canAddAttachments?: boolean;
  canDeleteAttachments?: boolean;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  requestId,
  requestType,
  attachments,
  onAttachmentsChange,
  canAddAttachments = false,
  canDeleteAttachments = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '')) {
      return '🖼️';
    }
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return '📄';
    }
    if (mimeType?.startsWith('text/') || ['txt', 'doc', 'docx'].includes(extension || '')) {
      return '📝';
    }
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return '📊';
    }
    return '📎';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleViewAttachment = async (attachment: Attachment) => {
    try {
      // For images, show in a modal or navigate to image viewer
      if (attachment.mimeType?.startsWith('image/')) {
        // You could implement an image viewer modal here
        Alert.alert('Image Viewer', 'Image viewing functionality would be implemented here');
        return;
      }

      // For other files, try to open with system default app
      const canOpen = await Linking.canOpenURL(attachment.filePath);
      if (canOpen) {
        await Linking.openURL(attachment.filePath);
      } else {
        Alert.alert('Cannot Open File', 'This file type cannot be opened on this device.');
      }
    } catch (error) {
      console.error('Error opening attachment:', error);
      Alert.alert('Error', 'Failed to open attachment');
    }
  };

  const handleDeleteAttachment = (attachment: Attachment) => {
    Alert.alert(
      'Delete Attachment',
      `Are you sure you want to delete "${attachment.fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to delete attachment
              // Note: This would need to be implemented in the backend
              Alert.alert('Delete Functionality', 'Attachment deletion would be implemented here');
              
              // Update local state
              if (onAttachmentsChange) {
                const updatedAttachments = attachments.filter(a => a.id !== attachment.id);
                onAttachmentsChange(updatedAttachments);
              }
            } catch (error) {
              console.error('Error deleting attachment:', error);
              Alert.alert('Error', 'Failed to delete attachment');
            }
          },
        },
      ]
    );
  };

  const handleAddAttachments = async () => {
    try {
      setIsUploading(true);
      
      // This would open the AttachmentManager component
      // For now, show a placeholder
      Alert.alert('Add Attachments', 'Attachment upload functionality would be implemented here');
      
      // After successful upload, you would call:
      // const result = await workerApiService.uploadRequestAttachments(requestId, requestType, files);
      // if (result.success && onAttachmentsChange) {
      //   onAttachmentsChange([...attachments, ...result.data.attachments]);
      // }
      
    } catch (error) {
      console.error('Error adding attachments:', error);
      Alert.alert('Error', 'Failed to add attachments');
    } finally {
      setIsUploading(false);
    }
  };

  if (attachments.length === 0 && !canAddAttachments) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>📎</Text>
        <Text style={styles.emptyStateText}>No attachments</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Attachments ({attachments.length})
        </Text>
        {canAddAttachments && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddAttachments}
            disabled={isUploading}
          >
            <Text style={styles.addButtonText}>
              {isUploading ? 'Uploading...' : '+ Add'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Attachments List */}
      {attachments.length > 0 ? (
        <ScrollView style={styles.attachmentsList} showsVerticalScrollIndicator={false}>
          {attachments.map((attachment) => (
            <TouchableOpacity
              key={attachment.id}
              style={styles.attachmentItem}
              onPress={() => handleViewAttachment(attachment)}
              activeOpacity={0.7}
            >
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentIcon}>
                  {getFileIcon(attachment.fileName, attachment.mimeType)}
                </Text>
                <View style={styles.attachmentDetails}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                  <View style={styles.attachmentMeta}>
                    <Text style={styles.attachmentSize}>
                      {formatFileSize(attachment.fileSize)}
                    </Text>
                    {attachment.uploadedAt && (
                      <>
                        <Text style={styles.metaSeparator}>•</Text>
                        <Text style={styles.attachmentDate}>
                          {formatDate(attachment.uploadedAt)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Preview for images */}
              {attachment.mimeType?.startsWith('image/') && (
                <Image 
                  source={{ uri: attachment.filePath }} 
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              )}

              {/* Actions */}
              <View style={styles.attachmentActions}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewAttachment(attachment)}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
                
                {canDeleteAttachments && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAttachment(attachment)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📎</Text>
          <Text style={styles.emptyStateText}>No attachments yet</Text>
          {canAddAttachments && (
            <Text style={styles.emptyStateSubtext}>
              Tap "Add" to upload supporting documents
            </Text>
          )}
        </View>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Tap any attachment to view or download
        </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attachmentsList: {
    maxHeight: 300,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  attachmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#757575',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#757575',
    marginHorizontal: 6,
  },
  attachmentDate: {
    fontSize: 12,
    color: '#757575',
  },
  imagePreview: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  attachmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    marginBottom: 12,
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
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 11,
    color: '#1976D2',
    textAlign: 'center',
  },
});

export default AttachmentViewer;