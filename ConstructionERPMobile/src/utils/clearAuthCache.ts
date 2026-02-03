// Utility to force clear authentication cache
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

/**
 * Force clear all authentication cache data
 * Use this when the app is showing stale authentication data
 */
export const clearAuthCache = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing authentication cache...');
    
    // Clear all authentication-related storage keys
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.COMPANY_DATA,
      STORAGE_KEYS.PERMISSIONS,
      STORAGE_KEYS.TOKEN_EXPIRY,
      STORAGE_KEYS.CACHED_TASKS,
      STORAGE_KEYS.CACHED_ATTENDANCE,
      STORAGE_KEYS.LAST_SYNC,
    ]);
    
    console.log('✅ Authentication cache cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear authentication cache:', error);
    throw error;
  }
};

/**
 * Debug function to check what's currently stored in AsyncStorage
 */
export const debugAuthCache = async (): Promise<void> => {
  try {
    console.log('🔍 Debugging authentication cache...');
    
    const keys = [
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.COMPANY_DATA,
      STORAGE_KEYS.PERMISSIONS,
      STORAGE_KEYS.TOKEN_EXPIRY,
    ];
    
    const values = await AsyncStorage.multiGet(keys);
    
    values.forEach(([key, value]) => {
      const keyName = key.replace('@construction_erp:', '');
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`📦 ${keyName}:`, parsed);
        } catch {
          console.log(`📦 ${keyName}:`, value.substring(0, 50) + '...');
        }
      } else {
        console.log(`📦 ${keyName}: null`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to debug authentication cache:', error);
  }
};

/**
 * Force refresh authentication data by clearing cache and triggering re-login
 */
export const forceRefreshAuth = async (): Promise<void> => {
  try {
    console.log('🔄 Force refreshing authentication...');
    
    // Clear all cached data
    await clearAuthCache();
    
    // The app should automatically redirect to login screen
    // since there's no valid authentication data
    console.log('✅ Authentication refresh initiated - app should redirect to login');
  } catch (error) {
    console.error('❌ Failed to force refresh authentication:', error);
    throw error;
  }
};