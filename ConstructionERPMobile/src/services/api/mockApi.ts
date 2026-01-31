// Mock API for development and testing

import { LoginCredentials, LoginResponse } from './AuthService';
import { ApiResponse, User, Company } from '../../types';

// Mock delay to simulate network request
const mockDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data
const mockUsers = [
  {
    email: 'worker@test.com',
    password: 'password123',
    user: {
      id: 1,
      email: 'worker@test.com',
      name: 'John Worker',
      role: 'Worker' as const,
    },
    company: {
      id: 1,
      name: 'ABC Construction',
      role: 'Worker' as const,
    },
  },
  {
    email: 'supervisor@test.com',
    password: 'password123',
    user: {
      id: 2,
      email: 'supervisor@test.com',
      name: 'Jane Supervisor',
      role: 'Supervisor' as const,
    },
    company: {
      id: 1,
      name: 'ABC Construction',
      role: 'Supervisor' as const,
    },
  },
  {
    email: 'driver@test.com',
    password: 'password123',
    user: {
      id: 3,
      email: 'driver@test.com',
      name: 'Mike Driver',
      role: 'Driver' as const,
    },
    company: {
      id: 1,
      name: 'ABC Construction',
      role: 'Driver' as const,
    },
  },
];

export class MockApiService {
  static async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    console.log('🎭 Mock API: Login attempt', credentials);
    
    // Simulate network delay
    await mockDelay(800);

    // Find user by email and password
    const mockUser = mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!mockUser) {
      console.log('🎭 Mock API: Login failed - invalid credentials');
      throw new Error('Invalid email or password');
    }

    // Generate mock JWT token
    const mockToken = `mock.jwt.token.${Date.now()}`;
    const mockRefreshToken = `mock.refresh.token.${Date.now()}`;
    const expiresIn = 3600; // 1 hour

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        success: true,
        autoSelected: true,
        token: mockToken,
        refreshToken: mockRefreshToken,
        expiresIn,
        employeeId: mockUser.user.id,
        user: mockUser.user,
        company: mockUser.company,
        permissions: ['read', 'write'], // Mock permissions
      },
      message: 'Login successful',
    };

    console.log('🎭 Mock API: Login successful', {
      email: credentials.email,
      role: mockUser.user.role,
      company: mockUser.company.name,
    });

    return response;
  }

  static async logout(): Promise<ApiResponse<any>> {
    console.log('🎭 Mock API: Logout');
    await mockDelay(300);
    
    return {
      success: true,
      data: {},
      message: 'Logout successful',
    };
  }

  static async refreshToken(): Promise<ApiResponse<any>> {
    console.log('🎭 Mock API: Token refresh');
    await mockDelay(500);
    
    // For mock, just return new tokens
    const mockToken = `mock.jwt.token.${Date.now()}`;
    const mockRefreshToken = `mock.refresh.token.${Date.now()}`;
    
    return {
      success: true,
      data: {
        success: true,
        token: mockToken,
        refreshToken: mockRefreshToken,
        expiresIn: 3600,
      },
      message: 'Token refreshed',
    };
  }
}

// Test credentials for easy reference
export const TEST_CREDENTIALS = {
  worker: { email: 'worker@test.com', password: 'password123' },
  supervisor: { email: 'supervisor@test.com', password: 'password123' },
  driver: { email: 'driver@test.com', password: 'password123' },
};