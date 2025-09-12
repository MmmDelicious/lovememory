export interface MascotPosition {
  x: number;
  y: number;
}

export interface MascotConfig {
  element?: HTMLElement;
  page?: string;
  data?: any;
  message?: string;
  type?: 'runner' | 'flyer' | 'greeter';
  side?: 'left' | 'right' | 'top';
  duration?: number;
  onDismiss?: () => void;
  isTumbling?: boolean;
  animationData?: any;
  mascotType?: string;
}

export interface GlobalMascot {
  position: MascotPosition;
  direction: 'left' | 'right';
  message: string;
}

export interface InterceptedMascot {
  position: MascotPosition;
  animationData: any;
}

export interface MascotTarget {
  containerRef: React.RefObject<HTMLElement>;
  element: HTMLElement;
  data: any;
  page?: string;
}

export interface MascotContextType {
  mascot: MascotConfig | null;
  showMascot: (config: MascotConfig) => void;
  hideMascot: () => void;
  registerMascotTargets: (targets: MascotTarget[]) => void;
  clearMascotTargets: () => void;
  startMascotLoop: () => void;
  stopMascotLoop: () => void;
  interceptedMascot: InterceptedMascot | null;
  globalMascot: GlobalMascot;
  globalMascotAnimation: any;
  isAIVisible: boolean;
  toggleAIMascot: () => void;
  isChatOpen: boolean;
  toggleChat: () => void;
  sendMessageToAI: (prompt: string, context?: string) => Promise<void>;
  isAILoading: boolean;
}
