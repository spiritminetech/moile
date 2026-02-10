// Network Configuration Helper for React Native

import { Platform } from 'react-native';

export interface NetworkConfig {
  baseUrl: string;
  platform: string;
  isEmulator: boolean;
  suggestions: string[];
}

/**
 * Get the appropriate API base URL for the current platform
 */
export const getNetworkConfig = (): NetworkConfig => {
  const isEmulator = __DEV__;
  const platform = Platform.OS;

  let baseUrl: string;
  let suggestions: string[] = [];

  if (platform === 'android') {
    // Android emulator special IP
    baseUrl = 'http://10.0.2.2:5002/api';
    suggestions = [
      'http://10.0.2.2:5002/api (Android Emulator)',
      'http://192.168.1.100:5002/api (Replace with your computer IP)',
      'http://192.168.0.100:5002/api (Alternative IP range)',
    ];
  } else if (platform === 'ios') {
    // iOS simulator can use localhost
    baseUrl = 'http://localhost:5002/api';
    suggestions = [
      'http://localhost:5002/api (iOS Simulator)',
      'http://192.168.1.100:5002/api (Physical iOS device - use your computer IP)',
    ];
  } else {
    // Web or other platforms
    baseUrl = 'http://localhost:5002/api';
    suggestions = [
      'http://localhost:5002/api (Web/Desktop)',
    ];
  }

  return {
    baseUrl,
    platform,
    isEmulator,
    suggestions,
  };
};

/**
 * Common IP addresses to try when localhost doesn't work
 */
export const COMMON_LOCAL_IPS = [
  '192.168.1.6',    // Your computer's IP address
  '192.168.1.100',  // Common home network
  '192.168.0.100',  // Alternative home network
  '192.168.1.101',
  '192.168.1.102',
  '10.0.0.100',     // Some corporate networks
  '172.16.0.100',   // Docker networks
];

/**
 * Generate API URLs for testing different IPs
 */
export const generateTestUrls = (port: number = 5002): string[] => {
  const config = getNetworkConfig();
  const urls = [config.baseUrl];

  // Add common IP variations
  COMMON_LOCAL_IPS.forEach(ip => {
    urls.push(`http://${ip}:${port}/api`);
  });

  return urls;
};

/**
 * Test if a URL is reachable
 */
export const testConnection = async (url: string, timeout: number = 5000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`Connection test failed for ${url}:`, error);
    return false;
  }
};

/**
 * Find the first working API URL from a list
 */
export const findWorkingApiUrl = async (urls: string[]): Promise<string | null> => {
  console.log('🔍 Testing API connections...');
  
  for (const url of urls) {
    console.log(`Testing: ${url}`);
    const isWorking = await testConnection(url);
    
    if (isWorking) {
      console.log(`✅ Found working API: ${url}`);
      return url;
    }
  }
  
  console.log('❌ No working API URLs found');
  return null;
};