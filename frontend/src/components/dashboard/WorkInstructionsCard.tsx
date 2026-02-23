import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface WorkInstruction {
  id: number;
  type: 'work_instruction' | 'safety_message' | 'supervisor_instruction' | 'transport_instruction' | 'warning' | 'reminder';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  isRead: boolean;
  source: 'admin' | 'manager' | 'supervisor' | 'system';
  sourceName?: string;
}

interface WorkInstructionsCardProps {
  instructions: WorkInstruction[];
  isLoading: boolean;
  onMarkAsRead?: (instructionId: number) => void;
  onViewAll?: () => void;
}

const WorkInstructionsCard: React.FC<WorkInstructionsCardProps> = ({
  instructions = [],
  isLoading,
  onMarkAsRead,
  onViewAll,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getInstructionIcon = (type: WorkInstruction['type']): string => {
    switch (type) {
      case 'work_instruction':
        return '📋';
      case 'safety_message':
        return '⚠️';
      case 'supervisor_instruction':
        return '👨‍💼';
      case 'transport_instruction':
        return '🚌';
      case 'warning':
        return '🚨';
      case 'reminder':
        return '🔔';
      default:
        return '📝';
    }
  };

  const getInstructionTypeLabel = (type: WorkInstruction['type']): string => {
    switch (type) {
      case 'work_instruction':
        return 'Work Instruction';
      case 'safety_message':
        return 'Safety Message';
      case 'supervisor_instruction':
        return 'Supervisor Instruction';
      case 'transport_instruction':
        return 'Transport Instruction';
      case 'warning':
        return 'Warning';
      case 'reminder':
        return 'Reminder';
      default:
        return 'Instruction';
    }
  };

  const getPriorityColor = (priority: WorkInstruction['priority']): string => {
    switch (priority) {
      case 'critical':
        return '#F44336';
      case 'high':
        return '#FF9800';
      case 'medium':
        return '#2196F3';
      case 'low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleToggleExpand = (instructionId: number) => {
    setExpandedId(expandedId === instructionId ? null : instructionId);
    
    // Mark as read when expanded
    if (expandedId !== instructionId && onMarkAsRead) {
      onMarkAsRead(instructionId);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📢 Daily Instructions & Messages</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading instructions...</Text>
        </View>
      </View>
    );
  }

  if (instructions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📢 Daily Instructions & Messages</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No instructions for today</Text>
          <Text style={styles.emptySubtext}>Check back later for updates</Text>
        </View>
      </View>
    );
  }

  // Sort instructions by priority and timestamp
  const sortedInstructions = [...instructions].sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const unreadCount = instructions.filter(inst => !inst.isRead).length;
  const criticalCount = instructions.filter(inst => inst.priority === 'critical').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📢 Daily Instructions & Messages</Text>
        <View style={styles.headerBadges}>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{String(unreadCount)} New</Text>
            </View>
          ) : null}
          {criticalCount > 0 ? (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalBadgeText}>{String(criticalCount)} Critical</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.instructionsContainer} showsVerticalScrollIndicator={false}>
        {sortedInstructions.slice(0, 5).map((instruction) => (
          <TouchableOpacity
            key={instruction.id}
            style={[
              styles.instructionCard,
              !instruction.isRead && styles.unreadCard,
              instruction.priority === 'critical' && styles.criticalCard,
            ]}
            onPress={() => handleToggleExpand(instruction.id)}
            activeOpacity={0.7}
          >
            <View style={styles.instructionHeader}>
              <View style={styles.instructionLeft}>
                <Text style={styles.instructionIcon}>
                  {getInstructionIcon(instruction.type)}
                </Text>
                <View style={styles.instructionInfo}>
                  <Text style={styles.instructionTitle} numberOfLines={1}>
                    {instruction.title}
                  </Text>
                  <View style={styles.instructionMeta}>
                    <Text style={styles.instructionType}>
                      {getInstructionTypeLabel(instruction.type)}
                    </Text>
                    <Text style={styles.instructionTime}>
                      {formatTime(instruction.timestamp)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.instructionRight}>
                <View 
                  style={[
                    styles.priorityIndicator,
                    { backgroundColor: getPriorityColor(instruction.priority) }
                  ]}
                />
                <Text style={styles.expandIcon}>
                  {expandedId === instruction.id ? '▼' : '▶'}
                </Text>
              </View>
            </View>

            {expandedId === instruction.id ? (
              <View style={styles.instructionContent}>
                <Text style={styles.instructionMessage}>
                  {String(instruction.message)}
                </Text>
                {instruction.sourceName ? (
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceLabel}>From:</Text>
                    <Text style={styles.sourceName}>
                      {String(instruction.sourceName)} ({String(instruction.source)})
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {instructions.length > 5 ? (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>
            View All Instructions ({String(instructions.length)})
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Quick Reference */}
      <View style={styles.quickReference}>
        <Text style={styles.quickReferenceTitle}>📌 Instruction Types</Text>
        <View style={styles.quickReferenceGrid}>
          <View style={styles.quickReferenceItem}>
            <Text style={styles.quickReferenceIcon}>📋</Text>
            <Text style={styles.quickReferenceText}>Work Instructions</Text>
          </View>
          <View style={styles.quickReferenceItem}>
            <Text style={styles.quickReferenceIcon}>⚠️</Text>
            <Text style={styles.quickReferenceText}>Safety Messages</Text>
          </View>
          <View style={styles.quickReferenceItem}>
            <Text style={styles.quickReferenceIcon}>👨‍💼</Text>
            <Text style={styles.quickReferenceText}>Supervisor Notes</Text>
          </View>
          <View style={styles.quickReferenceItem}>
            <Text style={styles.quickReferenceIcon}>🚌</Text>
            <Text style={styles.quickReferenceText}>Transport Info</Text>
          </View>
          <View style={styles.quickReferenceItem}>
            <Text style={styles.quickReferenceIcon}>🚨</Text>
            <Text style={styles.quickReferenceText}>Warnings</Text>
          </View>
          <View style={styles.quickReferenceItem}>
            <Text style={styles.quickReferenceIcon}>🔔</Text>
            <Text style={styles.quickReferenceText}>Reminders</Text>
          </View>
        </View>
        
        {/* Instructions Summary */}
        <View style={styles.instructionsSummary}>
          <Text style={styles.summaryTitle}>📊 Today's Instructions Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{String(instructions.length)}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F44336' }]}>
                {String(instructions.filter(i => i.priority === 'critical').length)}
              </Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#2196F3' }]}>
                {String(instructions.filter(i => !i.isRead).length)}
              </Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {String(instructions.filter(i => i.type === 'safety_message').length)}
              </Text>
              <Text style={styles.statLabel}>Safety</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  criticalBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  criticalBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionsContainer: {
    maxHeight: 300,
    marginBottom: 12,
  },
  instructionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  unreadCard: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  criticalCard: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instructionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  instructionInfo: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  instructionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionType: {
    fontSize: 12,
    color: '#757575',
  },
  instructionTime: {
    fontSize: 12,
    color: '#757575',
  },
  instructionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expandIcon: {
    fontSize: 12,
    color: '#757575',
  },
  instructionContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  instructionMessage: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 8,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceLabel: {
    fontSize: 12,
    color: '#757575',
  },
  sourceName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#424242',
  },
  viewAllButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickReference: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  quickReferenceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  quickReferenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickReferenceItem: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickReferenceIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  quickReferenceText: {
    fontSize: 10,
    color: '#757575',
  },
  instructionsSummary: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#757575',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#757575',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default WorkInstructionsCard;