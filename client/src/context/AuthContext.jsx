import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import pairService from '../services/pair.service';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [partner, setPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuthentication = useCallback((newAuthData) => {
    if (newAuthData && newAuthData.token && newAuthData.user) {
      localStorage.setItem('auth', JSON.stringify(newAuthData));
      api.defaults.headers.common['Authorization'] = `Bearer ${newAuthData.token}`;
      setAuthData(newAuthData);
    } else {
      console.error("Attempted to set invalid auth data", newAuthData);
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    if (authData) {
      const newAuthData = {
        ...authData,
        user: updatedUser
      };
      setAuthentication(newAuthData);
    }
  }, [authData, setAuthentication]);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('auth');
    delete api.defaults.headers.common['Authorization'];
    setAuthData(null);
    setPartner(null);
  }, []);

  const fetchPartner = useCallback(async () => {
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
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        console.error("Не удалось получить данные о партнере:", error);
      }
      setPartner(null);
    }
  }, [authData?.token]);

  const login = async (email, password) => {
    const newAuthData = await authService.login(email, password);
    setAuthentication(newAuthData);
    return newAuthData;
  };

  const register = async (userData) => {
    const newAuthData = await authService.register(userData);
    setAuthentication(newAuthData);
    return newAuthData;
  };

  const logout = async () => {
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
          const parsedAuth = JSON.parse(storedAuth);
          setAuthentication(parsedAuth);
        } catch (e) {
          console.error("Ошибка парсинга данных пользователя из localStorage", e);
          clearAuthData();
        }
      }
      setIsLoading(false);
    };
    handleInitialLoad();

    const handleStorageChange = (event) => {
      if (event.key === 'auth') {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
          setAuthentication(JSON.parse(storedAuth));
        } else {
          clearAuthData();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearAuthData, setAuthentication]);

  useEffect(() => {
    const handleGoogleAuth = (event) => {
      if (event.origin !== import.meta.env.VITE_SERVER_URL) {
        return;
      }
      if (event.data.type === 'auth-success') {
        setAuthentication(event.data.payload);
      } else if (event.data.type === 'auth-error') {
        console.error('Google auth error:', event.data.payload);
        // You might want to show an error message to the user here
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

  const value = {
    user: authData?.user,
    partner,
    token: authData?.token,
    isAuthenticated: !!authData?.token,
    isLoading,
    login,
    logout,
    register,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};