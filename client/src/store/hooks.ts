import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useMemo } from 'react';
import type { RootState, AppDispatch } from './index';
import { 
  fetchRooms, 
  createRoom, 
  connectToGameSocket,
  setGameState,
  setCurrentGame,
  setSelectedGameType,
  setSelectedTableType,
  clearError,
  resetGame
} from './slices/gameSlice';
import {
  toggleAIMascot,
  setMascotPosition,
  setMascotMessage,
  clearMascotMessage,
  toggleChat,
  setAIVisible,
  setMobile,
  closeDateGenerator,
  sendMessageToAI
} from './slices/mascotSlice';
import {
  showMascot,
  hideMascot,
  setMascotTargets,
  registerMascotTargets,
  startMascotLoop,
  stopMascotLoop,
  clearMascotTargets,
  setLoopActive,
  clearMascot
} from './slices/eventMascotSlice';
import {
  setUser,
  clearUser,
  setLoading,
  setError,
  updateUser,
  logout,
  loginUser,
  registerUser
} from './slices/authSlice';
import {
  setCoins,
  addCoins,
  subtractCoins,
  resetCurrency,
  refreshCoins
} from './slices/currencySlice';

// Типизированные хуки для использования в компонентах
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Специализированные хуки для игр
export const useGameState = () => useAppSelector((state) => state.game);
export const useGameRooms = () => useAppSelector((state) => state.game.rooms);
export const useCurrentGame = () => useAppSelector((state) => state.game.currentGame);
export const useGameStateData = () => useAppSelector((state) => state.game.gameState);
export const useGameLoading = () => useAppSelector((state) => state.game.loadingRooms);
export const useGameError = () => useAppSelector((state) => state.game.error);
export const useGameConnection = () => useAppSelector((state) => state.game.isConnected);
export const useSelectedGameType = () => useAppSelector((state) => state.game.selectedGameType);
export const useSelectedTableType = () => useAppSelector((state) => state.game.selectedTableType);

// Специализированные хуки для масотов
export const useMascotState = () => useAppSelector((state) => state.mascot);
export const useGlobalMascot = () => useAppSelector((state) => state.mascot.globalMascot);
export const useAIMascot = () => {
  const mascotState = useAppSelector((state) => state.mascot);
  
  return useMemo(() => ({
    isVisible: mascotState.isAIVisible,
    isChatOpen: mascotState.isChatOpen,
    isLoading: mascotState.isAILoading,
  }), [mascotState.isAIVisible, mascotState.isChatOpen, mascotState.isAILoading]);
};

export const useInterceptedMascot = () => useAppSelector((state) => state.mascot.interceptedMascot);
export const useDateGenerator = () => useAppSelector((state) => state.mascot.isDateGeneratorOpen);
export const useMascotMobile = () => useAppSelector((state) => state.mascot.isMobile);

// Специализированные хуки для EventMascot
export const useEventMascot = () => useAppSelector((state) => state.eventMascot);
export const useEventMascotData = () => useAppSelector((state) => state.eventMascot.mascot);
export const useEventMascotTargets = () => useAppSelector((state) => state.eventMascot.mascotTargets);
export const useEventMascotLoop = () => useAppSelector((state) => state.eventMascot.isLoopActive);

// Специализированные хуки для Auth
export const useAuth = () => useAppSelector((state) => state.auth);
export const useUser = () => useAppSelector((state) => state.auth.user);
export const useIsAuthenticated = () => useAppSelector((state) => state.auth.isAuthenticated);
export const useAuthLoading = () => useAppSelector((state) => state.auth.isLoading);
export const useAuthError = () => useAppSelector((state) => state.auth.error);

// Специализированные хуки для Currency
export const useCurrency = () => useAppSelector((state) => state.currency);
export const useCoins = () => useAppSelector((state) => state.currency.coins);
export const useCurrencyLoading = () => useAppSelector((state) => state.currency.isLoading);
export const useCurrencyError = () => useAppSelector((state) => state.currency.error);

// Селекторы для вычисляемых значений с memoization
export const useGameStats = () => {
  const gameState = useAppSelector((state) => state.game);
  
  return useMemo(() => {
    const { rooms, currentGame, gameState: gameStateData } = gameState;
    return {
      totalRooms: rooms.length,
      activeRooms: rooms.filter(room => room.status === 'waiting').length,
      currentGameType: currentGame?.gameType || 'none',
      isInGame: !!gameStateData,
      playerCount: gameStateData?.players?.length || 0
    };
  }, [gameState.rooms, gameState.currentGame, gameState.gameState]);
};

