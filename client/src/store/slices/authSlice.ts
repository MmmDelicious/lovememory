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
  // Состояние ошибок валидации формы
  fieldErrors: Record<string, boolean>;
  isFormError: boolean;
}

const initialState: AuthSliceState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  fieldErrors: {},
  isFormError: false,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue, dispatch }) => {
    try {
      // Сервер возвращает { user }, токен автоматически устанавливается в httpOnly cookie
      const { user } = await authService.login(credentials.email, credentials.password);
      
      return user; // Возвращаем только данные пользователя
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
      // ТЕСТ: Включаем настоящий API вызов
      const { user } = await authService.register(credentials);
      
      return user; // Возвращаем только данные пользователя
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

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return;
    } catch (error: any) {
      console.warn('Logout failed on server, clearing client session anyway:', error);
      // Продолжаем logout на клиенте даже если сервер недоступен
      return;
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
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.fieldErrors = {};
      state.isFormError = false;
    },
    // Actions для управления ошибками валидации формы
    setFieldErrors: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.fieldErrors = action.payload;
    },
    setFormError: (state, action: PayloadAction<boolean>) => {
      state.isFormError = action.payload;
    },
    clearFormErrors: (state) => {
      state.fieldErrors = {};
      state.isFormError = false;
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
        state.fieldErrors = {};
        state.isFormError = false;
        // Токен автоматически сохраняется в httpOnly cookie сервером
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
        state.fieldErrors = {};
        state.isFormError = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.fieldErrors = {};
        state.isFormError = false;
        state.isLoading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Даже если logout на сервере неуспешен, очищаем состояние клиента
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.fieldErrors = {};
        state.isFormError = false;
        state.isLoading = false;
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
  setFieldErrors,
  setFormError,
  clearFormErrors
} = authSlice.actions;

// Селекторы для ошибок валидации формы
export const selectFieldErrors = (state: { auth: AuthSliceState }) => state.auth.fieldErrors;
export const selectIsFormError = (state: { auth: AuthSliceState }) => state.auth.isFormError;

export default authSlice.reducer;
