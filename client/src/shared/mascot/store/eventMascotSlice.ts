import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EventMascot {
  message?: string;
  animationData?: any;
  mascotType?: 'runner' | 'flyer' | 'greeter';
  isTumbling?: boolean;
  side?: 'left' | 'right';
  page?: string;
  data?: any;
  onActionClick?: () => void;
  onDismiss?: () => void;
  duration?: number;
  type?: string;
}

export interface MascotTarget {
  page: string;
  data?: any;
  elementId?: string; // Вместо DOM элемента - ID или селектор
  containerRef?: any;
  onActionClick?: () => void;
}

export interface EventMascotSliceState {
  mascot: EventMascot | null;
  mascotTargets: MascotTarget[];
  isLoopActive: boolean;
}

const initialState: EventMascotSliceState = {
  mascot: null,
  mascotTargets: [],
  isLoopActive: false,
};

const eventMascotSlice = createSlice({
  name: 'eventMascot',
  initialState,
  reducers: {
    showMascot: (state, action: PayloadAction<EventMascot>) => {
      state.mascot = action.payload;
    },
    hideMascot: (state) => {
      state.mascot = null;
    },
    setMascotTargets: (state, action: PayloadAction<MascotTarget[]>) => {
      state.mascotTargets = action.payload;
    },
    registerMascotTargets: (state, action: PayloadAction<MascotTarget[]>) => {
      state.mascotTargets = action.payload;
    },
    startMascotLoop: (state) => {
      state.isLoopActive = true;
    },
    stopMascotLoop: (state) => {
      state.isLoopActive = false;
    },
    clearMascotTargets: (state) => {
      state.mascotTargets = [];
    },
    setLoopActive: (state, action: PayloadAction<boolean>) => {
      state.isLoopActive = action.payload;
    },
    clearMascot: (state) => {
      state.mascot = null;
      state.mascotTargets = [];
      state.isLoopActive = false;
    },
  },
});

export const { 
  showMascot, 
  hideMascot, 
  setMascotTargets, 
  registerMascotTargets,
  startMascotLoop,
  stopMascotLoop,
  clearMascotTargets,
  setLoopActive, 
  clearMascot 
} = eventMascotSlice.actions;

export default eventMascotSlice.reducer;
