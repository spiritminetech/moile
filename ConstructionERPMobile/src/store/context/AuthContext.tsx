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

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null, requiresCompanySelection: false, availableCompanies: [] };
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, ...action.payload, isLoading: false, error: null, requiresCompanySelection: false, availableCompanies: [] };
    case 'LOGIN_FAILURE':
      return { ...state, isAuthenticated: false, user: null, company: null, token: null, refreshToken: null, tokenExpiry: null, permissions: [], isLoading: false, error: action.payload, requiresCompanySelection: false, availableCompanies: [] };
    case 'COMPANY_SELECTION_REQUIRED':
      return { ...state, isLoading: false, error: null, requiresCompanySelection: true, availableCompanies: action.payload.companies };
    case 'LOGOUT':
      return { ...initialAuthState, isLoading: false };
    case 'TOKEN_REFRESH':
      return { ...state, token: action.payload.token, tokenExpiry: action.payload.tokenExpiry };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'RESTORE_AUTH':
      return { ...state, isAuthenticated: true, ...action.payload, isLoading: false, error: null, requiresCompanySelection: false, availableCompanies: [] };
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

// Provider props
interface AuthProviderProps { children: ReactNode; }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Restore auth on mount
  useEffect(() => { restoreAuthState(); }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login(credentials);
      
      if (response.success && response.user && response.company && response.token) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            company: response.company,
            token: response.token,
            refreshToken: response.refreshToken || response.token,
            tokenExpiry: new Date(Date.now() + (response.expiresIn || 3600) * 1000),
            permissions: response.permissions || [],
          },
        });
      } else if (response.companies && response.companies.length > 1) {
        // Multi-company user needs to select company
        dispatch({
          type: 'COMPANY_SELECTION_REQUIRED',
          payload: {
            companies: response.companies,
            userId: response.userId || 0,
          },
        });
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const selectCompany = async (companyId: number) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // Get userId from available companies context (you might need to store this)
      const userId = 1; // This should come from the previous login response
      
      const response = await authService.selectCompany(userId, companyId);
      
      if (response.success && response.user && response.company && response.token) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            company: response.company,
            token: response.token,
            refreshToken: response.refreshToken || response.token,
            tokenExpiry: new Date(Date.now() + (response.expiresIn || 3600) * 1000),
            permissions: response.permissions || [],
          },
        });
      } else {
        throw new Error('Company selection failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Company selection failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const restoreAuthState = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const [user, company, tokens, permissions] = await Promise.all([
          authService.getStoredUser(),
          authService.getStoredCompany(),
          authService.getStoredTokens(),
          authService.getStoredPermissions(),
        ]);
        
        if (user && company && tokens.token && tokens.tokenExpiry) {
          dispatch({
            type: 'RESTORE_AUTH',
            payload: {
              user,
              company,
              token: tokens.token,
              refreshToken: tokens.refreshToken || tokens.token,
              tokenExpiry: tokens.tokenExpiry,
              permissions,
            },
          });
        }
      }
    } catch (error) {
      console.warn('Failed to restore auth state:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = (token: string, tokenExpiry: Date) => { 
    dispatch({ type: 'TOKEN_REFRESH', payload: { token, tokenExpiry } }); 
  };
  
  const updateUser = (user: User) => { 
    dispatch({ type: 'UPDATE_USER', payload: user }); 
  };

  return <AuthContext.Provider value={{ state, dispatch, login, selectCompany, logout, refreshToken, updateUser, restoreAuthState }}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
