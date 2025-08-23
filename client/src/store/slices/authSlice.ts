import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

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
  isLoading: true, // 🔥 ВАЖНО: Начинаем с загрузки!
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      console.log('🌐 Login API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Login API error:', errorData);
        return rejectWithValue(errorData.message || 'Ошибка входа');
      }
      
      const data = await response.json();
      console.log('✅ Login API response data:', data);
      console.log('🔑 Token from response:', data.token ? 'Есть' : 'НЕТ');
      console.log('👤 User from response:', data.user ? 'Есть' : 'НЕТ');
      
      // Возвращаем данные пользователя с токеном
      const result = {
        ...data.user,
        token: data.token
      };
      
      console.log('📤 Returning to Redux:', { 
        id: result.id, 
        email: result.email, 
        hasToken: !!result.token 
      });
      
      return result;
    } catch (error: any) {
      console.error('💥 Login fetch error:', error);
      return rejectWithValue(error.message || 'Ошибка входа');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Ошибка регистрации');
      }
      
      const data = await response.json();
      
      // Возвращаем данные пользователя с токеном
      return {
        ...data.user,
        token: data.token
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка регистрации');
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
      
      // Удаляем токен из localStorage
      localStorage.removeItem('authToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('🔄 Redux: loginUser.fulfilled action.payload:', action.payload);
        console.log('🔑 Redux: action.payload.token:', action.payload.token ? 'Есть' : 'НЕТ');
        
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        
        // Сохраняем токен в localStorage
        if (action.payload.token) {
          console.log('💾 Redux: Сохраняем токен в localStorage');
          localStorage.setItem('authToken', action.payload.token);
        } else {
          console.log('❌ Redux: Токен НЕ найден в action.payload!');
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
        
        // Сохраняем токен в localStorage
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
  logout 
} = authSlice.actions;

export default authSlice.reducer;
