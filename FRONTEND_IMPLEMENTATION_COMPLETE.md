# Frontend Implementation Complete - Today's Task Critical Features

## ✅ COMPLETED IMPLEMENTATIONS

### 1. Type Definitions Updated ✅
**File**: `ConstructionERPMobile/src/types/index.ts`

**Added Types**:
- `InstructionReadStatus` - Track instruction read/acknowledgment
- `TargetCalculation` - Target calculation with transparency fields
- `PerformanceMetrics` - Worker performance with team comparison
- `Achievement` - Performance achievements/badges
- `EnhancedProject` - Project with code, site name, nature of work
- `EnhancedWorker` - Worker with trade and specializations
- `EnhancedTaskAssignment` - Task with all new fields
- `TaskLocationMapProps` - Map screen props
- `TargetCalculationModalProps` - Modal props
- `InstructionAcknowledgmentProps` - Acknowledgment component props
- `PerformanceMetricsCardProps` - Performance card props
- API request/response types for new endpoints

---

## 🚀 READY TO IMPLEMENT

### Step 2: Update Worker API Service

**File**: `ConstructionERPMobile/src/services/api/WorkerApiService.ts`

Add these methods to the existing `WorkerApiService` class:

```typescript
// Add to imports
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Add these methods to WorkerApiService class

/**
 * Mark supervisor instructions as read
 */
async markInstructionsAsRead(
  assignmentId: number,
  location?: GeoLocation
): Promise<ApiResponse<{ readAt: Date; acknowledged: boolean }>> {
  try {
    const deviceInfo = await this.getDeviceInfo();
    
    const response = await this.post(
      `/worker/tasks/${assignmentId}/instructions/read`,
      {
        location,
        deviceInfo
      }
    );
    
    return response;
  } catch (error) {
    console.error('Error marking instructions as read:', error);
    throw error;
  }
}

/**
 * Acknowledge understanding of supervisor instructions
 */
async acknowledgeInstructions(
  assignmentId: number,
  notes?: string,
  location?: GeoLocation
): Promise<ApiResponse<InstructionReadStatus>> {
  try {
    const deviceInfo = await this.getDeviceInfo();
    
    const response = await this.post(
      `/worker/tasks/${assignmentId}/instructions/acknowledge`,
      {
        notes,
        location,
        deviceInfo
      }
    );
    
    return response;
  } catch (error) {
    console.error('Error acknowledging instructions:', error);
    throw error;
  }
}

/**
 * Get worker performance metrics
 */
async getPerformanceMetrics(): Promise<ApiResponse<PerformanceMetrics>> {
  try {
    const response = await this.get('/worker/performance');
    return response;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
}

/**
 * Get device information for audit trail
 */
private async getDeviceInfo(): Promise<DeviceInfo> {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    model: Device.modelName || 'Unknown',
    manufacturer: Device.manufacturer || 'Unknown'
  };
}
```

---

### Step 3: Create Task Location Map Screen

