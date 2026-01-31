// Core TypeScript type definitions for Construction ERP Mobile Application

// User and Authentication Types
export type UserRole = 'Worker' | 'Supervisor' | 'Driver';

export interface User {
  id: number;
  email: string;
  name: string;
  role?: UserRole; // Will be set from company data
  profileImage?: string;
  certifications?: Certification[];
  workPass?: WorkPass;
}

export interface Company {
  id: number;
  name: string;
  role: UserRole;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  company: Company | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  permissions: string[];
  isLoading?: boolean;
  error?: string | null;
  // Multi-company support
  requiresCompanySelection?: boolean;
  availableCompanies?: Company[];
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date;
  certificateNumber: string;
  status: 'active' | 'expired' | 'expiring_soon';
}

export interface WorkPass {
  id: number;
  passNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'suspended';
}

// Location and GPS Types
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationState {
  currentLocation: GeoLocation | null;
  isLocationEnabled: boolean;
  hasLocationPermission: boolean;
  isGeofenceValid: boolean;
  distanceFromSite: number;
  locationError?: string;
}

export interface GeofenceArea {
  center: GeoLocation;
  radius: number; // in meters
  allowedAccuracy: number; // maximum GPS accuracy allowed
}

export interface GeofenceValidation {
  isValid: boolean;
  distanceFromSite: number;
  accuracy: number;
  message?: string;
}

// Project and Task Types
export interface Project {
  id: number;
  name: string;
  description: string;
  location: ProjectLocation;
  geofence: GeofenceArea;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'on_hold';
  supervisor: Supervisor;
}

export interface ProjectLocation {
  address: string;
  coordinates: GeoLocation;
  landmarks: string[];
  accessInstructions: string;
}

export interface Supervisor {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export interface TaskAssignment {
  assignmentId: number;
  projectId: number;
  taskName: string;
  description: string;
  dependencies: number[];
  sequence: number;
  status: 'pending' | 'in_progress' | 'completed';
  location: GeoLocation;
  estimatedHours: number;
  actualHours?: number;
}

// Attendance Types
export interface AttendanceRecord {
  id: number;
  workerId: number;
  projectId: number;
  loginTime: string;
  logoutTime?: string;
  location: GeoLocation;
  sessionType: 'regular' | 'overtime' | 'lunch';
}

export interface AttendanceState {
  currentSession: AttendanceRecord | null;
  todaysAttendance: AttendanceRecord[];
  attendanceHistory: AttendanceRecord[];
  canClockIn: boolean;
  canClockOut: boolean;
}

// Report Types
export interface DailyJobReport {
  id: number;
  workerId: number;
  assignmentId: number;
  date: Date;
  workDescription: string;
  startTime: Date;
  endTime: Date;
  progressPercent: number;
  photos: ReportPhoto[];
  issues: string[];
  notes: string;
  location: GeoLocation;
  status: 'draft' | 'submitted' | 'approved';
}

export interface ReportPhoto {
  id: number;
  uri: string;
  filename: string;
  size: number;
  mimeType: string;
  timestamp: Date;
}

// Request Types
export type RequestType = 'leave' | 'medical_leave' | 'advance_payment' | 'material' | 'tool' | 'reimbursement';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface WorkerRequest {
  id: number;
  workerId: number;
  type: RequestType;
  title: string;
  description: string;
  requestDate: Date;
  requiredDate?: Date;
  status: RequestStatus;
  approver?: User;
  approvalDate?: Date;
  approvalNotes?: string;
  attachments: RequestAttachment[];
}

export interface RequestAttachment {
  id: number;
  filename: string;
  uri: string;
  size: number;
  mimeType: string;
}

// Notification Types
export type NotificationType = 'task_update' | 'site_change' | 'attendance_alert' | 'request_status' | 'safety_incident';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
  actionRequired: boolean;
  relatedEntityId?: number;
  relatedEntityType?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Application State Types
export interface TaskState {
  todaysTasks: TaskAssignment[];
  activeTask: TaskAssignment | null;
  taskHistory: TaskAssignment[];
  isLoading: boolean;
  error: string | null;
}

export interface OfflineState {
  isOnline: boolean;
  lastSyncTime: Date | null;
  queuedActions: QueuedAction[];
  cachedData: CachedData;
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}

export interface CachedData {
  tasks: TaskAssignment[];
  attendance: AttendanceRecord[];
  notifications: Notification[];
  lastUpdated: Date;
}

export interface AppState {
  auth: AuthState;
  location: LocationState;
  offline: OfflineState;
  notifications: NotificationState;
  tasks: TaskState;
  attendance: AttendanceState;
}

// GPS Accuracy Warning
export interface GPSAccuracyWarning {
  isAccurate: boolean;
  currentAccuracy: number;
  requiredAccuracy: number;
  message: string;
  canProceed: boolean;
}

// Component Props Types
export interface DashboardProps {
  userRole: UserRole;
  todaysTasks: TaskAssignment[];
  attendanceStatus: AttendanceState;
  notifications: Notification[];
}

export interface AttendanceButtonProps {
  isEnabled: boolean;
  attendanceType: 'login' | 'logout';
  onPress: (location: GeoLocation) => void;
  isLoading: boolean;
}

export interface TaskCardProps {
  task: TaskAssignment;
  onStartTask: (taskId: number) => void;
  onUpdateProgress: (taskId: number, progress: number) => void;
  canStart: boolean;
}