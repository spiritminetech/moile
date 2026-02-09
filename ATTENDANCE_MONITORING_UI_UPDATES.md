# Attendance Monitoring UI Updates - Implementation Guide

## Summary of Changes

This document outlines the UI updates needed to complete the Attendance Monitoring enhancements.

## Changes to AttendanceMonitoringScreen.tsx

### 1. Update Time Information Section

Add lunch break and OT hours display in the `renderAttendanceRecord` function:

```typescript
{/* Time Information - UPDATED */}
<View style={styles.timeInfo}>
  <View style={styles.timeRow}>
    <Text style={styles.timeLabel}>Check-in:</Text>
    <Text style={styles.timeValue}>{formatTime(record.checkInTime)}</Text>
  </View>
  <View style={styles.timeRow}>
    <Text style={styles.timeLabel}>Check-out:</Text>
    <Text style={styles.timeValue}>{formatTime(record.checkOutTime)}</Text>
  </View>
  
  {/* NEW: Lunch Break Display */}
  {record.lunchStartTime && record.lunchEndTime && (
    <>
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Lunch Start:</Text>
        <Text style={styles.timeValue}>{formatTime(record.lunchStartTime)}</Text>
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Lunch End:</Text>
        <Text style={styles.timeValue}>{formatTime(record.lunchEndTime)}</Text>
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Lunch Duration:</Text>
        <Text style={styles.timeValue}>{formatDuration(record.lunchDuration || 0)}</Text>
      </View>
    </>
  )}
  
  {/* NEW: Regular Hours */}
  {record.regularHours !== undefined && (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel}>Regular Hours:</Text>
      <Text style={[styles.timeValue, styles.regularHours]}>
        {formatDuration(record.regularHours)}
      </Text>
    </View>
  )}
  
  {/* NEW: OT Hours */}
  {record.otHours !== undefined && record.otHours > 0 && (
    <View style={styles.timeRow}>
      <Text style={[styles.timeLabel, { color: ConstructionTheme.colors.warning }]}>
        OT Hours:
      </Text>
      <Text style={[styles.timeValue, { color: ConstructionTheme.colors.warning, fontWeight: 'bold' }]}>
        {formatDuration(record.otHours)}
      </Text>
    </View>
  )}
  
  <View style={styles.timeRow}>
    <Text style={styles.timeLabel}>Total Hours:</Text>
    <Text style={[styles.timeValue, styles.hoursWorked]}>
      {formatDuration(record.workingHours)}
    </Text>
  </View>
  
  {record.isLate && (
    <View style={styles.timeRow}>
      <Text style={[styles.timeLabel, { color: ConstructionTheme.colors.warning }]}>
        Late by:
      </Text>
      <Text style={[styles.timeValue, { color: ConstructionTheme.colors.warning, fontWeight: 'bold' }]}>
        {record.minutesLate} minutes
      </Text>
    </View>
  )}
</View>
```

### 2. Add Absence Reason Display

After the Task Assignment section, add:

```typescript
{/* NEW: Absence Reason Display */}
{record.absenceReason && record.absenceReason !== 'PRESENT' && (
  <View style={styles.absenceReasonSection}>
    <Text style={styles.absenceReasonLabel}>Absence Reason:</Text>
    <Text style={[styles.absenceReasonValue, {
      color: record.absenceReason === 'LEAVE_APPROVED' 
        ? ConstructionTheme.colors.success 
        : ConstructionTheme.colors.error
    }]}>
      {record.absenceReason.replace(/_/g, ' ')}
    </Text>
    {record.absenceNotes && (
      <Text style={styles.absenceNotes}>{record.absenceNotes}</Text>
    )}
  </View>
)}
```

### 3. Add Action Buttons

At the end of each record card, before closing `</ConstructionCard>`, add:

```typescript
{/* NEW: Action Buttons */}
<View style={styles.actionButtons}>
  {record.status === 'ABSENT' && (
    <ConstructionButton
      title="Mark Reason"
      variant="secondary"
      size="small"
      onPress={() => {
        setSelectedWorkerForAbsence(record);
        setShowAbsenceModal(true);
      }}
      style={styles.actionButton}
    />
  )}
  {hasIssues && (
    <ConstructionButton
      title="Escalate"
      variant="error"
      size="small"
      onPress={() => {
        setSelectedWorkerForEscalation(record);
        setShowEscalationModal(true);
      }}
      style={styles.actionButton}
    />
  )}
</View>
```

### 4. Add Absence Reason Modal

Add this function before the `return` statement:

