// Hooks exports

export { useAuthGuard, useHasRole, useHasAnyRole, useUserPermissions } from './useAuthGuard';
export { useOfflineActions } from './useOfflineActions';
export { useDashboard } from './useDashboard';
export { useTaskHistory } from './useTaskHistory';
export { useCertificationAlerts } from './useCertificationAlerts';
export { 
  useErrorHandler, 
  useApiErrorHandler, 
  useLocationErrorHandler, 
  useCameraErrorHandler 
} from './useErrorHandler';