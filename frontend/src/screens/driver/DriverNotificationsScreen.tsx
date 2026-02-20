// DriverNotificationsScreen - Placeholder for driver-specific notifications
// Requirements: 16.2, 16.3, 16.5

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useOffline } from '../../store/context/OfflineContext';

// Import common components
import { 
  ConstructionButton, 
  ConstructionCard, 
  OfflineIndicator 
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

// Mock notification categories
const NOTIFICATION_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📬' },
  { id: 'tasks', label: 'Tasks', icon: '📋' },
  { id: 'trips', label: 'Trips', icon: '🚛' },
  { id: 'alerts', label: 'Alerts', icon: '⚠️' },
];

// Mock notifications data
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    category: 'tasks',
    title: 'New Transport Task Assigned',
    message: 'You have been assigned a new transport task for Site A',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    priority: 'high',
  },
  {
    id: '2',
    category: 'trips',
    title: 'Trip Update Required',
    message: 'Please update your current trip status',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    priority: 'medium',
  },
  {
    id: '3',
    category: 'alerts',
    title: 'Vehicle Maintenance Due',
    message: 'Your assigned vehicle is due for maintenance',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    priority: 'low',
  },
];

const DriverNotificationsScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { isOffline } = useOffline();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filteredNotifications = notifications.filter(
    (notif) => selectedCategory === 'all' || notif.category === selectedCategory
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    Alert.alert('Success', 'All notifications marked as read');
  }, []);

  const handleDeleteNotification = useCallback((notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications((prev) =>
              prev.filter((notif) => notif.id !== notificationId)
            );
          },
        },
      ]
    );
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF5722';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {NOTIFICATION_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.id && styles.categoryLabelActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mark All as Read Button */}
      {unreadCount > 0 && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Mark All as Read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateText}>No notifications</Text>
            <Text style={styles.emptyStateSubtext}>
              You're all caught up!
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <ConstructionCard
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread,
              ]}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationTitleRow}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  {!notification.read && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(notification.priority) },
                  ]}
                >
                  <Text style={styles.priorityBadgeText}>
                    {notification.priority}
                  </Text>
                </View>
              </View>

              <Text style={styles.notificationMessage}>
                {notification.message}
              </Text>

              <View style={styles.notificationFooter}>
                <Text style={styles.notificationTimestamp}>
                  {formatTimestamp(notification.timestamp)}
                </Text>
                <View style={styles.notificationActions}>
                  {!notification.read && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsRead(notification.id)}
                    >
                      <Text style={styles.actionButtonText}>Mark Read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteNotification(notification.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ConstructionCard>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: ConstructionTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ConstructionTheme.colors.text,
  },
  unreadBadge: {
    backgroundColor: ConstructionTheme.colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryContainer: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  categoryButtonActive: {
    backgroundColor: ConstructionTheme.colors.primary,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ConstructionTheme.colors.textSecondary,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: ConstructionTheme.colors.surface,
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: ConstructionTheme.colors.primary,
    alignSelf: 'flex-end',
  },
  markAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  notificationCard: {
    marginBottom: 12,
    padding: 16,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ConstructionTheme.colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ConstructionTheme.colors.primary,
    marginLeft: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    fontSize: 14,
    color: ConstructionTheme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: ConstructionTheme.colors.textSecondary,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: ConstructionTheme.colors.primary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF5722',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ConstructionTheme.colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: ConstructionTheme.colors.textSecondary,
  },
});

export default DriverNotificationsScreen;