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
  currentProject?: {
    id: number;
    name: string;
    location: string;
  };
  
  // Role-specific data
  supervisorData?: {
    assignedProjects: number[];
    teamMembers: number[];
    approvalLevel: 'basic' | 'advanced' | 'senior';
    specializations: string[];
  };
  
  driverData?: {
    licenseNumber: string;
    licenseClass: string;
    licenseExpiry: Date;
    assignedVehicles: number[];
    certifications: string[];
  };
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
  
  // Role-specific state
  supervisorContext?: SupervisorContextData;
  driverContext?: DriverContextData;
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
  accuracy: number | null;
  message?: string;
  canProceed?: boolean;
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

// New types to match API documentation
export interface DashboardApiResponse {
  project: {
    id: number;
    name: string;
    code: string;
    location: string;
    geofence: {
      latitude: number;
      longitude: number;
      radius: number;
    };
  };
  supervisor: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  worker: {
    id: number;
    name: string;
    role: string;
    checkInStatus: string;
    currentLocation: {
      latitude: number;
      longitude: number;
      insideGeofence: boolean;
      lastUpdated: string;
    };
  };
  tasks: Array<{
    assignmentId: number;
    taskId: number;
    taskName: string;
    taskType: string;
    description: string;
    workArea: string;
    floor: string;
    zone: string;
    status: string;
    priority: string;
    sequence: number;
    dailyTarget: {
      description: string;
      quantity: number;
      unit: string;
      targetCompletion: number;
    };
    progress: {
      percentage: number;
      completed: number;
      remaining: number;
      lastUpdated: string;
    };
    timeEstimate: {
      estimated: number;
      elapsed: number;
      remaining: number;
    };
    supervisorInstructions: string;
    startTime: string;
    estimatedEndTime: string;
    canStart: boolean;
    canStartMessage: string | null;
    dependencies: number[];
  }>;
  toolsAndMaterials: {
    tools: Array<{
      id: number;
      name: string;
      quantity: number;
      unit: string;
      allocated: boolean;
      location: string;
    }>;
    materials: Array<{
      id: number;
      name: string;
      quantity: number;
      unit: string;
      allocated: number;
      used: number;
      remaining: number;
      location: string;
    }>;
  };
  dailySummary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    queuedTasks: number;
    errorTasks: number;
    totalHoursWorked: number;
    remainingHours: number;
    overallProgress: number;
  };
}

export interface ProjectApiResponse {
  id: number;
  projectName: string;
  projectCode: string;
  description: string;
  address: string;
  companyId: number;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  geofence: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
    strictMode: boolean;
    allowedVariance: number;
  };
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  projectManager: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  location: GeoLocation;
  estimatedHours: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
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

// Report Types - Updated to match API specification
export interface DailyJobReport {
  reportId: string;
  date: string;
  projectId: number;
  projectName?: string;
  workArea: string;
  floor: string;
  summary: string;
  tasksCompleted: Array<{
    taskId: number;
    description: string;
    quantityCompleted: number;
    unit: string;
    progressPercent: number;
    notes: string;
  }>;
  issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportedAt: string;
  }>;
  materialUsed: Array<{
    materialId: number;
    name: string;
    quantityUsed: number;
    unit: string;
  }>;
  workingHours: {
    startTime: string;
    endTime: string;
    breakDuration: number;
    overtimeHours: number;
  };
  photos?: Array<{
    photoId: string;
    filename: string;
    url: string;
    category: 'progress' | 'issue' | 'completion' | 'material';
    uploadedAt: string;
  }>;
  status: 'draft' | 'submitted' | 'approved';
  createdAt: string;
  submittedAt?: string;
}

export interface ReportPhoto {
  id?: number;
  photoId: string;
  filename: string;
  url: string;
  uri: string; // Local URI for the photo
  size: number; // File size in bytes
  mimeType: string; // MIME type of the photo
  timestamp: Date; // When the photo was taken
  category: 'progress' | 'issue' | 'completion' | 'material';
  uploadedAt: string;
}

// Daily Report API Request/Response Types
export interface CreateDailyReportRequest {
  date: string;
  projectId: number;
  workArea: string;
  floor: string;
  summary: string;
  tasksCompleted: Array<{
    taskId: number;
    description: string;
    quantityCompleted: number;
    unit: string;
    progressPercent: number;
    notes: string;
  }>;
  issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportedAt: string;
  }>;
  materialUsed: Array<{
    materialId: number;
    name: string;
    quantityUsed: number;
    unit: string;
  }>;
  workingHours: {
    startTime: string;
    endTime: string;
    breakDuration: number;
    overtimeHours: number;
  };
}