**File**: `ConstructionERPMobile/src/screens/worker/TaskLocationMapScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from '../../store/context/LocationContext';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { ConstructionButton } from '../../components/common';

interface TaskLocationMapScreenProps {
  route: {
    params: {
      task: any;
      projectGeofence: {
        latitude: number;
        longitude: number;
        radius: number;
        strictMode: boolean;
        allowedVariance: number;
      };
    };
  };
  navigation: any;
}

const TaskLocationMapScreen: React.FC<TaskLocationMapScreenProps> = ({ route, navigation }) => {
  const { task, projectGeofence } = route.params;
  const { state: locationState } = useLocation();
  const { currentLocation } = locationState;

  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [distance, setDistance] = useState<number | null>(null);

  // Calculate distance from worker to site
  useEffect(() => {
    if (currentLocation && projectGeofence) {
      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        projectGeofence.latitude,
        projectGeofence.longitude
      );
      setDistance(dist);
    }
  }, [currentLocation, projectGeofence]);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if worker is inside geofence
  const isInsideGeofence = (): boolean => {
    if (!distance) return false;
    return distance <= projectGeofence.radius + (projectGeofence.allowedVariance || 0);
  };

  // Open navigation app
  const handleNavigate = () => {
    const { latitude, longitude } = projectGeofence;
    const label = task.projectName || 'Work Site';

    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    const url = scheme || `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open maps application');
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Failed to open navigation');
      });
  };

  // Toggle map type
  const toggleMapType = () => {
    setMapType(mapType === 'standard' ? 'satellite' : 'standard');
  };

  const insideGeofence = isInsideGeofence();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Site Location</Text>
        <TouchableOpacity onPress={toggleMapType} style={styles.mapTypeButton}>
          <Text style={styles.mapTypeButtonText}>
            {mapType === 'standard' ? '🛰️' : '🗺️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        initialRegion={{
          latitude: projectGeofence.latitude,
          longitude: projectGeofence.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Site Marker */}
        <Marker
          coordinate={{
            latitude: projectGeofence.latitude,
            longitude: projectGeofence.longitude,
          }}
          title={task.projectName || 'Work Site'}
          description={task.siteName || task.location}
          pinColor="red"
        />

        {/* Geofence Circle */}
        <Circle
          center={{
            latitude: projectGeofence.latitude,
            longitude: projectGeofence.longitude,
          }}
          radius={projectGeofence.radius}
          fillColor={insideGeofence ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}
          strokeColor={insideGeofence ? '#4CAF50' : '#F44336'}
          strokeWidth={2}
        />
      </MapView>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{task.projectName}</Text>
          <Text style={styles.projectCode}>Code: {task.projectCode}</Text>
          <Text style={styles.siteName}>📍 {task.siteName}</Text>
        </View>

        {/* Distance Info */}
        {distance !== null && (
          <View style={[styles.distanceCard, insideGeofence ? styles.insideGeofence : styles.outsideGeofence]}>
            <Text style={styles.distanceLabel}>
              {insideGeofence ? '✅ Inside Work Area' : '⚠️ Outside Work Area'}
            </Text>
            <Text style={styles.distanceValue}>
              {distance < 1000 
                ? `${Math.round(distance)}m away`
                : `${(distance / 1000).toFixed(2)}km away`
              }
            </Text>
            <Text style={styles.geofenceInfo}>
              Allowed radius: {projectGeofence.radius}m
            </Text>
          </View>
        )}

        {/* Navigation Button */}
        <ConstructionButton
          title="🧭 Navigate to Site"
          onPress={handleNavigate}
          variant="primary"
          size="large"
          icon="🗺️"
          style={styles.navigateButton}
        />

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <Text style={styles.infoText}>🔧 Nature of Work: {task.natureOfWork}</Text>
          <Text style={styles.infoText}>👤 Your Trade: {task.trade || 'General'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  mapTypeButton: {
    padding: 8,
  },
  mapTypeButtonText: {
    fontSize: 24,
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  projectInfo: {
    marginBottom: 16,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  projectCode: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  siteName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  distanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  insideGeofence: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  outsideGeofence: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  distanceLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  geofenceInfo: {
    fontSize: 12,
    color: '#666666',
  },
  navigateButton: {
    marginBottom: 16,
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
});

export default TaskLocationMapScreen;
```

---

### Step 4: Install react-native-maps

```bash
cd ConstructionERPMobile
npx expo install react-native-maps
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location for attendance tracking."
        }
      ]
    ],
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

---

### Step 5: Add Map Screen to Navigation

**File**: `ConstructionERPMobile/src/navigation/WorkerNavigator.tsx`

Add to imports:
```typescript
import TaskLocationMapScreen from '../screens/worker/TaskLocationMapScreen';
```

Add to Stack.Navigator:
```typescript
<Stack.Screen 
  name="TaskLocationMap" 
  component={TaskLocationMapScreen}
  options={{
    title: 'Work Site Location',
    headerShown: false
  }}
/>
```

---

### Step 6: Update TaskCard Component

**File**: `ConstructionERPMobile/src/components/cards/TaskCard.tsx`

Add these sections to the existing TaskCard component:

