// NavigationButton Component - GPS Navigation Links for Transport Tasks
// Provides quick access to Google Maps, Waze, and Apple Maps navigation

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { driverApiService } from '../../services/api/DriverApiService';

interface NavigationButtonProps {
  taskId: string | number;
  locationId?: string;
  locationName?: string;
  style?: any;
  compact?: boolean;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  taskId,
  locationId,
  locationName,
  style,
  compact = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleNavigate = async (app?: 'google' | 'waze' | 'apple') => {
    try {
      setLoading(true);
      
      const response = await driverApiService.getNavigationLinks(taskId, locationId);
      
      if (!response.success || !response.data) {
        Alert.alert('Error', 'Failed to get navigation links');
        return;
      }

      const { googleMaps, waze, appleMaps, location } = response.data;

      if (app) {
        // Open specific app
        let url = '';
        switch (app) {
          case 'google':
            url = googleMaps;
            break;
          case 'waze':
            url = waze;
            break;
          case 'apple':
            url = appleMaps;
            break;
        }

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', `Cannot open ${app} navigation app`);
        }
      } else {
        // Show options
        setShowOptions(true);
        showNavigationOptions(googleMaps, waze, appleMaps, location.name);
      }
    } catch (error: any) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Error', error.message || 'Failed to open navigation');
    } finally {
      setLoading(false);
    }
  };

  const showNavigationOptions = (
    googleMaps: string,
    waze: string,
    appleMaps: string,
    locationName: string
  ) => {
    const options = [
      { name: 'Google Maps', url: googleMaps, icon: 'google-maps' },
      { name: 'Waze', url: waze, icon: 'waze' },
    ];

    if (Platform.OS === 'ios') {
      options.push({ name: 'Apple Maps', url: appleMaps, icon: 'map' });
    }

    Alert.alert(
      'Navigate to ' + locationName,
      'Choose navigation app:',
      [
        ...options.map(opt => ({
          text: opt.name,
          onPress: async () => {
            const canOpen = await Linking.canOpenURL(opt.url);
            if (canOpen) {
              await Linking.openURL(opt.url);
            } else {
              Alert.alert('Error', `${opt.name} is not installed`);
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, style]}
        onPress={() => handleNavigate()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Icon name="navigation" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => handleNavigate()}
      disabled={loading}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="navigation" size={24} color="#fff" />
            <Text style={styles.buttonText}>
              Navigate{locationName ? ` to ${locationName}` : ''}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  compactButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NavigationButton;
