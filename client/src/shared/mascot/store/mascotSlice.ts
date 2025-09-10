import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MascotSliceState, SetMascotPositionPayload, SetMascotMessagePayload } from '../types';

// Начальное состояние
const initialState: MascotSliceState = {
  globalMascot: {
    position: { x: 80, y: 70 },
    direction: 'left',
    message: '',
    animationData: null,
  },
  isAIVisible: false,
  isChatOpen: false,
  isAILoading: false,
  interceptedMascot: null,
  isDateGeneratorOpen: false,
  isMobile: false, // Будем устанавливать динамически
};

const mascotSlice = createSlice({
  name: 'mascot',
  initialState,
  reducers: {
    // Действия с глобальным масотом
    setMascotPosition: (state, action: PayloadAction<SetMascotPositionPayload>) => {
      const newPosition = action.payload.position;
      const newDirection = newPosition.x < state.globalMascot.position.x ? 'left' : 'right';
      
      state.globalMascot.position = newPosition;
      state.globalMascot.direction = newDirection;
              state.globalMascot.message = '';
    },
    
    setMascotMessage: (state, action: PayloadAction<SetMascotMessagePayload>) => {
      state.globalMascot.message = action.payload.message;
    },
    
    clearMascotMessage: (state) => {
      state.globalMascot.message = '';
    },
    
    setMascotAnimation: (state, action: PayloadAction<any>) => {
      state.globalMascot.animationData = action.payload;
    },
    
    // AI масот
    toggleAIMascot: (state) => {
      state.isAIVisible = !state.isAIVisible;
      if (!state.isAIVisible) {
        state.isChatOpen = false;
      }
    },
    
    setAIVisible: (state, action: PayloadAction<boolean>) => {
      state.isAIVisible = action.payload;
      if (!action.payload) {
        state.isChatOpen = false;
      }
    },
    
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
      if (state.isChatOpen) {
        // Перемещаем масота в позицию чата
        state.globalMascot.position = { x: 50, y: 50 };
        state.globalMascot.message = '';
      }
    },
    
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isChatOpen = action.payload;
    },
    
    setAILoading: (state, action: PayloadAction<boolean>) => {
      state.isAILoading = action.payload;
    },
    
    // Перехваченный масот
    setInterceptedMascot: (state, action: PayloadAction<any>) => {
      state.interceptedMascot = action.payload;
    },
    
    clearInterceptedMascot: (state) => {
      state.interceptedMascot = null;
    },
    
    // Генератор дат
    setDateGeneratorOpen: (state, action: PayloadAction<boolean>) => {
      state.isDateGeneratorOpen = action.payload;
    },
    
    closeDateGenerator: (state) => {
      state.isDateGeneratorOpen = false;
    },
    
    // Отправка сообщения AI - используется thunk в hooks
    setAIResponse: (state, action: PayloadAction<string>) => {
      state.globalMascot.message = action.payload;
    },
    
    // Мобильное состояние
    setMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
    },
    
    
    moveMascotToElement: (state, action: PayloadAction<{ element: HTMLElement; message?: string }>) => {
  
      if (typeof window !== 'undefined') {
        const rect = action.payload.element.getBoundingClientRect();
        const targetX = Math.min(95, Math.max(5, (rect.left + rect.width / 2) / window.innerWidth * 100));
        const targetY = Math.min(95, Math.max(5, (rect.top + rect.height / 2) / window.innerHeight * 100));
        
        state.globalMascot.position = { x: targetX, y: targetY };
        state.globalMascot.direction = targetX < state.globalMascot.position.x ? 'left' : 'right';
        
        if (action.payload.message) {
          state.globalMascot.message = action.payload.message;
        }
      }
    },
    
    // Сброс состояния
    resetMascot: (state) => {
      state.globalMascot = initialState.globalMascot;
      state.isAIVisible = false;
      state.isChatOpen = false;
      state.isAILoading = false;
      state.interceptedMascot = null;
      state.isDateGeneratorOpen = false;
    },
  },
});

// Экспортируем actions
export const {
  setMascotPosition,
  setMascotMessage,
  clearMascotMessage,
  setMascotAnimation,
  toggleAIMascot,
  setAIVisible,
  toggleChat,
  setChatOpen,
  setAILoading,
  setInterceptedMascot,
  clearInterceptedMascot,
  setDateGeneratorOpen,
  closeDateGenerator,
  setAIResponse,
  setMobile,
  moveMascotToElement,
  resetMascot,
} = mascotSlice.actions;

// Экспортируем reducer
export default mascotSlice.reducer;
