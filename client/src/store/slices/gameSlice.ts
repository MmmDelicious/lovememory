import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GameSliceState, SetGameStatePayload, SetRoomsPayload, SetSocketPayload } from '../types';
import { GameState, GameRoom } from '../../../types/game.types';

// Начальное состояние
const initialState: GameSliceState = {
  currentGame: null,
  gameState: null,
  rooms: [],
  loadingRooms: false,
  socket: null,
  isConnected: false,
  selectedGameType: 'poker',
  selectedTableType: 'standard',
  isLoading: false,
  error: null,
};

// Async thunk для загрузки комнат
export const fetchRooms = createAsyncThunk(
  'game/fetchRooms',
  async (gameType: string) => {
    // Здесь будет вызов API
    const response = await fetch(`/api/games/rooms?type=${gameType}`);
    const data = await response.json();
    return data.rooms;
  }
);

// Async thunk для создания комнаты
export const createRoom = createAsyncThunk(
  'game/createRoom',
  async (roomData: any) => {
    // Здесь будет вызов API
    const response = await fetch('/api/games/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
    const data = await response.json();
    return data.room;
  }
);

// Async thunk для подключения к WebSocket
export const connectToGameSocket = createAsyncThunk(
  'game/connectToGameSocket',
  async (roomId: string) => {
    // Здесь будет логика подключения к WebSocket
    // Пока возвращаем заглушку
    return { socket: null, roomId };
  }
);

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Синхронные actions
    setGameState: (state, action: PayloadAction<SetGameStatePayload>) => {
      state.gameState = action.payload.gameState;
    },
    
    setCurrentGame: (state, action: PayloadAction<GameRoom>) => {
      state.currentGame = action.payload;
    },
    
    setRooms: (state, action: PayloadAction<SetRoomsPayload>) => {
      state.rooms = action.payload.rooms;
    },
    
    setSocket: (state, action: PayloadAction<SetSocketPayload>) => {
      state.socket = action.payload.socket;
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    setSelectedGameType: (state, action: PayloadAction<string>) => {
      state.selectedGameType = action.payload;
    },
    
    setSelectedTableType: (state, action: PayloadAction<'standard' | 'premium' | 'elite'>) => {
      state.selectedTableType = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetGame: (state) => {
      state.currentGame = null;
      state.gameState = null;
      state.socket = null;
      state.isConnected = false;
    },
    
    // Игровые actions
    updatePlayerAction: (state, action: PayloadAction<{ playerId: string; action: string; data?: any }>) => {
      if (state.gameState && state.gameState.players) {
        const player = state.gameState.players.find(p => p.id === action.payload.playerId);
        if (player) {
  
          Object.assign(player, action.payload.data);
        }
      }
    },
    
    updateGameStage: (state, action: PayloadAction<string>) => {
      if (state.gameState) {
        (state.gameState as any).stage = action.payload;
      }
    },
    
    updatePot: (state, action: PayloadAction<number>) => {
      if (state.gameState) {
        (state.gameState as any).pot = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Обработка fetchRooms
      .addCase(fetchRooms.pending, (state) => {
        state.loadingRooms = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loadingRooms = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loadingRooms = false;
        state.error = action.error.message || 'Ошибка загрузки комнат';
      })
      
      // Обработка createRoom
      .addCase(createRoom.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGame = action.payload;
        state.rooms.push(action.payload);
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Ошибка создания комнаты';
      })
      
      // Обработка connectToGameSocket
      .addCase(connectToGameSocket.fulfilled, (state, action) => {
        // Здесь можно добавить логику для WebSocket
        state.isConnected = true;
      });
  },
});

// Экспортируем actions
export const {
  setGameState,
  setCurrentGame,
  setRooms,
  setSocket,
  setConnectionStatus,
  setSelectedGameType,
  setSelectedTableType,
  clearError,
  resetGame,
  updatePlayerAction,
  updateGameStage,
  updatePot,
} = gameSlice.actions;

// Экспортируем reducer
export default gameSlice.reducer;

