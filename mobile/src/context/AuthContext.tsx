import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  voter_id?: string;
  image?: string;
  role: string;
  is_verified: boolean;
  tenant_id: number | null;
  district: string | null;
  designation: string | null;
  date_of_birth?: string;
  gender?: string;
  parent_name?: string;
  kyc_type?: string;
  street_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  membership_plan_id?: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load stored auth data on mount
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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
    setToken(result.access_token);
    setUser(result.user);
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const register = async (userData: any) => {
    return await authService.register(userData);
  };

  const verifyOtp = async (email: string, otp: string) => {
    await authService.verifyOtp(email, otp);
  };

  const updateProfile = async (userData: any) => {
    const updatedUser = await authService.updateProfile(userData);
    setUser(updatedUser);
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
