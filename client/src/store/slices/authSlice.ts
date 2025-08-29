import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services';

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  name: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  coins?: number;
  avatarUrl?: string;
  partner?: any;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  first_name?: string;
  last_name?: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
}

export interface AuthSliceState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthSliceState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue, dispatch }) => {
    try {
      const data = await authService.login(credentials.email, credentials.password);
      
      const userData = {
        ...data.user,
        token: data.token
      };

      // Обновляем монеты в currencySlice
      if (userData.coins !== undefined) {
        const { setCoins } = await import('./currencySlice');
        dispatch(setCoins(userData.coins));
      }
      
      return userData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка входа');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue, dispatch }) => {
    try {
      const data = await authService.register(credentials);
      
      const userData = {
        ...data.user,
        token: data.token
      };

      // Обновляем монеты в currencySlice
      if (userData.coins !== undefined) {
        const { setCoins } = await import('./currencySlice');
        dispatch(setCoins(userData.coins));
      }
      
      return userData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Ошибка регистрации');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    // Новый редьюсер для синхронизации монет
    syncCoinsWithCurrency: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.coins = action.payload;
      }
    },
          logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      
      localStorage.removeItem('authToken');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        
        if (action.payload.token) {
          localStorage.setItem('authToken', action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        
        if (action.payload.token) {
          localStorage.setItem('authToken', action.payload.token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setUser, 
  clearUser, 
  setLoading, 
  setError, 
  updateUser, 
  logout,
  syncCoinsWithCurrency 
} = authSlice.actions;

export default authSlice.reducer;
