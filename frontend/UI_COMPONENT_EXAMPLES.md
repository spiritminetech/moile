# UI Component Usage Examples

## Enhanced ConstructionButton Component

### Basic Usage

```typescript
import ConstructionButton from '../components/common/ConstructionButton';

// Simple button
<ConstructionButton
  title="Save"
  onPress={handleSave}
/>

// Button with icon
<ConstructionButton
  title="Start Route"
  icon="🚀"
  onPress={handleStart}
  variant="primary"
  size="large"
/>

// Button with subtitle (NEW)
<ConstructionButton
  title="Start Route & Navigate"
  subtitle="Opens Google Maps"
  icon="🗺️"
  onPress={handleNavigate}
  variant="success"
  size="large"
/>
```

### All Button Variants

```typescript
// Primary action (orange)
<ConstructionButton
  title="Start Route"
  subtitle="Begin your trip"
  icon="🚀"
  variant="primary"
  size="large"
  onPress={handlePrimary}
/>

// Secondary action (green)
<ConstructionButton
  title="Complete Task"
  subtitle="Mark as done"
  icon="✅"
  variant="secondary"
  size="large"
  onPress={handleSecondary}
/>

// Success action (green)
<ConstructionButton
  title="Confirm"
  subtitle="Save changes"
  icon="✓"
  variant="success"
  size="medium"
  onPress={handleSuccess}
/>

// Warning action (amber)
<ConstructionButton
  title="Report Issue"
  subtitle="Something wrong?"
  icon="⚠️"
  variant="warning"
  size="medium"
  onPress={handleWarning}
/>

// Error/Danger action (red)
<ConstructionButton
  title="Emergency"
  subtitle="Call for help"
  icon="🚨"
  variant="error"
  size="large"
  onPress={handleEmergency}
/>

// Outlined/Secondary style
<ConstructionButton
  title="View Details"
  subtitle="More information"
  icon="📋"
  variant="outlined"
  size="medium"
  onPress={handleView}
/>

// Neutral action (gray)
<ConstructionButton
  title="Cancel"
  icon="✕"
  variant="neutral"
  size="medium"
  onPress={handleCancel}
/>
```

### Button Sizes

```typescript
// Small (48px height) - For secondary actions
<ConstructionButton
  title="Skip"
  size="small"
  variant="outlined"
  onPress={handleSkip}
/>

// Medium (60px height) - Default, good for most actions
<ConstructionButton
  title="Continue"
  size="medium"
  variant="primary"
  onPress={handleContinue}
/>

// Large (72px height) - Recommended for primary actions with gloves
<ConstructionButton
  title="Start Route & Navigate"
  subtitle="Opens Google Maps"
  icon="🗺️"
  size="large"
  variant="success"
  onPress={handleStart}
/>

// Extra Large (80px height) - For critical actions
<ConstructionButton
  title="EMERGENCY"
  subtitle="Call 911"
  icon="🚨"
  size="extraLarge"
  variant="error"
  onPress={handleEmergency}
/>
```

### Button States

```typescript
// Loading state
<ConstructionButton
  title="Saving..."
  loading={true}
  variant="primary"
  size="large"
  onPress={handleSave}
/>

// Disabled state
<ConstructionButton
  title="Start Route"
  subtitle="Complete previous task first"
  disabled={true}
  variant="primary"
  size="large"
  onPress={handleStart}
/>

// Full width
<ConstructionButton
  title="Submit Report"
  subtitle="Send to supervisor"
  icon="📤"
  fullWidth={true}
  variant="primary"
  size="large"
  onPress={handleSubmit}
/>
```

### Custom Styling

```typescript
// Custom button style
<ConstructionButton
  title="Custom Button"
  subtitle="With custom styling"
  variant="primary"
  size="large"
  style={{
    marginTop: 20,
    borderRadius: 16,
  }}
  textStyle={{
    fontSize: 20,
    fontWeight: '800',
  }}
  subtitleStyle={{
    fontSize: 14,
    fontStyle: 'italic',
  }}
  onPress={handleCustom}
/>
```

---

## Enhanced TransportTaskCard Component

### Basic Usage

```typescript
import TransportTaskCard from '../components/driver/TransportTaskCard';

<TransportTaskCard
  task={transportTask}
  onStartRoute={handleStartRoute}
  onViewRoute={handleViewRoute}
  onUpdateStatus={handleUpdateStatus}
/>
```

### With Active Task Check

```typescript
// Disable "Start Route" if another task is active
const hasActiveTask = transportTasks.some(t => 
  t.status === 'en_route_pickup' || 
  t.status === 'en_route_dropoff'
);

<TransportTaskCard
  task={task}
  onStartRoute={handleStartRoute}
  onViewRoute={handleViewRoute}
  onUpdateStatus={handleUpdateStatus}
  hasActiveTask={hasActiveTask}
/>
```

