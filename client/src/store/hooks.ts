import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useMemo } from 'react';
import { createSelector } from '@reduxjs/toolkit';
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
  setAILoading,
  setAIResponse
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
  registerUser,
  logoutUser,
} from './slices/authSlice';

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

// Мемоизированный селектор для AuthPage - предотвращает ререндеры
const selectAuthPageData = createSelector(
  [(state: RootState) => state.auth.user, (state: RootState) => state.auth.isAuthenticated],
  (user, isAuthenticated) => ({ user, isAuthenticated })
);

export const useAuthPageData = () => useAppSelector(selectAuthPageData);

// Мемоизированный селектор для AppRoutes - добавляем isLoading для корректного роутинга
const selectAppRoutesData = createSelector(
  [(state: RootState) => state.auth.user, (state: RootState) => state.auth.isAuthenticated, (state: RootState) => state.auth.isLoading],
  (user, isAuthenticated, isLoading) => ({ user, isAuthenticated, isLoading })
);

export const useAppRoutesData = () => useAppSelector(selectAppRoutesData);


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
            sendMessageToAI: async (message: string, context?: any) => {
          dispatch(setAILoading(true));
          try {
            const { askAI } = await import('../services/ai.service');
            const response = await askAI(message, context);
            
        
            if (response.intent === 'GENERATE_DATE' && response.data?.options) {
              
              const { default: DateGenerationResult } = await import('../modules/events/components/DateGenerationResult/DateGenerationResult');
              
          
              const modalContainer = document.createElement('div');
              document.body.appendChild(modalContainer);
              
              const { createRoot } = await import('react-dom/client');
              const root = createRoot(modalContainer);
              
              const handleSelectDate = (option: any) => {
                root.unmount();
                document.body.removeChild(modalContainer);
                dispatch(setAIResponse(`Отличный выбор! Свидание "${option.title}" можно добавить в календарь 📅`));
              };
              
              const handleClose = () => {
                root.unmount();
                document.body.removeChild(modalContainer);
                dispatch(setAIResponse('Хотите создать новые варианты свиданий? 💕'));
              };
              
          
              const React = await import('react');
              root.render(React.createElement(DateGenerationResult, {
                options: response.data.options,
                reasoning: response.data.reasoning || ['Анализирую ваши предпочтения...'],
                onSelectDate: handleSelectDate,
                onClose: handleClose
              }));
              
              // Показываем краткий ответ в чате
              dispatch(setAIResponse(response.text || response.message || `Создал ${response.data.options.length} вариантов свиданий! 💕`));
              
            } else {
              // Обычный ответ
              dispatch(setAIResponse(response.text || response.message || 'Не удалось получить ответ'));
            }
            
          } catch (error) {
            console.error('Failed to get AI response:', error);
            dispatch(setAIResponse('Что-то пошло не так... Попробуйте еще раз.'));
          } finally {
            dispatch(setAILoading(false));
          }
        }
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
    logout: () => dispatch(logoutUser()),
    loginUser: (credentials: { email: string; password: string }) => dispatch(loginUser(credentials)),
    registerUser: (userData: { email: string; password: string; first_name: string; gender: 'male' | 'female' | 'other'; city: string; age: number }) => dispatch(registerUser(userData)),
  }), [dispatch]);
};


