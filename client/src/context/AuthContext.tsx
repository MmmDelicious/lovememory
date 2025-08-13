import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import pairService from '../services/pair.service';
import api from '../services/api';
import type { AuthData, AuthContextType, User, RegisterRequest } from '../../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [partner, setPartner] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setAuthentication = useCallback((newAuthData: AuthData) => {
    if (newAuthData && newAuthData.token && newAuthData.user) {
      localStorage.setItem('auth', JSON.stringify(newAuthData));
      api.defaults.headers.common['Authorization'] = `Bearer ${newAuthData.token}`;
      setAuthData(newAuthData);
    } else {
      console.error('Attempted to set invalid auth data', newAuthData);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    if (authData) {
      const newAuthData: AuthData = {
        ...authData,
        user: updatedUser,
      };
      setAuthentication(newAuthData);
    }
  }, [authData, setAuthentication]);

  const clearAuthData = useCallback((): void => {
    localStorage.removeItem('auth');
    delete api.defaults.headers.common['Authorization'];
    setAuthData(null);
    setPartner(null);
  }, []);

  const fetchPartner = useCallback(async (): Promise<void> => {
    if (!authData?.token) {
      setPartner(null);
      return;
    }
    try {
      const pairStatus = await pairService.getStatus();
      if (pairStatus.data && pairStatus.data.status === 'active' && pairStatus.data.partner) {
        setPartner(pairStatus.data.partner);
      } else {
        setPartner(null);
      }
    } catch (error: any) {
      if (error.response && error.response.status !== 404) {
        console.error('Не удалось получить данные о партнере:', error);
      }
      setPartner(null);
    }
  }, [authData?.token]);

  const login = async (email: string, password: string): Promise<AuthData> => {
    const newAuthData = await authService.login(email, password);
    setAuthentication(newAuthData);
    return newAuthData;
  };

  const register = async (userData: RegisterRequest): Promise<AuthData> => {
    const newAuthData = await authService.register(userData);
    setAuthentication(newAuthData);
    return newAuthData;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      clearAuthData();
    }
  };

  useEffect(() => {
    const handleInitialLoad = () => {
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        try {
          const parsedAuth = JSON.parse(storedAuth) as AuthData;
          setAuthentication(parsedAuth);
        } catch (e) {
          console.error('Ошибка парсинга данных пользователя из localStorage', e);
          clearAuthData();
        }
      }
      setIsLoading(false);
    };
    handleInitialLoad();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth') {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
          setAuthentication(JSON.parse(storedAuth) as AuthData);
        } else {
          clearAuthData();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearAuthData, setAuthentication]);

  useEffect(() => {
    const handleGoogleAuth = (event: MessageEvent) => {
      if (event.origin !== import.meta.env.VITE_SERVER_URL) {
        return;
      }
      if ((event.data as any).type === 'auth-success') {
        setAuthentication((event.data as any).payload as AuthData);
      } else if ((event.data as any).type === 'auth-error') {
        console.error('Google auth error:', (event.data as any).payload);
      }
    };
    window.addEventListener('message', handleGoogleAuth);
    return () => window.removeEventListener('message', handleGoogleAuth);
  }, [setAuthentication]);

  useEffect(() => {
    if (authData?.token) {
      fetchPartner();
    }
  }, [authData, fetchPartner]);

  const value: AuthContextType = {
    user: authData?.user ?? null,
    partner,
    token: authData?.token ?? null,
    isAuthenticated: !!authData?.token,
    isLoading,
    login,
    logout,
    register,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};


