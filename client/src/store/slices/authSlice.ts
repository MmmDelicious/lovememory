import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services';

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  age?: number;
  coins?: number;
  avatarUrl?: string;
  partner?: any;
  token?: string;
  role?: string;
  locale?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  first_name: string;
  gender: 'male' | 'female' | 'other';
  city: string;
  age: number;
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
      // Более детальная обработка ошибок
      let errorMessage = 'Ошибка входа';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Неверный email или пароль';
      } else if (error.response?.status === 429) {
        errorMessage = 'Слишком много попыток входа. Попробуйте позже';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже';
      } else if (!error.response) {
        errorMessage = 'Проблемы с подключением к серверу';
      }
      
      return rejectWithValue(errorMessage);
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
      // Более детальная обработка ошибок регистрации
      let errorMessage = 'Ошибка регистрации';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 409) {
        errorMessage = 'Пользователь с таким email уже существует';
      } else if (error.response?.status === 400) {
        errorMessage = 'Некорректные данные для регистрации';
      } else if (error.response?.status === 429) {
        errorMessage = 'Слишком много попыток регистрации. Попробуйте позже';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже';
      } else if (!error.response) {
        errorMessage = 'Проблемы с подключением к серверу';
      }
      
      return rejectWithValue(errorMessage);
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
      
      // Очищаем только localStorage (httpOnly cookie очищает сервер)
      try {
        localStorage.removeItem('authToken');
      } catch (error) {
        console.warn('Failed to clear token from localStorage during logout:', error);
      }
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
        
        // Токен теперь автоматически сохраняется в httpOnly cookie сервером
        // localStorage используется только для совместимости
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
        
        // Токен теперь автоматически сохраняется в httpOnly cookie сервером
        // localStorage используется только для совместимости
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