export const useMascotStats = () => {
  const mascotState = useAppSelector((state) => state.mascot);
  
  return useMemo(() => {
    const { globalMascot, isAIVisible, isChatOpen } = mascotState;
    return {
      mascotPosition: globalMascot.position,
      mascotDirection: globalMascot.direction,
      hasMessage: !!globalMascot.message,
      isActive: isAIVisible || isChatOpen,
      isMobile: mascotState.isMobile
    };
  }, [mascotState.globalMascot, mascotState.isAIVisible, mascotState.isChatOpen, mascotState.isMobile]);
};

// Хуки для действий (actions)
export const useGameActions = () => {
  const dispatch = useAppDispatch();
  
  return useMemo(() => ({
    fetchRooms: (gameType: string) => dispatch(fetchRooms(gameType)),
    createRoom: (roomData: any) => dispatch(createRoom(roomData)),
    connectToGame: (roomId: string) => dispatch(connectToGameSocket(roomId)),
    setGameState: (gameState: any) => dispatch(setGameState({ gameState })),
    setCurrentGame: (game: any) => dispatch(setCurrentGame(game)),
    setGameType: (type: string) => dispatch(setSelectedGameType(type)),
    setTableType: (type: 'standard' | 'premium' | 'elite') => dispatch(setSelectedTableType(type)),
    clearError: () => dispatch(clearError()),
    resetGame: () => dispatch(resetGame())
  }), [dispatch]);
};

export const useMascotActions = () => {
  const dispatch = useAppDispatch();
  
  return useMemo(() => ({
    toggleAI: () => dispatch(toggleAIMascot()),
    setPosition: (position: { x: number; y: number }) => dispatch(setMascotPosition({ position })),
    setMessage: (message: string) => dispatch(setMascotMessage({ message })),
    clearMessage: () => dispatch(clearMascotMessage()),
    toggleChat: () => dispatch(toggleChat()),
    setAIVisible: (visible: boolean) => dispatch(setAIVisible(visible)),
    setMobile: (isMobile: boolean) => dispatch(setMobile(isMobile)),
    closeDateGenerator: () => dispatch(closeDateGenerator()),
    sendMessageToAI: (message: string, context?: string) => dispatch(sendMessageToAI({ message, context }))
  }), [dispatch]);
};

export const useEventMascotActions = () => {
  const dispatch = useAppDispatch();
  
  return useMemo(() => ({
    showMascot: (config: any) => dispatch(showMascot(config)),
    hideMascot: () => dispatch(hideMascot()),
    setMascotTargets: (targets: any[]) => dispatch(setMascotTargets(targets)),
    registerMascotTargets: (targets: any[]) => dispatch(registerMascotTargets(targets)),
    startMascotLoop: () => dispatch(startMascotLoop()),
    stopMascotLoop: () => dispatch(stopMascotLoop()),
    clearMascotTargets: () => dispatch(clearMascotTargets()),
    setLoopActive: (active: boolean) => dispatch(setLoopActive(active)),
    clearMascot: () => dispatch(clearMascot())
  }), [dispatch]);
};

export const useAuthActions = () => {
  const dispatch = useAppDispatch();
  
  return useMemo(() => ({
    setUser: (user: any) => dispatch(setUser(user)),
    clearUser: () => dispatch(clearUser()),
    setLoading: (loading: boolean) => dispatch(setLoading(loading)),
    setError: (error: string) => dispatch(setError(error)),
    updateUser: (updates: any) => dispatch(updateUser(updates)),
    logout: () => dispatch(logout()),
    loginUser: (credentials: { email: string; password: string }) => dispatch(loginUser(credentials)),
    registerUser: (userData: { email: string; password: string; name: string; first_name?: string; last_name?: string; gender?: 'male' | 'female' | 'other'; city?: string }) => dispatch(registerUser(userData))
  }), [dispatch]);
};

export const useCurrencyActions = () => {
  const dispatch = useAppDispatch();
  
  return useMemo(() => ({
    setCoins: (coins: number) => dispatch(setCoins(coins)),
    addCoins: (amount: number) => dispatch(addCoins(amount)),
    subtractCoins: (amount: number) => dispatch(subtractCoins(amount)),
    resetCurrency: () => dispatch(resetCurrency()),
    refreshCoins: () => dispatch(refreshCoins())
  }), [dispatch]);
};