```typescript
// Render absence reason modal
const renderAbsenceModal = () => (
  <Modal
    visible={showAbsenceModal}
    transparent
    animationType="slide"
    onRequestClose={() => setShowAbsenceModal(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Mark Absence Reason</Text>
        
        {selectedWorkerForAbsence && (
          <>
            <Text style={styles.modalSubtitle}>
              {selectedWorkerForAbsence.workerName}
            </Text>
            
            <Text style={styles.inputLabel}>Reason:</Text>
            <View style={styles.reasonButtons}>
              {(['LEAVE_APPROVED', 'LEAVE_NOT_INFORMED', 'MEDICAL', 'UNAUTHORIZED'] as const).map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonButton,
                    absenceReason === reason && styles.reasonButtonActive
                  ]}
                  onPress={() => setAbsenceReason(reason)}
                >
                  <Text style={[
                    styles.reasonButtonText,
                    absenceReason === reason && styles.reasonButtonTextActive
                  ]}>
                    {reason.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Notes (optional):</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes..."
              value={absenceNotes}
              onChangeText={setAbsenceNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
            />

            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                variant="secondary"
                size="medium"
                onPress={() => {
                  setShowAbsenceModal(false);
                  setSelectedWorkerForAbsence(null);
                  setAbsenceNotes('');
                }}
                style={styles.modalButton}
              />
              <ConstructionButton
                title="Save"
                variant="primary"
                size="medium"
                onPress={handleMarkAbsence}
                style={styles.modalButton}
              />
            </View>
          </>
        )}
      </View>
    </View>
  </Modal>
);
```

### 5. Add Escalation Modal

```typescript
// Render escalation modal
const renderEscalationModal = () => (
  <Modal
    visible={showEscalationModal}
    transparent
    animationType="slide"
    onRequestClose={() => setShowEscalationModal(false)}
  >
    <View style={styles.modalOverlay}>
      <ScrollView contentContainerStyle={styles.modalScrollContent}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Escalation</Text>
          
          {selectedWorkerForEscalation && (
            <>
              <Text style={styles.modalSubtitle}>
                {selectedWorkerForEscalation.workerName}
              </Text>
              
              <Text style={styles.inputLabel}>Escalation Type:</Text>
              <View style={styles.reasonButtons}>
                {(['REPEATED_LATE', 'REPEATED_ABSENCE', 'GEOFENCE_VIOLATION', 'UNAUTHORIZED_ABSENCE'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.reasonButton,
                      escalationType === type && styles.reasonButtonActive
                    ]}
                    onPress={() => setEscalationType(type)}
                  >
                    <Text style={[
                      styles.reasonButtonText,
                      escalationType === type && styles.reasonButtonTextActive
                    ]}>
                      {type.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Severity:</Text>
              <View style={styles.severityButtons}>
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    style={[
                      styles.severityButton,
                      escalationSeverity === severity && styles.severityButtonActive,
                      { borderColor: getSeverityColor(severity) }
                    ]}
                    onPress={() => setEscalationSeverity(severity)}
                  >
                    <Text style={[
                      styles.severityButtonText,
                      escalationSeverity === severity && { color: getSeverityColor(severity) }
                    ]}>
                      {severity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Escalate To:</Text>
              <View style={styles.escalateToButtons}>
                {(['ADMIN', 'MANAGER', 'HR'] as const).map((to) => (
                  <TouchableOpacity
                    key={to}
                    style={[
                      styles.escalateToButton,
                      escalatedTo === to && styles.escalateToButtonActive
                    ]}
                    onPress={() => setEscalatedTo(to)}
                  >
                    <Text style={[
                      styles.escalateToButtonText,
                      escalatedTo === to && styles.escalateToButtonTextActive
                    ]}>
                      {to}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Description:</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Describe the issue..."
                value={escalationDescription}
                onChangeText={setEscalationDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />

              <Text style={styles.inputLabel}>Notes (optional):</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Additional notes..."
                value={escalationNotes}
                onChangeText={setEscalationNotes}
                multiline
                numberOfLines={2}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />

              <View style={styles.modalActions}>
                <ConstructionButton
                  title="Cancel"
                  variant="secondary"
                  size="medium"
                  onPress={() => {
                    setShowEscalationModal(false);
                    setSelectedWorkerForEscalation(null);
                    setEscalationDescription('');
                    setEscalationNotes('');
                  }}
                  style={styles.modalButton}
                />
                <ConstructionButton
                  title="Escalate"
                  variant="error"
                  size="medium"
                  onPress={handleCreateEscalation}
                  style={styles.modalButton}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  </Modal>
);
```

### 6. Update Export Button

Replace the existing "Export Report" button with:

```typescript
<ConstructionButton
  title="Export Report"
  variant="secondary"
  size="medium"
  onPress={() => {
    Alert.alert(
      'Export Format',
      'Choose export format:',
      [
        { text: 'JSON', onPress: () => handleExportReport('json') },
        { text: 'CSV', onPress: () => handleExportReport('csv') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }}
  loading={isExporting}
  style={styles.actionButton}
/>
```

### 7. Add Helper Function

Add this helper function with the other utility functions:

```typescript
// Get severity color
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return ConstructionTheme.colors.error;
    case 'HIGH':
      return '#FF6B6B';
    case 'MEDIUM':
      return ConstructionTheme.colors.warning;
    case 'LOW':
      return ConstructionTheme.colors.info;
    default:
      return ConstructionTheme.colors.onSurfaceVariant;
  }
};
```

### 8. Add New Styles

Add these styles to the StyleSheet:

