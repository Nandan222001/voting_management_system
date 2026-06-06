import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { onUnauthorized } from '../services/api';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  is_verified: boolean;
  tenant_id: number | null;
  
  // Profile Details
  date_of_birth?: string;
  gender?: string;
  parent_name?: string;
  voter_id?: string;
  designation?: string;
  
  // KYC Details
  kyc_type?: string;
  kyc_front_url?: string;
  kyc_back_url?: string;

  // Address Information (Permanent)
  house_number?: string;
  street_address?: string;
  village?: string;
  landmark?: string;
  pincode?: string;
  city?: string;
  taluka?: string;
  district?: string;
  state?: string;
  country?: string;

  // Current Address
  current_street_address?: string;
  current_city?: string;
  current_district?: string;
  current_state?: string;
  current_pincode?: string;

  // Mapping
  target_id?: number | null;
  committee_id?: number | null;
  membership_plan_id?: number | null;
  membership_plan?: {
    id: number;
    name: string;
    [key: string]: any;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<any>;
  createRegistrationOrder: (tenantId: number, planId: number) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Register global unauthorized handler
    onUnauthorized(() => {
      setToken(null);
      setUser(null);
    });

    // Load stored auth data on mount
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          
          if (parsedUser?.tenant_id) {
            await AsyncStorage.setItem('tenant_id', String(parsedUser.tenant_id));
          }

          // Validate token by fetching fresh user data
          try {
            const freshUser = await authService.getProfile();
            if (freshUser) {
              setUser(freshUser);
            }
          } catch (error: any) {
            console.error('Token validation failed', error);
            // Interceptor handles status 401 and calls onUnauthorized
          }
        }
      } catch (e) {
        console.error('Failed to load auth data from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    // We return the result but don't automatically set the state here
    // to allow the Login screen to check the user's status first.
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const register = async (userData: any) => {
    return await authService.register(userData);
  };

  const createRegistrationOrder = async (tenantId: number, planId: number) => {
    return await authService.createRegistrationOrder(tenantId, planId);
  };

  const verifyOtp = async (email: string, otp: string) => {
    const result = await authService.verifyOtp(email, otp);
    if (result.token) {
      setToken(result.token);
      if (result.user) {
        setUser(result.user);
      }
    }
  };

  const updateProfile = async (userData: any) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        // Fallback: reload from storage if service returned nothing but presumably updated it
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to update profile state', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        register,
        verifyOtp,
        updateProfile,
        setToken,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
