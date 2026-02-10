// AttachmentViewer Component - Display supervisor instruction attachments
// Requirements: Enhanced supervisor instructions with attachments

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface Attachment {
  type: 'photo' | 'document' | 'drawing' | 'video';
  filename: string;
  url: string;
  uploadedAt: string;
  uploadedBy: number;
  description?: string;
  fileSize?: number;
  mimeType?: string;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
  title?: string;
  onAttachmentPress?: (attachment: Attachment) => void;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  title = "Attachments",
  onAttachmentPress,
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Get attachment icon based on type
  const getAttachmentIcon = (type: string): string => {
    switch (type) {
      case 'photo':
        return '📷';
      case 'document':
        return '📄';
      case 'drawing':
        return '📐';
      case 'video':
        return '🎥';
      default:
        return '📎';
    }
  };

  // Get attachment type color
  const getAttachmentColor = (type: string): string => {
    switch (type) {
      case 'photo':
        return '#4CAF50';
      case 'document':
        return '#2196F3';
      case 'drawing':
        return '#FF9800';
      case 'video':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  // Format upload date
  const formatUploadDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Handle attachment press
  const handleAttachmentPress = (attachment: Attachment) => {
    if (onAttachmentPress) {
      onAttachmentPress(attachment);
    } else {
      // Default behavior - try to open the URL
      if (attachment.url) {
        Linking.canOpenURL(attachment.url).then((supported) => {
          if (supported) {
            Linking.openURL(attachment.url);
          } else {
            Alert.alert(
              'Cannot Open File',
              'Unable to open this attachment. Please check if you have the appropriate app installed.',
              [{ text: 'OK' }]
            );
          }
        });
      } else {
        Alert.alert(
          'File Not Available',
          'This attachment is not currently available.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{attachments.length}</Text>
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.attachmentsList}
      >
        {attachments.map((attachment, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.attachmentItem,
              { borderLeftColor: getAttachmentColor(attachment.type) }
            ]}
            onPress={() => handleAttachmentPress(attachment)}
            activeOpacity={0.7}
          >
            <View style={styles.attachmentHeader}>
              <Text style={styles.attachmentIcon}>
                {getAttachmentIcon(attachment.type)}
              </Text>
              <View style={[
                styles.typeBadge,
                { backgroundColor: getAttachmentColor(attachment.type) + '20' }
              ]}>
                <Text style={[
                  styles.typeText,
                  { color: getAttachmentColor(attachment.type) }
                ]}>
                  {attachment.type.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.filename} numberOfLines={2}>
              {attachment.filename}
            </Text>
            
            {attachment.description && (
              <Text style={styles.description} numberOfLines={3}>
                {attachment.description}
              </Text>
            )}
            
            <View style={styles.attachmentFooter}>
              {attachment.fileSize && (
                <Text style={styles.fileSize}>
                  {formatFileSize(attachment.fileSize)}
                </Text>
              )}
              <Text style={styles.uploadDate}>
                {formatUploadDate(attachment.uploadedAt)}
              </Text>
            </View>
            
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap to open</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  title: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: '600',
  },
  attachmentsList: {
    paddingRight: ConstructionTheme.spacing.md,
  },
  attachmentItem: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderLeftWidth: 4,
    padding: ConstructionTheme.spacing.md,
    marginRight: ConstructionTheme.spacing.md,
    width: 200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  attachmentIcon: {
    fontSize: 24,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    ...ConstructionTheme.typography.bodySmall,
    fontWeight: '600',
    fontSize: 10,
  },
  filename: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
    lineHeight: 18,
  },
  description: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    lineHeight: 16,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  attachmentFooter: {
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline + '30',
    paddingTop: ConstructionTheme.spacing.sm,
    marginTop: ConstructionTheme.spacing.sm,
  },
  fileSize: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '500',
    marginBottom: 2,
  },
  uploadDate: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  tapHint: {
    alignItems: 'center',
    marginTop: ConstructionTheme.spacing.sm,
    paddingTop: ConstructionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.primary + '20',
  },
  tapHintText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '500',
    fontSize: 11,
  },
});

export default AttachmentViewer;