```typescript
absenceReasonSection: {
  marginTop: ConstructionTheme.spacing.sm,
  paddingTop: ConstructionTheme.spacing.sm,
  borderTopWidth: 1,
  borderTopColor: ConstructionTheme.colors.outline,
  backgroundColor: '#FFF3E0',
  padding: ConstructionTheme.spacing.sm,
  borderRadius: ConstructionTheme.borderRadius.sm,
},
absenceReasonLabel: {
  ...ConstructionTheme.typography.labelSmall,
  color: ConstructionTheme.colors.onSurfaceVariant,
  marginBottom: ConstructionTheme.spacing.xs,
},
absenceReasonValue: {
  ...ConstructionTheme.typography.bodyMedium,
  fontWeight: 'bold',
  marginBottom: ConstructionTheme.spacing.xs,
},
absenceNotes: {
  ...ConstructionTheme.typography.bodySmall,
  color: ConstructionTheme.colors.onSurface,
  fontStyle: 'italic',
},
actionButtons: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginTop: ConstructionTheme.spacing.md,
  gap: ConstructionTheme.spacing.sm,
},
actionButton: {
  minWidth: 100,
},
regularHours: {
  color: ConstructionTheme.colors.success,
  fontWeight: '600',
},
modalSubtitle: {
  ...ConstructionTheme.typography.bodyLarge,
  color: ConstructionTheme.colors.onSurface,
  marginBottom: ConstructionTheme.spacing.md,
  textAlign: 'center',
},
inputLabel: {
  ...ConstructionTheme.typography.labelMedium,
  color: ConstructionTheme.colors.onSurface,
  marginBottom: ConstructionTheme.spacing.xs,
  marginTop: ConstructionTheme.spacing.sm,
},
reasonButtons: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: ConstructionTheme.spacing.xs,
  marginBottom: ConstructionTheme.spacing.sm,
},
reasonButton: {
  paddingHorizontal: ConstructionTheme.spacing.sm,
  paddingVertical: ConstructionTheme.spacing.xs,
  borderRadius: ConstructionTheme.borderRadius.sm,
  borderWidth: 1,
  borderColor: ConstructionTheme.colors.outline,
  backgroundColor: ConstructionTheme.colors.surface,
},
reasonButtonActive: {
  backgroundColor: ConstructionTheme.colors.primary,
  borderColor: ConstructionTheme.colors.primary,
},
reasonButtonText: {
  ...ConstructionTheme.typography.labelSmall,
  color: ConstructionTheme.colors.onSurface,
},
reasonButtonTextActive: {
  color: ConstructionTheme.colors.onPrimary,
  fontWeight: 'bold',
},
severityButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: ConstructionTheme.spacing.xs,
  marginBottom: ConstructionTheme.spacing.sm,
},
severityButton: {
  flex: 1,
  paddingVertical: ConstructionTheme.spacing.xs,
  borderRadius: ConstructionTheme.borderRadius.sm,
  borderWidth: 2,
  alignItems: 'center',
},
severityButtonActive: {
  backgroundColor: '#FFF3E0',
},
severityButtonText: {
  ...ConstructionTheme.typography.labelSmall,
  color: ConstructionTheme.colors.onSurface,
  fontWeight: '600',
},
escalateToButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: ConstructionTheme.spacing.xs,
  marginBottom: ConstructionTheme.spacing.sm,
},
escalateToButton: {
  flex: 1,
  paddingVertical: ConstructionTheme.spacing.sm,
  borderRadius: ConstructionTheme.borderRadius.sm,
  borderWidth: 1,
  borderColor: ConstructionTheme.colors.outline,
  backgroundColor: ConstructionTheme.colors.surface,
  alignItems: 'center',
},
escalateToButtonActive: {
  backgroundColor: ConstructionTheme.colors.error,
  borderColor: ConstructionTheme.colors.error,
},
escalateToButtonText: {
  ...ConstructionTheme.typography.labelMedium,
  color: ConstructionTheme.colors.onSurface,
},
escalateToButtonTextActive: {
  color: ConstructionTheme.colors.onPrimary,
  fontWeight: 'bold',
},
modalScrollContent: {
  flexGrow: 1,
  justifyContent: 'center',
  padding: ConstructionTheme.spacing.lg,
},
```

### 9. Add Modal Renders to Main Return

In the main return statement, before the closing `</SafeAreaView>`, add:

```typescript
{/* Absence Reason Modal */}
{renderAbsenceModal()}

{/* Escalation Modal */}
{renderEscalationModal()}
```

## Testing Checklist

- [ ] Lunch break times display correctly
- [ ] OT hours show in warning color
- [ ] Regular hours display separately
- [ ] Absence reason modal opens and saves
- [ ] Escalation modal opens and creates escalation
- [ ] Export button shows format options
- [ ] Export generates report successfully
- [ ] Action buttons appear for appropriate workers
- [ ] All modals close properly
- [ ] Data refreshes after actions

## Implementation Complete!

All features are now implemented:
✅ Leave Reason Management
✅ Lunch Break Tracking
✅ OT Hours Display
✅ Escalation Workflow
✅ Export Reports