### Task Card Features

The enhanced TransportTaskCard now includes:

1. **Progress Bar**: Visual indicator of worker check-in progress
2. **Icon-based Summary**: Easy-to-scan worker and location counts
3. **Status Badges**: Color-coded status with emoji icons
4. **Enhanced Buttons**: Large, glove-friendly buttons with subtitles
5. **Clear Hierarchy**: Important information stands out

---

## Progress Indicator Pattern

### Worker Check-in Progress

```typescript
// Calculate progress
const workerProgress = task.totalWorkers > 0 
  ? (task.checkedInWorkers / task.totalWorkers) * 100 
  : 0;

// Display progress bar
<View style={styles.progressContainer}>
  <View style={styles.progressBar}>
    <View style={[
      styles.progressFill, 
      { width: `${workerProgress}%` }
    ]} />
  </View>
  <Text style={styles.progressText}>
    {task.checkedInWorkers}/{task.totalWorkers} workers checked in
  </Text>
</View>

// Styles
const styles = StyleSheet.create({
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32', // Success green
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    fontWeight: '600',
  },
});
```

---

## Status Badge Pattern

### Color-coded Status Badges

```typescript
// Get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#F57C00'; // Warning amber
    case 'en_route_pickup':
      return '#1565C0'; // Info blue
    case 'pickup_complete':
      return '#2E7D32'; // Success green
    case 'en_route_dropoff':
      return '#FF6B00'; // Primary orange
    case 'completed':
      return '#2E7D32'; // Success green
    default:
      return '#607D8B'; // Neutral gray
  }
};

// Get status text with emoji
const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return '⏳ Ready to Start';
    case 'en_route_pickup':
      return '🚛 En Route to Pickup';
    case 'pickup_complete':
      return '✅ Pickup Complete';
    case 'en_route_dropoff':
      return '🚛 En Route to Site';
    case 'completed':
      return '✅ Trip Complete';
    default:
      return 'Unknown Status';
  }
};

// Display status badge
<View style={[
  styles.statusBadge, 
  { backgroundColor: getStatusColor(task.status) }
]}>
  <Text style={styles.statusText}>
    {getStatusText(task.status)}
  </Text>
</View>

// Styles
const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
```

---

## Icon-based Summary Pattern

### Visual Summary Cards

```typescript
<View style={styles.summaryContainer}>
  <View style={styles.summaryItem}>
    <Text style={styles.summaryIcon}>👥</Text>
    <Text style={styles.summaryValue}>{totalWorkers}</Text>
    <Text style={styles.summaryLabel}>Workers</Text>
  </View>
  
  <View style={styles.summaryItem}>
    <Text style={styles.summaryIcon}>✅</Text>
    <Text style={styles.summaryValue}>{checkedInWorkers}</Text>
    <Text style={styles.summaryLabel}>Checked In</Text>
  </View>
  
  <View style={styles.summaryItem}>
    <Text style={styles.summaryIcon}>📍</Text>
    <Text style={styles.summaryValue}>{pickupLocations}</Text>
    <Text style={styles.summaryLabel}>Locations</Text>
  </View>
</View>

// Styles
const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#424242',
    marginTop: 4,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 28,
    color: '#FF6B00',
    fontWeight: '700',
  },
});
```

---

## Navigation Flow Pattern

### Auto-open Google Maps

```typescript
const handleStartRoute = async (taskId: number) => {
  try {
    // 1. Update route status
    const response = await driverApiService.updateTransportTaskStatus(
      taskId, 
      'en_route_pickup',
      currentLocation,
      'Route started'
    );

    if (response.success) {
      // 2. Get pickup location coordinates
      const task = transportTasks.find(t => t.taskId === taskId);
      const pickupLocation = task?.pickupLocations[0];
      
      if (pickupLocation?.coordinates) {
        // 3. Open Google Maps automatically
        const navUrl = `https://maps.google.com/?q=${pickupLocation.coordinates.latitude},${pickupLocation.coordinates.longitude}`;
        
        try {
          await Linking.openURL(navUrl);
          
          // 4. Show success message
          Alert.alert(
            '✅ Route Started',
            'Google Maps navigation opened.',
            [{ text: 'OK' }]
          );
        } catch (navError) {
          // 5. Handle navigation error
          Alert.alert(
            'Navigation Error',
            'Could not open Google Maps. Please navigate manually.',
            [{ text: 'OK' }]
          );
        }
      }
      
      // 6. Refresh task list
      await loadTransportTasks();
    }
  } catch (error) {
    // Handle errors
    Alert.alert('Error', error.message);
  }
};
```

---

## Button Layout Patterns

### Vertical Stack (Recommended for Primary Actions)

```typescript
<View style={styles.actionsContainer}>
  {/* Primary action - Full width, large */}
  <ConstructionButton
    title="Start Route & Navigate"
    subtitle="Opens Google Maps"
    icon="🗺️"
    variant="success"
    size="large"
    style={styles.primaryButton}
    onPress={handleStart}
  />
  
  {/* Secondary action - Full width, medium */}
  <ConstructionButton
    title="View Details"
    subtitle="Route & workers"
    icon="📋"
    variant="outlined"
    size="medium"
    style={styles.secondaryButton}
    onPress={handleView}
  />
