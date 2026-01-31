// Authentication Context Provider

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, Company } from '../../types';
import { authService, LoginCredentials } from '../../services/api/AuthService';

// Initial state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  company: null,
  token: null,
  refreshToken: null,
  tokenExpiry: null,
  permissions: [],
  isLoading: false,
  error: null,
  requiresCompanySelection: false,
  availableCompanies: [],
};

// Action types
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; company: Company; token: string; refreshToken: string; tokenExpiry: Date; permissions: string[] } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'COMPANY_SELECTION_REQUIRED'; payload: { companies: Company[]; userId: number } }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH'; payload: { token: string; tokenExpiry: Date } }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'RESTORE_AUTH'; payload: { user: User; company: Company; token: string; refreshToken: string; tokenExpiry: Date; permissions: string[] } };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        requiresCompanySelection: false,
        availableCompanies: [],
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        company: action.payload.company,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        tokenExpiry: action.payload.tokenExpiry,
        permissions: action.payload.permissions,
        isLoading: false,
        error: null,
        requiresCompanySelection: false,
        availableCompanies: [],
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        company: null,
        token: null,
        refreshToken: null,
        tokenExpiry: null,
        permissions: [],
        isLoading: false,
        error: action.payload,
        requiresCompanySelection: false,
        availableCompanies: [],
      };
    case 'COMPANY_SELECTION_REQUIRED':
      return {
        ...state,
        isLoading: false,
        error: null,
        requiresCompanySelection: true,
        availableCompanies: action.payload.companies,
      };
    case 'LOGOUT':
      return {
        ...initialAuthState,
        isLoading: false,
      };
    case 'TOKEN_REFRESH':
      return {
        ...state,
        token: action.payload.token,
        tokenExpiry: action.payload.tokenExpiry,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'RESTORE_AUTH':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        company: action.payload.company,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        tokenExpiry: action.payload.tokenExpiry,
        permissions: action.payload.permissions,
        isLoading: false,
        error: null,
        requiresCompanySelection: false,
        availableCompanies: [],
      };
    default:
      return state;
  }
};

// Context type
interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (credentials: LoginCredentials) => Promise<void>;
  selectCompany: (companyId: number) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (token: string, tokenExpiry: Date) => void;
  updateUser: (user: User) => void;
  restoreAuthState: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Restore authentication state on app start
  useEffect(() => {
    restoreAuthState();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const loginResponse = await authService.login(credentials);
      
      // Handle company selection requirement
      if (!loginResponse.autoSelected && loginResponse.companies) {
        dispatch({
          type: 'COMPANY_SELECTION_REQUIRED',
          payload: {
            companies: loginResponse.companies,
            userId: loginResponse.userId!,
          },
        });
        return;
      }
      
      // Handle successful auto-selected login
      if (loginResponse.autoSelected && loginResponse.token) {
        const tokenExpiry = new Date(Date.now() + loginResponse.expiresIn! * 1000);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: loginResponse.user!,
            company: loginResponse.company!,
            token: loginResponse.token,
            refreshToken: loginResponse.refreshToken!,
            tokenExpiry,
            permissions: loginResponse.permissions || [],
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const selectCompany = async (companyId: number): Promise<void> => {
    try {
      if (!state.availableCompanies || state.availableCompanies.length === 0) {
        throw new Error('No companies available for selection');
      }

      // Find userId from previous login attempt (stored temporarily)
      // In a real implementation, you might store this differently
      const userId = 1; // This should come from the previous login response
      
      const response = await authService.selectCompany(userId, companyId);
      const tokenExpiry = new Date(Date.now() + response.expiresIn! * 1000);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user!,
          company: response.company!,
          token: response.token!,
          refreshToken: response.refreshToken!,
          tokenExpiry,
          permissions: response.permissions || [],
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Company selection failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      // Even if logout fails, clear local state
      dispatch({ type: 'LOGOUT' });
      console.error('Logout error:', error);
    }
  };

  const refreshToken = (token: string, tokenExpiry: Date) => {
    dispatch({
      type: 'TOKEN_REFRESH',
      payload: { token, tokenExpiry },
    });
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const restoreAuthState = async (): Promise<void> => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const user = await authService.getStoredUser();
        const company = await authService.getStoredCompany();
        const permissions = await authService.getStoredPermissions();
        const tokens = await authService.getStoredTokens();
        
        if (user && company && tokens.token && tokens.refreshToken && tokens.tokenExpiry) {
          dispatch({
            type: 'RESTORE_AUTH',
            payload: {
              user,
              company,
              token: tokens.token,
              refreshToken: tokens.refreshToken,
              tokenExpiry: tokens.tokenExpiry,
              permissions,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error);
      // If restoration fails, ensure we're in logged out state
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value: AuthContextType = {
    state,
    dispatch,
    login,
    selectCompany,
    logout,
    refreshToken,
    updateUser,
    restoreAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;