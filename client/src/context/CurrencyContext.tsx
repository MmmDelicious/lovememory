import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import userService from '../services/user.service';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
  coins: number;
  setCoins: (coins: number) => void;
  refreshCoins: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [coins, setCoins] = useState<number>(0);
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

  const value: CurrencyContextType = { 
    coins, 
    setCoins, 
    refreshCoins: fetchCoins 
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
