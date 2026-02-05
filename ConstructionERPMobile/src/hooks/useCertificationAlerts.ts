// Hook for managing certification expiry alerts and monitoring
// Requirements: 8.3

import { useState, useEffect, useCallback } from 'react';
import { workerApiService } from '../services/api/WorkerApiService';

interface CertificationAlert {
  certificationId: number;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
  alertLevel: 'warning' | 'urgent' | 'expired';
}

interface UseCertificationAlertsReturn {
  alerts: CertificationAlert[];
  isLoading: boolean;
  error: string | null;
  refreshAlerts: () => Promise<void>;
  hasExpiredCertifications: boolean;
  hasUrgentAlerts: boolean;
  hasWarningAlerts: boolean;
  totalAlerts: number;
}

export const useCertificationAlerts = (): UseCertificationAlertsReturn => {
  const [alerts, setAlerts] = useState<CertificationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading certification alerts...');
      const response = await workerApiService.getCertificationExpiryAlerts();
      console.log('📊 Certification alerts API response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Alerts loaded successfully:', response.data);
        setAlerts(response.data);
        
        // Schedule notification reminders for certifications
        if (response.data.length > 0) {
          try {
            const certifications = response.data.map(alert => ({
              id: alert.certificationId,
              name: alert.name,
              expiryDate: alert.expiryDate,
              daysUntilExpiry: alert.daysUntilExpiry,
            }));
            
            // TODO: Re-enable when NotificationService is properly implemented
            // await NotificationService.getInstance().scheduleCertificationExpiryReminders(certifications);
          } catch (notificationError) {
            console.warn('Failed to schedule certification reminders:', notificationError);
            // Don't fail the whole operation if notifications fail
          }
        }
      } else {
        console.warn('❌ Failed to load certification alerts:', response.message);
        setAlerts([]);
        if (!response.success) {
          setError(response.message || 'Failed to load alerts');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alerts';
      console.error('❌ Certification alerts error:', err);
      setError(errorMessage);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    await loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Computed properties for different alert levels
  const hasExpiredCertifications = alerts?.some(alert => alert.alertLevel === 'expired') || false;
  const hasUrgentAlerts = alerts?.some(alert => alert.alertLevel === 'urgent') || false;
  const hasWarningAlerts = alerts?.some(alert => alert.alertLevel === 'warning') || false;
  const totalAlerts = alerts?.length || 0;

  return {
    alerts,
    isLoading,
    error,
    refreshAlerts,
    hasExpiredCertifications,
    hasUrgentAlerts,
    hasWarningAlerts,
    totalAlerts,
  };
};

export default useCertificationAlerts;