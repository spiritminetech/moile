// Core TypeScript type definitions for Construction ERP Mobile Application

// Enhanced types for Trip Updates with validation and vehicle requests
export interface TimeWindow {
  startTime: string; // ISO string
  endTime: string; // ISO string
  windowMinutes: number; // configurable window in minutes
  isFlexible: boolean; // whether window can be extended
}

export interface GeofenceLocation {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  name: string;
  type: 'dormitory' | 'construction_site' | 'office' | 'depot';
  isActive: boolean;
}

export interface VehicleRequest {
  requestId?: string;
  taskId: number;
  requestType: 'replacement' | 'additional' | 'emergency';
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  currentLocation: GeoLocation;
  requestedAt: string;
  estimatedWaitTime?: number; // in minutes
  status: 'pending' | 'approved' | 'dispatched' | 'arrived' | 'rejected';
  alternateVehicle?: {
    vehicleId: number;
    plateNumber: string;
    driverName: string;
    driverPhone: string;
    estimatedArrival: string;
  };
}

export interface GracePeriodApplication {
  taskId: number;
  delayMinutes: number;
  delayReason: string;
  gracePeriodMinutes: number;
  autoApproved: boolean;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  attendanceImpact: {
    affectedWorkers: number[];
    gracePeriodApplied: boolean;
    lateMarkingWaived: boolean;
  };
}

