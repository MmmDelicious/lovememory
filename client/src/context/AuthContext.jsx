import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthChange = useCallback(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth && parsedAuth.token && parsedAuth.user) {
          setAuthData(parsedAuth);
        } else {
          setAuthData(null);
        }
      } catch (e) {
        console.error("Ошибка парсинга данных пользователя из localStorage", e);
        localStorage.removeItem('auth');
        setAuthData(null);
      }
    } else {
      setAuthData(null);
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

  const login = async (email, password) => {
    const userData = await authService.login(email, password);
    localStorage.setItem('auth', JSON.stringify(userData));
    setAuthData(userData);
    return userData;
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('auth');
    setAuthData(null);
  };

  const value = {
    user: authData?.user,
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