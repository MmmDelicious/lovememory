import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import pairService from '../services/pair.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [partner, setPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthData = () => {
    localStorage.removeItem('auth');
    setAuthData(null);
    setPartner(null);
  };

  const fetchPartner = useCallback(async () => {
    if (!authData?.token) {
      setPartner(null);
      return;
    }
    try {
      // ИСПРАВЛЕНО: используем getStatus, как в pair.service.js
      const pairStatus = await pairService.getStatus(); 
      if (pairStatus.data && pairStatus.data.partner) {
        setPartner(pairStatus.data.partner);
      } else {
        setPartner(null);
      }
    } catch (error) {
      // Ошибка "Не удалось получить данные" - нормальна, если пары нет. Не будем засорять консоль.
      if (error.response && error.response.status !== 404) {
          console.error("Не удалось получить данные о партнере:", error);
      }
      setPartner(null);
    }
  }, [authData?.token]);


  const handleAuthChange = useCallback(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth && parsedAuth.token && parsedAuth.user) {
          setAuthData(parsedAuth);
        } else {
          clearAuthData();
        }
      } catch (e) {
        console.error("Ошибка парсинга данных пользователя из localStorage", e);
        clearAuthData();
      }
    } else {
      clearAuthData();
    }
  }, []);

  useEffect(() => {
    handleAuthChange();
    setIsLoading(false);

    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [handleAuthChange]);

  useEffect(() => {
    if (authData?.token) {
      fetchPartner();
    }
  }, [authData, fetchPartner]);

  const login = async (email, password) => {
    const userData = await authService.login(email, password);
    localStorage.setItem('auth', JSON.stringify(userData));
    setAuthData(userData);
    return userData;
  };

  const logout = () => {
    authService.logout();
    clearAuthData();
  };

  const value = {
    user: authData?.user,
    partner,
    token: authData?.token,
    isAuthenticated: !!authData?.token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};