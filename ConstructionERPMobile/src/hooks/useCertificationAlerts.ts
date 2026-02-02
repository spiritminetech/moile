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

      const response = await workerApiService.getCertificationExpiryAlerts();
      
      if (response.success && response.data) {
        // Handle the actual API response structure
        let alertsArray: CertificationAlert[] = [];
        
        if (Array.isArray(response.data)) {
          // API returns array of alerts directly
          alertsArray = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Handle nested structure if it exists
          const data = response.data as any;
          if (data.alerts && Array.isArray(data.alerts)) {
            alertsArray = data.alerts;
          } else if (data.expired || data.expiringSoon) {
            // Handle structured response with expired and expiring soon
            const expired = Array.isArray(data.expired) ? data.expired : [];
            const expiringSoon = Array.isArray(data.expiringSoon) ? data.expiringSoon : [];
            
            // Convert expired certifications to alerts
            const expiredAlerts = expired.map((cert: any) => ({
              certificationId: cert.id || cert.certificationId || 0,
              name: cert.name || 'Unknown Certification',
              expiryDate: cert.expiryDate || cert.expiry_date || new Date().toISOString(),
              daysUntilExpiry: cert.daysUntilExpiry || cert.days_until_expiry || 0,
              alertLevel: 'expired' as const,
            }));
            
            // Convert expiring soon certifications to alerts
            const expiringSoonAlerts = expiringSoon.map((cert: any) => ({
              certificationId: cert.id || cert.certificationId || 0,
              name: cert.name || 'Unknown Certification',
              expiryDate: cert.expiryDate || cert.expiry_date || new Date().toISOString(),
              daysUntilExpiry: cert.daysUntilExpiry || cert.days_until_expiry || 0,
              alertLevel: (cert.daysUntilExpiry || cert.days_until_expiry || 0) <= 7 ? 'urgent' as const : 'warning' as const,
            }));
            
            alertsArray = [...expiredAlerts, ...expiringSoonAlerts];
          }
        }
        
        setAlerts(alertsArray);
        
        // Schedule notification reminders for certifications
        if (alertsArray.length > 0) {
          try {
            const certifications = alertsArray.map(alert => ({
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
        // Handle case where no certifications are found or API returns empty data
        setAlerts([]);
        if (!response.success) {
          console.warn('Failed to load certification alerts:', response.message);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(errorMessage);
      console.warn('Failed to load certification alerts:', errorMessage);
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