```typescript
// Add to imports
import { useState } from 'react';
import { workerApiService } from '../../services/api/WorkerApiService';

// Add state for instruction acknowledgment
const [hasReadInstructions, setHasReadInstructions] = useState(
  task.instructionReadStatus?.hasRead || false
);
const [isAcknowledging, setIsAcknowledging] = useState(false);

// Add handler for marking instructions as read
const handleMarkAsRead = async () => {
  try {
    await workerApiService.markInstructionsAsRead(task.assignmentId);
    setHasReadInstructions(true);
  } catch (error) {
    console.error('Error marking instructions as read:', error);
    Alert.alert('Error', 'Failed to mark instructions as read');
  }
};

// Add handler for acknowledging instructions
const handleAcknowledge = async () => {
  if (!hasReadInstructions) {
    Alert.alert('Please Read First', 'You must read the instructions before acknowledging');
    return;
  }

  Alert.alert(
    'Acknowledge Instructions',
    'By acknowledging, you confirm that you have read and understood all supervisor instructions.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'I Understand',
        onPress: async () => {
          setIsAcknowledging(true);
          try {
            await workerApiService.acknowledgeInstructions(task.assignmentId);
            Alert.alert('Success', 'Instructions acknowledged successfully');
          } catch (error) {
            console.error('Error acknowledging instructions:', error);
            Alert.alert('Error', 'Failed to acknowledge instructions');
          } finally {
            setIsAcknowledging(false);
          }
        },
      },
    ]
  );
};

// Add after the existing header section, before description:

{/* Project Information Section */}
<View style={styles.projectInfoSection}>
  <View style={styles.projectInfoRow}>
    <Text style={styles.projectInfoLabel}>📋 Project:</Text>
    <Text style={styles.projectInfoValue}>
      {task.projectCode} - {task.projectName}
    </Text>
  </View>
  {task.siteName && (
    <View style={styles.projectInfoRow}>
      <Text style={styles.projectInfoLabel}>🏗️ Site:</Text>
      <Text style={styles.projectInfoValue}>{task.siteName}</Text>
    </View>
  )}
  {task.natureOfWork && (
    <View style={styles.projectInfoRow}>
      <Text style={styles.projectInfoLabel}>🔧 Nature of Work:</Text>
      <Text style={styles.projectInfoValue}>{task.natureOfWork}</Text>
    </View>
  )}
  {task.clientName && task.clientName !== 'N/A' && (
    <View style={styles.projectInfoRow}>
      <Text style={styles.projectInfoLabel}>👤 Client:</Text>
      <Text style={styles.projectInfoValue}>{task.clientName}</Text>
    </View>
  )}
</View>

// Update the "View Location" button to navigate to map:
<ConstructionButton
  key="location"
  title="View on Map"
  onPress={() => navigation.navigate('TaskLocationMap', {
    task: task,
    projectGeofence: task.projectGeofence
  })}
  variant="neutral"
  size="medium"
  icon="🗺️"
  style={styles.locationButton}
/>

// Add instruction acknowledgment section after instructions display:
{(task.supervisorInstructions || task.instructionAttachments?.length > 0) && (
  <View style={styles.instructionsContainer}>
    <Text style={styles.instructionsTitle}>📋 Supervisor Instructions</Text>
    {task.supervisorInstructions && (
      <Text style={styles.instructionsText}>{task.supervisorInstructions}</Text>
    )}
    {task.instructionAttachments && task.instructionAttachments.length > 0 && (
      <AttachmentViewer 
        attachments={task.instructionAttachments}
        title="Instruction Attachments"
      />
    )}
    
    {/* Instruction Acknowledgment */}
    {!task.instructionReadStatus?.acknowledged ? (
      <View style={styles.acknowledgmentSection}>
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={handleMarkAsRead}
          disabled={hasReadInstructions}
        >
          <View style={[styles.checkbox, hasReadInstructions && styles.checkboxChecked]}>
            {hasReadInstructions && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and understood the instructions
          </Text>
        </TouchableOpacity>
        
        <ConstructionButton
          title="Acknowledge Instructions"
          onPress={handleAcknowledge}
          variant="success"
          size="medium"
          disabled={!hasReadInstructions || isAcknowledging}
          isLoading={isAcknowledging}
          style={styles.acknowledgeButton}
        />
        
        <Text style={styles.legalNote}>
          ⚠️ By acknowledging, you confirm understanding of all safety requirements and work procedures.
        </Text>
      </View>
    ) : (
      <View style={styles.acknowledgedBadge}>
        <Text style={styles.acknowledgedText}>
          ✅ Acknowledged on {new Date(task.instructionReadStatus.acknowledgedAt).toLocaleDateString()}
        </Text>
      </View>
    )}
    
    {task.instructionsLastUpdated && (
      <Text style={styles.instructionsUpdated}>
        Last updated: {new Date(task.instructionsLastUpdated).toLocaleDateString()}
      </Text>
    )}
  </View>
)}

// Add these styles to the StyleSheet:
projectInfoSection: {
  backgroundColor: '#F5F5F5',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
},
projectInfoRow: {
  flexDirection: 'row',
  marginBottom: 8,
},
projectInfoLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#666666',
  width: 120,
},
projectInfoValue: {
  flex: 1,
  fontSize: 14,
  color: '#000000',
  fontWeight: '500',
},
acknowledgmentSection: {
  marginTop: 16,
  padding: 12,
  backgroundColor: '#FFF3CD',
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#FFC107',
},
checkboxRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},
checkbox: {
  width: 24,
  height: 24,
  borderWidth: 2,
  borderColor: '#666666',
  borderRadius: 4,
  marginRight: 12,
  alignItems: 'center',
  justifyContent: 'center',
},
checkboxChecked: {
  backgroundColor: '#4CAF50',
  borderColor: '#4CAF50',
},
checkmark: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '700',
},
checkboxLabel: {
  flex: 1,
  fontSize: 14,
  color: '#000000',
},
acknowledgeButton: {
  marginBottom: 12,
},
legalNote: {
  fontSize: 12,
  color: '#856404',
  fontStyle: 'italic',
  textAlign: 'center',
},
acknowledgedBadge: {
  marginTop: 12,
  padding: 12,
  backgroundColor: '#E8F5E9',
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#4CAF50',
},
acknowledgedText: {
  fontSize: 14,
  color: '#2E7D32',
  fontWeight: '600',
  textAlign: 'center',
},
```

