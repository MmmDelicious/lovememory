import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth && parsedAuth.token && parsedAuth.user) {
          setAuthData(parsedAuth);
        }
      } catch (e) {
        console.error("Ошибка парсинга данных пользователя из localStorage", e);
        localStorage.removeItem('auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const userData = await authService.login(email, password);
    setAuthData(userData);
    localStorage.setItem('auth', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    authService.logout();
    setAuthData(null);
    localStorage.removeItem('auth');
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