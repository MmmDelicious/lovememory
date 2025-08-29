import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { login as loginApi, register as registerApi, logout as logoutApi, getToken } from '../services/auth.service';
import { getSocket } from '../services/socket';
import { getItem, setItem, removeItem } from '../utils/storage';

type User = {
  id: number;
  email: string;
  first_name?: string;
  gender?: string;
  avatarUrl?: string | null;
  coins?: number;
};

type AuthData = { token: string; user: User };

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, first_name?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await getItem('auth');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AuthData;
          setAuth(parsed);
        } catch {}
      }
      setIsLoading(false);
    })();
  }, []);

  // Reconnect socket when token changes and subscribe for coin updates with cleanup
  const socketRef = useRef<any>(null);
  const coinsHandlerRef = useRef<((coins: number) => void) | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!auth?.token) return;
      try {
        const socket = await getSocket();
        if (!isMounted) return;
        socketRef.current = socket;
        const onCoins = (newCoins: number) => {
          if (!auth) return;
          const nextUser = { ...(auth.user || {}), coins: newCoins } as User;
          const next = { ...auth, user: nextUser } as AuthData;
          setAuth(next);
          setItem('auth', JSON.stringify(next));
        };
        coinsHandlerRef.current = onCoins;
        socket.on('update_coins', onCoins);
      } catch {}
    })();
    return () => {
      isMounted = false;
      const socket = socketRef.current;
      const handler = coinsHandlerRef.current;
      if (socket && handler) {
        try { socket.off('update_coins', handler); } catch {}
      }
      coinsHandlerRef.current = null;
    };
  }, [auth?.token]);

  const login = async (email: string, password: string) => {
    const res = await loginApi({ email, password });
    setAuth(res);
    await setItem('auth', JSON.stringify(res));
  };

  const register = async (email: string, password: string, first_name?: string) => {
    const res = await registerApi({ email, password, first_name });
    setAuth(res);
    await setItem('auth', JSON.stringify(res));
  };

  const logout = async () => {
    await logoutApi();
    try {
      const socket = socketRef.current;
      const handler = coinsHandlerRef.current;
      if (socket && handler) {
        try { socket.off('update_coins', handler); } catch {}
      }
      if (socket) {
        try { socket.disconnect(); } catch {}
      }
    } catch {}
    setAuth(null);
    await removeItem('auth');
  };

  const setUser = (u: User) => {
    if (!auth) return;
    const next = { ...auth, user: u };
    setAuth(next);
    setItem('auth', JSON.stringify(next));
  };

  const value = useMemo<AuthContextType>(() => ({
    user: auth?.user ?? null,
    token: auth?.token ?? null,
    isAuthenticated: !!auth?.token,
    isLoading,
    login,
    register,
    logout,
    setUser,
  }), [auth, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

