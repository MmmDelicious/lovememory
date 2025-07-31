import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import userService from '../services/user.service';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [coins, setCoins] = useState(0);
  const { user, isLoading: isAuthLoading } = useAuth();

  const fetchCoins = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setCoins(0);
      return;
    }
    
    try {
      const response = await userService.getProfile();
      setCoins(response.data.coins);
    } catch (error) {
      console.error("Failed to fetch user coins:", error);
      setCoins(0);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const value = { coins, setCoins, refreshCoins: fetchCoins };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};