export interface ModuleIntegration {
  attendance: {
    gracePeriodApplied: boolean;
    affectedWorkers: number[];
    lateMarkingWaived: boolean;
  };
  projectManagement: {
    manpowerAvailabilityUpdated: boolean;
    deploymentStatusUpdated: boolean;
    delayImpactAssessed: boolean;
  };
  fleetManagement: {
    vehicleStatusUpdated: boolean;
    maintenanceTriggered: boolean;
    replacementRequested: boolean;
  };
}

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
  supervisor?: Supervisor;
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
  } | null;
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
  projectName?: string; // Added project name field
  projectCode?: string; // Project code
  clientName?: string; // Added client name field
  siteName?: string; // Site name
  natureOfWork?: string; // Nature of work
  taskName: string;
  description: string;
  dependencies: number[];
  sequence: number;
  status: 'queued' | 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  location: GeoLocation;
  estimatedHours: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  date?: string; // Task assignment date (YYYY-MM-DD format)
  // Enhanced fields
  priority?: 'low' | 'medium' | 'high' | 'critical';
  workArea?: string;
  floor?: string;
  zone?: string;
  // Worker trade and activity information
  trade?: string;
  activity?: string;
  workType?: string;
  requiredTools?: string[];
  requiredMaterials?: string[];
  // Progress information
  progress?: {
    percentage: number;
    completed: number;
    remaining: number;
    lastUpdated: string | null;
  };
  // Time estimates
  timeEstimate?: {
    estimated: number;
    elapsed: number;
    remaining: number;
  };
  // Daily target information
  dailyTarget?: {
    description: string;
    quantity: number;
    unit: string;
    targetCompletion: number;
    // Enhanced daily target fields
    targetType?: string; // e.g., "Quantity Based", "Time Based", "Area Based"
    areaLevel?: string; // e.g., "Tower A – Level 5", "Main Corridor – Ground Floor"
    startTime?: string; // e.g., "8:00 AM"
    expectedFinish?: string; // e.g., "5:00 PM"
    progressToday?: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
  // Actual output achieved by worker
  actualOutput?: number;
  // Supervisor information
  supervisorName?: string;
  supervisorContact?: string;
  supervisorEmail?: string;
  // Supervisor instructions with attachments
  supervisorInstructions?: string;
  instructionAttachments?: Array<{
    type: 'photo' | 'document' | 'drawing' | 'video';
    filename: string;
    url: string;
    uploadedAt: string;
    uploadedBy: number;
    description?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
  instructionsLastUpdated?: string;
  // Project geofence for map display
  projectGeofence?: {
    latitude: number;
    longitude: number;
    radius: number;
    strictMode?: boolean;
    allowedVariance?: number;
  };
}

// Attendance Types
export interface AttendanceRecord {
  id: number;
  workerId: number;
  projectId: number;
  projectName?: string; // Added project name field
  loginTime: string;
  logoutTime?: string;
  location: GeoLocation;
  sessionType: 'regular' | 'overtime' | 'lunch';
  // Duration fields from API (in minutes)
  workDuration?: number;
  lunchDuration?: number;
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
    // Enhanced worker details
    trade: string;
    supervisorId: number;
    supervisorName: string;
    employeeId: string;
    department: string;
    skillLevel: 'trainee' | 'skilled' | 'senior' | 'specialist';
    emergencyContact?: string;
    // Permission-based visibility
    canViewDetails: boolean;
    canCall: boolean;
    canCheckIn: boolean;
    // Additional status info
    attendanceStatus: 'present' | 'absent' | 'late' | 'on_leave';
    leaveReason?: string;
    expectedArrival?: string;
  }>;
  totalWorkers: number;
  checkedInWorkers: number;
  // Trade-wise breakdown
  tradeBreakdown: Array<{
    trade: string;
    totalWorkers: number;
    checkedInWorkers: number;
    workers: number[]; // Array of worker IDs
  }>;
  // Supervisor-wise breakdown
  supervisorBreakdown: Array<{
    supervisorId: number;
    supervisorName: string;
    totalWorkers: number;
    checkedInWorkers: number;
    workers: number[]; // Array of worker IDs
  }>;
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
  tripId?: number; // Trip log ID when route is started
  tripStartTime?: Date; // Timestamp when route was started
  route: string;
  pickupLocations: Array<{
    locationId: number;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    // Enhanced geofence validation
    geofence: GeofenceLocation;
    timeWindow: TimeWindow;
    workerManifest: Array<{
      workerId: number;
      name: string;
      phone: string;
      checkedIn: boolean;
      checkInTime?: string;
      profileImage?: string;
      // Enhanced worker details
      trade: string;
      supervisorId: number;
      supervisorName: string;
      employeeId: string;
      department: string;
      skillLevel: 'trainee' | 'skilled' | 'senior' | 'specialist';
      emergencyContact?: string;
      // Permission-based visibility
      canViewDetails: boolean;
      canCall: boolean;
      canCheckIn: boolean;
      // Additional status info
      attendanceStatus: 'present' | 'absent' | 'late' | 'on_leave';
      leaveReason?: string;
      expectedArrival?: string;
      // ✅ NEW: Dropoff status tracking
      dropStatus?: 'pending' | 'confirmed' | 'missed';
      wasPickedUp?: boolean;
    }>;
    // Trade-wise breakdown for this location
    tradeBreakdown: Array<{
      trade: string;
      totalWorkers: number;
      checkedInWorkers: number;
      workers: number[]; // Array of worker IDs
    }>;
    // Supervisor-wise breakdown for this location
    supervisorBreakdown: Array<{
      supervisorId: number;
      supervisorName: string;
      totalWorkers: number;
      checkedInWorkers: number;
      workers: number[]; // Array of worker IDs
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
    // Enhanced geofence validation for dropoff
    geofence: GeofenceLocation;
    estimatedArrival: string;
    actualArrival?: string;
  };
  status: 'pending' | 'en_route_pickup' | 'pickup_complete' | 'en_route_dropoff' | 'completed';
  totalWorkers: number;
  checkedInWorkers: number;
  // Enhanced features
  vehicleRequest?: VehicleRequest;
  gracePeriodApplication?: GracePeriodApplication;
  moduleIntegration?: ModuleIntegration;
}

export interface VehicleInfo {
  id: number;
  plateNumber: string;
  model: string;
  year: number;
  capacity: number;
  fuelType?: 'Diesel' | 'Petrol' | 'Electric' | 'Hybrid' | 'CNG';
  currentMileage: number;
  fuelLevel: number;
  assignedDriverName?: string; // Driver assigned to this vehicle
  insurance?: {
    policyNumber: string;
    provider: string;
    expiryDate: string;
    status: 'active' | 'expiring_soon' | 'expired';
  };
  roadTax?: {
    validUntil: string;
    status: 'active' | 'expiring_soon' | 'expired';
  };
  assignedRoute?: {
    routeName: string;
    routeCode: string;
    pickupLocations: string[];
    dropoffLocation: string;
    estimatedDistance: number; // in kilometers
    estimatedDuration: number; // in minutes
  } | null;
  maintenanceSchedule: Array<{
    type: 'oil_change' | 'tire_rotation' | 'inspection' | 'major_service';
    dueDate: string;
    dueMileage: number;
    status: 'upcoming' | 'due' | 'overdue';
  }>;
  fuelLog: Array<{
    id?: number;
    date: string;
    amount: number;
    cost: number;
    mileage: number;
    location: string;
    receiptPhoto?: string;
  }>;
}

// Fuel Log Entry Request
export interface FuelLogEntry {
  vehicleId: number;
  date: string;
  amount: number; // liters
  cost: number;
  mileage: number;
  location: string;
  receiptPhoto?: string; // base64 or URI
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

// Supervisor-Specific Context Data - Matches Backend Response
export interface SupervisorDashboardResponse {
  projects: Array<{
    id: number;
    name: string;
    location: string;
    client?: string; // NEW: Client name
    status?: string; // NEW: Project status (Ongoing/Near Completion/Delayed)
    totalWorkers: number;
    presentWorkers: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    workforceCount: number;
    attendanceSummary: {
      total: number;
      present: number;
      absent: number;
      late: number;
    };
    progressSummary: {
      overallProgress: number;
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      queuedTasks: number;
      dailyTarget: number;
    };
    alerts?: Array<{
      id: string | number;
      type: string;
      priority: string;
      message: string;
      timestamp: string;
      projectId: number;
    }>;
  }>;
  teamOverview: {
    totalMembers: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    onBreak: number;
    overtimeWorkers: number; // NEW: OT workers count
  };
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    queuedTasks: number;
    overdueTasks: number;
  };
  attendanceMetrics: {
    attendanceRate: number;
    onTimeRate: number;
    averageWorkingHours: number;
  };
  pendingApprovals: {
    leaveRequests: number;
    materialRequests: number;
    toolRequests: number;
    urgent: number;
    total: number;
  };
  alerts: Array<{
    id: number | string;
    type: string;
    title: string;
    message: string;
    projectName: string;
    timestamp: string;
    severity: string;
    priority: string;
    workerId?: number;
    workerName?: string;
    projectId?: number;
    expectedWorkers?: number;
    actualWorkers?: number;
    shortfall?: number;
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    projectName: string;
    timestamp: string;
    workerId: number;
    workerName: string;
    taskId?: number;
    taskName?: string;
  }>;
  workerAttendanceDetails?: Array<{ // NEW: Detailed worker attendance
    employeeId: number;
    workerName: string;
    role: string;
    status: string;
    morningCheckIn: string | null;
    morningCheckOut: string | null;
    afternoonCheckIn: string | null;
    afternoonCheckOut: string | null;
    totalHours: number;
    overtimeHours: number;
    isLate: boolean;
    minutesLate: number;
    flags: string[];
  }>;
  summary: {
    totalProjects: number;
    totalWorkers: number;
    totalTasks: number;
    overallProgress: number;
    lastUpdated: string;
    date: string;
  };
}

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
  reportId: string;
  date: string;
  projectId: number;
  projectName: string;
  summary: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
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
  taskMetrics?: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    queuedTasks: number;
    overdueTasks: number;
    onScheduleTasks: number;
    completionRate: number;
    efficiency: number;
    lastUpdated: string;
  };
  issues: Array<{
    type: 'safety' | 'quality' | 'delay' | 'resource' | 'general';
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
  requestType: 'MATERIAL' | 'TOOL';
  itemName: string;
  itemCategory?: string;
  quantity: number;
  unit?: string;
  urgency?: 'NORMAL' | 'HIGH' | 'URGENT';
  requiredDate: Date;
  purpose: string;
  justification?: string;
  specifications?: string;
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

// Notification Types (Placeholder for future implementation)
export type NotificationType = 
  | 'team_alert' 
  | 'attendance_issue' 
  | 'task_update' 
  | 'approval_request' 
  | 'safety_incident' 
  | 'material_request' 
  | 'progress_update' 
  | 'system_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface SupervisorNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  timestamp: Date;
  projectId?: number;
  workerId?: number;
  taskId?: number;
  actionRequired?: boolean;
  actionUrl?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface NotificationCategory {
  type: NotificationType;
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationSettings {
  globalEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  categories: NotificationCategory[];
}

export interface NotificationState {
  notifications: SupervisorNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
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


// ============================================================================
// NEW TYPES FOR TODAY'S TASK CRITICAL FEATURES
// ============================================================================

// Instruction Read Confirmation Types
export interface InstructionReadStatus {
  hasRead: boolean;
  readAt: Date;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
}

// Target Calculation Types
export interface TargetCalculation {
  description: string;
  quantity: number;
  unit: string;
  targetCompletion: number;
  // Target calculation transparency
  calculationMethod: string;
  budgetedManDays: number | null;
  totalRequiredOutput: number | null;
  derivedFrom: string;
}

// Performance Metrics Types
export interface PerformanceMetrics {
  worker: {
    id: number;
    name: string;
    trade: string;
    role: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    queuedTasks: number;
    completionRate: number;
    averageProgress: number;
    onTimeRate: number;
  };
  comparison: {
    teamAverage: number;
    difference: number;
    performanceTrend: 'above_average' | 'below_average' | 'average';
  };
  tradeMetrics: {
    trade: string;
    totalTasksInTrade: number;
    completionRate: number;
    averageProgress: number;
    ranking: number | null;
  };
  achievements: Achievement[];
}

export interface Achievement {
  type: string;
  title: string;
  description: string;
  earnedAt: Date;
}

// Enhanced Project Type (extends existing Project interface)
export interface EnhancedProject extends Project {
  code: string;
  siteName: string;
  natureOfWork: string;
  geofence: {
    center: GeoLocation;
    radius: number;
    strictMode: boolean;
    allowedVariance: number;
  };
}

// Enhanced Worker Type
export interface EnhancedWorker {
  id: number;
  name: string;
  role: string;
  trade: string;
  specializations: string[];
  checkInStatus: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    insideGeofence: boolean;
    lastUpdated: string | null;
  };
}

// Enhanced Task Assignment (extends existing TaskAssignment)
export interface EnhancedTaskAssignment extends TaskAssignment {
  dailyTarget: TargetCalculation;
  instructionReadStatus: InstructionReadStatus | null;
  projectCode: string;
  projectName: string;
  clientName: string;
  natureOfWork: string;
}

// Map Screen Props
export interface TaskLocationMapProps {
  task: EnhancedTaskAssignment;
  projectGeofence: {
    latitude: number;
    longitude: number;
    radius: number;
    strictMode: boolean;
    allowedVariance: number;
  };
  workerLocation: GeoLocation | null;
  onNavigate: () => void;
  onClose: () => void;
}

// Target Calculation Modal Props
export interface TargetCalculationModalProps {
  visible: boolean;
  target: TargetCalculation;
  onClose: () => void;
}

// Instruction Acknowledgment Props
export interface InstructionAcknowledgmentProps {
  assignmentId: number;
  instructions: string;
  attachments: Array<{
    type: string;
    filename: string;
    url: string;
  }>;
  readStatus: InstructionReadStatus | null;
  onRead: () => Promise<void>;
  onAcknowledge: (notes?: string) => Promise<void>;
  isOffline: boolean;
}

// Performance Metrics Card Props
export interface PerformanceMetricsCardProps {
  metrics: PerformanceMetrics;
  onViewDetails: () => void;
}

// Device Info Type
export interface DeviceInfo {
  platform: string;
  version: string | number;
  model?: string;
  manufacturer?: string;
}

// API Request/Response Types for New Endpoints
export interface MarkInstructionsReadRequest {
  location?: GeoLocation;
  deviceInfo?: DeviceInfo;
}

export interface MarkInstructionsReadResponse {
  success: boolean;
  message: string;
  data: {
    readAt: Date;
    acknowledged: boolean;
  };
}

export interface AcknowledgeInstructionsRequest {
  notes?: string;
  location?: GeoLocation;
  deviceInfo?: DeviceInfo;
}

export interface AcknowledgeInstructionsResponse {
  success: boolean;
  message: string;
  data: {
    readAt: Date;
    acknowledged: boolean;
    acknowledgedAt: Date;
  };
}

export interface GetPerformanceMetricsResponse {
  success: boolean;
  data: PerformanceMetrics;
}

// Enhanced Dashboard API Response (extends existing)
export interface EnhancedDashboardApiResponse extends DashboardApiResponse {
  project: {
    id: number;
    name: string;
    code: string;
    siteName: string;
    clientName: string;
    location: string;
    natureOfWork: string;
    geofence: {
      latitude: number;
      longitude: number;
      radius: number;
      strictMode: boolean;
      allowedVariance: number;
    };
  };
  worker: EnhancedWorker;
  tasks: EnhancedTaskAssignment[];
}