export interface CreateDailyReportResponse {
  success: boolean;
  message: string;
  data: {
    reportId: string;
    date: string;
    status: 'draft';
    createdAt: string;
    summary: {
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      overallProgress: number;
    };
  };
}

export interface UploadReportPhotosRequest {
  photos: File[];
  category: 'progress' | 'issue' | 'completion' | 'material';
  taskId?: number;
  description: string;
}

export interface UploadReportPhotosResponse {
  success: boolean;
  message: string;
  data: {
    uploadedPhotos: Array<{
      photoId: string;
      filename: string;
      url: string;
      category: 'progress' | 'issue' | 'completion' | 'material';
      uploadedAt: string;
    }>;
    totalPhotos: number;
  };
}

export interface SubmitDailyReportRequest {
  finalNotes: string;
  supervisorNotification: boolean;
}

export interface SubmitDailyReportResponse {
  success: boolean;
  message: string;
  data: {
    reportId: string;
    status: 'submitted';
    submittedAt: string;
    supervisorNotified: boolean;
    nextSteps: string;
  };
}

export interface GetDailyReportsResponse {
  success: boolean;
  data: {
    reports: Array<{
      reportId: string;
      date: string;
      status: 'draft' | 'submitted' | 'approved';
      projectName: string;
      workArea: string;
      summary: {
        totalTasks: number;
        completedTasks: number;
        overallProgress: number;
      };
      createdAt: string;
      submittedAt?: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
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

// Notification types removed - notification features not needed

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
  lastUpdated: Date;
}

// Driver-Specific State Types
export interface TransportState {
  todaysTasks: TransportTask[];
  activeTask: TransportTask | null;
  routeOptimization: RouteData | null;
  workerManifests: WorkerManifest[];
  isLoading: boolean;
  error: string | null;
}

export interface VehicleState {
  assignedVehicle: VehicleInfo | null;
  maintenanceAlerts: MaintenanceAlert[];
  fuelLogs: Array<{
    date: string;
    amount: number;
    cost: number;
    mileage: number;
    location: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

export interface TripState {
  currentTrip: TripRecord | null;
  tripHistory: TripRecord[];
  isLoading: boolean;
  error: string | null;
}

export interface PerformanceState {
  metrics: DriverPerformance | null;
  monthlyStats: Array<{
    month: string;
    tripsCompleted: number;
    onTimePerformance: number;
    fuelEfficiency: number;
  }>;
  isLoading: boolean;
  error: string | null;
}

export interface RouteData {
  optimizedRoute: Array<{
    locationId: number;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    estimatedArrival: string;
    travelTime: number;
  }>;
  totalDistance: number;
  estimatedDuration: number;
  fuelEstimate: number;
}

export interface WorkerManifest {
  locationId: number;
  locationName: string;
  workers: Array<{
    workerId: number;
    name: string;
    phone: string;
    checkedIn: boolean;
    checkInTime?: string;
    profileImage?: string;
  }>;
  totalWorkers: number;
  checkedInWorkers: number;
}

export interface AppState {
  auth: AuthState;
  location: LocationState;
  offline: OfflineState;
  tasks: TaskState;
  attendance: AttendanceState;
  
  // New Driver state
  driver?: {
    transport: TransportState;
    vehicle: VehicleState;
    trips: TripState;
    performance: PerformanceState;
  };
}

// GPS Accuracy Warning
export interface GPSAccuracyWarning {
  isAccurate: boolean;
  currentAccuracy: number;
  requiredAccuracy: number;
  message: string;
  canProceed: boolean;
}

// Driver-Specific Types
export interface DriverDashboardResponse {
  todaysTransportTasks: Array<{
    taskId: number;
    route: string;
    pickupTime: string;
    pickupLocation: {
      name: string;
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
    dropoffLocation: {
      name: string;
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
    workerCount: number;
    status: 'pending' | 'en_route_pickup' | 'pickup_complete' | 'en_route_dropoff' | 'completed';
  }>;
  assignedVehicle: {
    id: number;
    plateNumber: string;
    model: string;
    capacity: number;
    fuelLevel: number;
    maintenanceStatus: 'good' | 'due_soon' | 'overdue';
  };
  performanceMetrics: {
    onTimePerformance: number;
    completedTrips: number;
    totalDistance: number;
    fuelEfficiency: number;
  };
}

export interface TransportTask {
  taskId: number;
  route: string;
  pickupLocations: Array<{
    locationId: number;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    workerManifest: Array<{
      workerId: number;
      name: string;
      phone: string;
      checkedIn: boolean;
      checkInTime?: string;
    }>;
    estimatedPickupTime: string;
    actualPickupTime?: string;
  }>;
  dropoffLocation: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    estimatedArrival: string;
    actualArrival?: string;
  };
  status: 'pending' | 'en_route_pickup' | 'pickup_complete' | 'en_route_dropoff' | 'completed';
  totalWorkers: number;
  checkedInWorkers: number;
}

export interface VehicleInfo {
  id: number;
  plateNumber: string;
  model: string;
  year: number;
  capacity: number;
  currentMileage: number;
  fuelLevel: number;
  maintenanceSchedule: Array<{
    type: 'oil_change' | 'tire_rotation' | 'inspection' | 'major_service';
    dueDate: string;
    dueMileage: number;
    status: 'upcoming' | 'due' | 'overdue';
  }>;
  fuelLog: Array<{
    date: string;
    amount: number;
    cost: number;
    mileage: number;
    location: string;
  }>;
}

export interface TripRecord {
  tripId: number;
  date: Date;
  route: string;
  pickupLocations: string[];
  dropoffLocation: string;
  totalWorkers: number;
  actualPickupTime: Date;
  actualDropoffTime: Date;
  totalDistance: number;
  fuelUsed: number;
  delays: Array<{
    reason: string;
    duration: number;
    location: string;
  }>;
  status: 'completed' | 'cancelled' | 'incident';
}

export interface DriverPerformance {
  onTimePerformance: number;
  totalTripsCompleted: number;
  totalDistance: number;
  averageFuelEfficiency: number;
  safetyScore: number;
  customerRating: number;
  incidentCount: number;
}

export interface MaintenanceAlert {
  id: number;
  vehicleId: number;
  type: 'scheduled' | 'urgent' | 'overdue';
  description: string;
  dueDate: Date;
  dueMileage?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost?: number;
}

export interface DriverContextData {
  assignedVehicle: VehicleInfo;
  todaysRoutes: TransportTask[];
  tripHistory: TripRecord[];
  performanceMetrics: DriverPerformance;
  maintenanceAlerts: MaintenanceAlert[];
}

// Supervisor-Specific Context Data
export interface SupervisorContextData {
  assignedProjects: Project[];
  teamMembers: TeamMember[];
  pendingApprovals: PendingApproval[];
  dailyReports: SupervisorReport[];
  materialRequests: MaterialRequest[];
  toolAllocations: ToolAllocation[];
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'on_break';
  currentTask: {
    id: number;
    name: string;
    progress: number;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    insideGeofence: boolean;
    lastUpdated: string;
  };
  certifications: Array<{
    name: string;
    status: 'active' | 'expiring' | 'expired';
    expiryDate: string;
  }>;
}

export interface PendingApproval {
  id: number;
  requestType: 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance_payment';
  requesterId: number;
  requesterName: string;
  requestDate: Date;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  details: any;
  estimatedCost?: number;
  approvalDeadline?: Date;
}

export interface SupervisorReport {
  id: string;
  date: string;
  projectId: number;
  manpowerUtilization: {
    totalWorkers: number;
    activeWorkers: number;
    productivity: number;
    efficiency: number;
  };
  progressMetrics: {
    overallProgress: number;
    milestonesCompleted: number;
    tasksCompleted: number;
    hoursWorked: number;
  };
  issues: Array<{
    type: 'safety' | 'quality' | 'delay' | 'resource';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
  }>;
  materialConsumption: Array<{
    materialId: number;
    name: string;
    consumed: number;
    remaining: number;
    unit: string;
  }>;
  photos: Array<{
    photoId: string;
    category: 'progress' | 'issue' | 'completion';
    url: string;
    timestamp: string;
  }>;
}

export interface MaterialRequest {
  id: number;
  projectId: number;
  requesterId: number;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  requiredDate: Date;
  purpose: string;
  justification: string;
  estimatedCost?: number;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
}

export interface ToolAllocation {
  id: number;
  toolId: number;
  toolName: string;
  allocatedTo: number;
  allocatedToName: string;
  allocationDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  condition: 'good' | 'fair' | 'needs_maintenance' | 'damaged';
  location: string;
}

// Component Props Types
export interface DashboardProps {
  userRole: UserRole;
  todaysTasks: TaskAssignment[];
  attendanceStatus: AttendanceState;
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