</View>

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    minHeight: 72, // Large touch target
  },
  secondaryButton: {
    width: '100%',
    minHeight: 60, // Medium touch target
  },
});
```

### Horizontal Row (For Equal Actions)

```typescript
<View style={styles.actionsRow}>
  <ConstructionButton
    title="Accept"
    icon="✓"
    variant="success"
    size="large"
    style={styles.halfButton}
    onPress={handleAccept}
  />
  
  <ConstructionButton
    title="Decline"
    icon="✕"
    variant="error"
    size="large"
    style={styles.halfButton}
    onPress={handleDecline}
  />
</View>

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfButton: {
    flex: 1,
    minHeight: 72,
  },
});
```

---

## Theme Usage

### Using Theme Colors

```typescript
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: ConstructionTheme.colors.background,
    padding: ConstructionTheme.spacing.lg,
  },
  title: {
    ...ConstructionTheme.typography.headlineLarge,
    color: ConstructionTheme.colors.onSurface,
  },
  successText: {
    color: ConstructionTheme.colors.success,
  },
  warningText: {
    color: ConstructionTheme.colors.warning,
  },
  errorText: {
    color: ConstructionTheme.colors.error,
  },
});
```

### Using Theme Spacing

```typescript
const styles = StyleSheet.create({
  container: {
    padding: ConstructionTheme.spacing.lg,        // 24px
    marginBottom: ConstructionTheme.spacing.xl,   // 32px
  },
  button: {
    marginTop: ConstructionTheme.spacing.md,      // 16px
    minHeight: ConstructionTheme.spacing.largeTouch, // 60px
  },
});
```

### Using Theme Typography

```typescript
const styles = StyleSheet.create({
  heading: {
    ...ConstructionTheme.typography.headlineLarge,
    // fontSize: 22, fontWeight: '600', lineHeight: 28
  },
  body: {
    ...ConstructionTheme.typography.bodyMedium,
    // fontSize: 16, fontWeight: '400', lineHeight: 22
  },
  label: {
    ...ConstructionTheme.typography.labelLarge,
    // fontSize: 16, fontWeight: '600', lineHeight: 20
  },
});
```

---

## Best Practices

### 1. Always Use Subtitles for Primary Actions

```typescript
// ❌ Bad - No explanation
<ConstructionButton
  title="Start Route"
  onPress={handleStart}
/>

// ✅ Good - Clear explanation
<ConstructionButton
  title="Start Route & Navigate"
  subtitle="Opens Google Maps"
  icon="🗺️"
  onPress={handleStart}
/>
```

### 2. Use Appropriate Button Sizes

```typescript
// ❌ Bad - Small button for critical action
<ConstructionButton
  title="Emergency"
  size="small"
  variant="error"
  onPress={handleEmergency}
/>

// ✅ Good - Large button for critical action
<ConstructionButton
  title="EMERGENCY"
  subtitle="Call 911"
  icon="🚨"
  size="extraLarge"
  variant="error"
  onPress={handleEmergency}
/>
```

### 3. Use Icons for Visual Recognition

```typescript
// ❌ Bad - No icon
<ConstructionButton
  title="Navigate"
  onPress={handleNavigate}
/>

// ✅ Good - Icon helps recognition
<ConstructionButton
  title="Navigate"
  icon="🗺️"
  onPress={handleNavigate}
/>
```

### 4. Show Progress for Multi-step Tasks

```typescript
// ❌ Bad - No progress indicator
<Text>Workers: {checkedIn}/{total}</Text>

// ✅ Good - Visual progress bar
<View style={styles.progressContainer}>
  <View style={styles.progressBar}>
    <View style={[styles.progressFill, { width: `${progress}%` }]} />
  </View>
  <Text>{checkedIn}/{total} workers checked in</Text>
</View>
```

### 5. Use Color-coded Status Badges

```typescript
// ❌ Bad - Plain text status
<Text>Status: en_route_pickup</Text>

// ✅ Good - Color-coded badge with emoji
<View style={[styles.badge, { backgroundColor: statusColor }]}>
  <Text style={styles.badgeText}>🚛 En Route to Pickup</Text>
</View>
```

---

**Last Updated**: February 13, 2026  
**Component Library Version**: 2.0  
**Minimum Touch Target**: 60px (72px recommended for primary actions)
