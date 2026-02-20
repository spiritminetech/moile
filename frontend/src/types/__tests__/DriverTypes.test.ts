import {
  DriverDashboardResponse,
  TransportTask,
  VehicleInfo,
  TripRecord,
  DriverPerformance,
  MaintenanceAlert,
  DriverContextData,
  User,
  AuthState
} from '../index';

describe('Driver-Specific Type Definitions', () => {
  describe('DriverDashboardResponse', () => {
    it('should accept valid driver dashboard data', () => {
      const dashboardData: DriverDashboardResponse = {
        todaysTransportTasks: [
          {
            taskId: 1,
            route: 'Route A',
            pickupTime: '08:00',
            pickupLocation: {
              name: 'Dormitory A',
              address: '123 Main St',
              coordinates: {
                latitude: 1.3521,
                longitude: 103.8198
              }
            },
            dropoffLocation: {
              name: 'Construction Site',
              address: '456 Site Ave',
              coordinates: {
                latitude: 1.3621,
                longitude: 103.8298
              }
            },
            workerCount: 15,
            status: 'pending'
          }
        ],
        assignedVehicle: {
          id: 1,
          plateNumber: 'SBA1234A',
          model: 'Toyota Hiace',
          capacity: 20,
          fuelLevel: 85,
          maintenanceStatus: 'good'
        },
        performanceMetrics: {
          onTimePerformance: 95.5,
          completedTrips: 120,
          totalDistance: 2500,
          fuelEfficiency: 12.5
        }
      };

      expect(dashboardData.todaysTransportTasks).toHaveLength(1);
      expect(dashboardData.assignedVehicle.plateNumber).toBe('SBA1234A');
      expect(dashboardData.performanceMetrics.onTimePerformance).toBe(95.5);
    });
  });

  describe('TransportTask', () => {
    it('should accept valid transport task data', () => {
      const transportTask: TransportTask = {
        taskId: 1,
        route: 'Route A',
        pickupLocations: [
          {
            locationId: 1,
            name: 'Dormitory A',
            address: '123 Main St',
            coordinates: {
              latitude: 1.3521,
              longitude: 103.8198
            },
            workerManifest: [
              {
                workerId: 1,
                name: 'John Doe',
                phone: '+65 9123 4567',
                checkedIn: false
              }
            ],
            estimatedPickupTime: '08:00'
          }
        ],
        dropoffLocation: {
          name: 'Construction Site',
          address: '456 Site Ave',
          coordinates: {
            latitude: 1.3621,
            longitude: 103.8298
          },
          estimatedArrival: '08:30'
        },
        status: 'pending',
        totalWorkers: 15,
        checkedInWorkers: 0
      };

      expect(transportTask.pickupLocations).toHaveLength(1);
      expect(transportTask.pickupLocations[0].workerManifest[0].name).toBe('John Doe');
      expect(transportTask.status).toBe('pending');
    });
  });

  describe('VehicleInfo', () => {
    it('should accept valid vehicle information', () => {
      const vehicleInfo: VehicleInfo = {
        id: 1,
        plateNumber: 'SBA1234A',
        model: 'Toyota Hiace',
        year: 2020,
        capacity: 20,
        currentMileage: 45000,
        fuelLevel: 85,
        maintenanceSchedule: [
          {
            type: 'oil_change',
            dueDate: '2024-03-15',
            dueMileage: 50000,
            status: 'upcoming'
          }
        ],
        fuelLog: [
          {
            date: '2024-02-01',
            amount: 50,
            cost: 75,
            mileage: 44500,
            location: 'Shell Station'
          }
        ]
      };

      expect(vehicleInfo.plateNumber).toBe('SBA1234A');
      expect(vehicleInfo.maintenanceSchedule).toHaveLength(1);
      expect(vehicleInfo.fuelLog).toHaveLength(1);
    });
  });

  describe('TripRecord', () => {
    it('should accept valid trip record data', () => {
      const tripRecord: TripRecord = {
        tripId: 1,
        date: new Date('2024-02-01'),
        route: 'Route A',
        pickupLocations: ['Dormitory A', 'Dormitory B'],
        dropoffLocation: 'Construction Site',
        totalWorkers: 15,
        actualPickupTime: new Date('2024-02-01T08:00:00'),
        actualDropoffTime: new Date('2024-02-01T08:30:00'),
        totalDistance: 25,
        fuelUsed: 3.5,
        delays: [
          {
            reason: 'Traffic jam',
            duration: 10,
            location: 'Main Street'
          }
        ],
        status: 'completed'
      };

      expect(tripRecord.pickupLocations).toHaveLength(2);
      expect(tripRecord.delays).toHaveLength(1);
      expect(tripRecord.status).toBe('completed');
    });
  });

  describe('DriverPerformance', () => {
    it('should accept valid driver performance metrics', () => {
      const performance: DriverPerformance = {
        onTimePerformance: 95.5,
        totalTripsCompleted: 120,
        totalDistance: 2500,
        averageFuelEfficiency: 12.5,
        safetyScore: 98.2,
        customerRating: 4.8,
        incidentCount: 1
      };

      expect(performance.onTimePerformance).toBe(95.5);
      expect(performance.safetyScore).toBe(98.2);
      expect(performance.incidentCount).toBe(1);
    });
  });

  describe('MaintenanceAlert', () => {
    it('should accept valid maintenance alert data', () => {
      const alert: MaintenanceAlert = {
        id: 1,
        vehicleId: 1,
        type: 'scheduled',
        description: 'Oil change due',
        dueDate: new Date('2024-03-15'),
        dueMileage: 50000,
        priority: 'medium',
        estimatedCost: 150
      };

      expect(alert.type).toBe('scheduled');
      expect(alert.priority).toBe('medium');
      expect(alert.estimatedCost).toBe(150);
    });
  });

  describe('DriverContextData', () => {
    it('should accept valid driver context data', () => {
      const contextData: DriverContextData = {
        assignedVehicle: {
          id: 1,
          plateNumber: 'SBA1234A',
          model: 'Toyota Hiace',
          year: 2020,
          capacity: 20,
          currentMileage: 45000,
          fuelLevel: 85,
          maintenanceSchedule: [],
          fuelLog: []
        },
        todaysRoutes: [],
        tripHistory: [],
        performanceMetrics: {
          onTimePerformance: 95.5,
          totalTripsCompleted: 120,
          totalDistance: 2500,
          averageFuelEfficiency: 12.5,
          safetyScore: 98.2,
          customerRating: 4.8,
          incidentCount: 1
        },
        maintenanceAlerts: []
      };

      expect(contextData.assignedVehicle.plateNumber).toBe('SBA1234A');
      expect(contextData.performanceMetrics.onTimePerformance).toBe(95.5);
    });
  });

  describe('Enhanced User interface with driver data', () => {
    it('should accept user with driver-specific data', () => {
      const driverUser: User = {
        id: 1,
        email: 'driver@example.com',
        name: 'John Driver',
        role: 'Driver',
        driverData: {
          licenseNumber: 'DL123456789',
          licenseClass: 'Class 4',
          licenseExpiry: new Date('2025-12-31'),
          assignedVehicles: [1, 2],
          certifications: ['Defensive Driving', 'First Aid']
        }
      };

      expect(driverUser.role).toBe('Driver');
      expect(driverUser.driverData?.licenseNumber).toBe('DL123456789');
      expect(driverUser.driverData?.assignedVehicles).toHaveLength(2);
    });
  });

  describe('Enhanced AuthState with driver context', () => {
    it('should accept auth state with driver context', () => {
      const authState: AuthState = {
        isAuthenticated: true,
        user: {
          id: 1,
          email: 'driver@example.com',
          name: 'John Driver',
          role: 'Driver'
        },
        company: {
          id: 1,
          name: 'Construction Co',
          role: 'Driver'
        },
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        tokenExpiry: new Date(),
        permissions: ['transport:read', 'vehicle:read'],
        driverContext: {
          assignedVehicle: {
            id: 1,
            plateNumber: 'SBA1234A',
            model: 'Toyota Hiace',
            year: 2020,
            capacity: 20,
            currentMileage: 45000,
            fuelLevel: 85,
            maintenanceSchedule: [],
            fuelLog: []
          },
          todaysRoutes: [],
          tripHistory: [],
          performanceMetrics: {
            onTimePerformance: 95.5,
            totalTripsCompleted: 120,
            totalDistance: 2500,
            averageFuelEfficiency: 12.5,
            safetyScore: 98.2,
            customerRating: 4.8,
            incidentCount: 1
          },
          maintenanceAlerts: []
        }
      };

      expect(authState.user?.role).toBe('Driver');
      expect(authState.driverContext?.assignedVehicle.plateNumber).toBe('SBA1234A');
    });
  });
});