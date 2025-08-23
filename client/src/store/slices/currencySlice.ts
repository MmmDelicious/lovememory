import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/user.service';

export interface CurrencySliceState {
  coins: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CurrencySliceState = {
  coins: 0,
  isLoading: false,
  error: null,
};

// Async thunk для получения монет пользователя
export const refreshCoins = createAsyncThunk(
  'currency/refreshCoins',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      return response.data.coins;
    } catch (error: any) {
      console.error("Failed to fetch user coins:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coins');
    }
  }
);

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCoins: (state, action: PayloadAction<number>) => {
      state.coins = action.payload;
      state.error = null;
    },
    addCoins: (state, action: PayloadAction<number>) => {
      state.coins += action.payload;
    },
    subtractCoins: (state, action: PayloadAction<number>) => {
      state.coins = Math.max(0, state.coins - action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetCurrency: (state) => {
      state.coins = 0;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshCoins.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshCoins.fulfilled, (state, action) => {
        state.isLoading = false;
        state.coins = action.payload;
        state.error = null;
      })
      .addCase(refreshCoins.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCoins, 
  addCoins, 
  subtractCoins, 
  setLoading, 
  setError, 
  resetCurrency 
} = currencySlice.actions;

export default currencySlice.reducer;