---

## 📊 Implementation Progress

**Overall Progress**: 60% Complete

- ✅ Backend API: 100% Complete
- ✅ Type Definitions: 100% Complete
- 🚧 API Service Updates: Ready to implement (code provided)
- 🚧 Map Screen: Ready to implement (code provided)
- 🚧 TaskCard Updates: Ready to implement (code provided)
- ⏳ Performance Metrics Card: Pending
- ⏳ Target Calculation Modal: Pending
- ⏳ Testing: Pending

---

## 🎯 Remaining Tasks

1. **Update WorkerApiService.ts** - Add the 3 new methods (code provided above)
2. **Create TaskLocationMapScreen.tsx** - Full implementation provided above
3. **Update TaskCard.tsx** - Add project info and acknowledgment sections (code provided)
4. **Install react-native-maps** - Run the expo install command
5. **Update WorkerNavigator.tsx** - Add map screen route
6. **Create PerformanceMetricsCard** - Display worker performance
7. **Create TargetCalculationModal** - Show target calculation details
8. **Test all features** - End-to-end testing

---

## 🧪 Testing Checklist

- [ ] Test map screen displays correctly
- [ ] Test geofence circle shows correct radius
- [ ] Test navigation button opens maps app
- [ ] Test instruction read marking
- [ ] Test instruction acknowledgment
- [ ] Test acknowledgment prevents task start without reading
- [ ] Test project info displays correctly
- [ ] Test offline instruction acknowledgment queuing
- [ ] Test performance metrics API call
- [ ] Test all new fields display in TaskCard

---

*Implementation Guide Created: February 14, 2026*
*Status: Ready for Developer Implementation*
*Estimated Time: 4-6 hours*
