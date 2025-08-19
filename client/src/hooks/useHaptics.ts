import { useCallback } from 'react';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticOptions {
  intensity?: number;
  duration?: number;
}

/**
 * Hook for haptic feedback across platforms
 * Web: Uses vibration API (if available)
 * Mobile: Will integrate with expo-haptics when available
 */
export const useHaptics = () => {
  const isHapticSupported = useCallback(() => {
    return 'vibrate' in navigator || 
           'mozVibrate' in navigator || 
           'webkitVibrate' in navigator;
  }, []);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!isHapticSupported()) return;
    
    try {
      // Standard vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
      // Mozilla prefix
      else if ('mozVibrate' in navigator) {
        (navigator as any).mozVibrate(pattern);
      }
      // Webkit prefix
      else if ('webkitVibrate' in navigator) {
        (navigator as any).webkitVibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [isHapticSupported]);

  const triggerHaptic = useCallback((type: HapticType, options: HapticOptions = {}) => {
    // Haptic patterns for different types
    const patterns: Record<HapticType, number | number[]> = {
      light: 50,
      medium: 100,
      heavy: 200,
      success: [50, 50, 100],
      warning: [100, 50, 100],
      error: [200, 100, 200]
    };

    const pattern = patterns[type];
    
    // Apply intensity and duration modifiers if provided
    if (typeof pattern === 'number' && options.duration) {
      vibrate(options.duration);
    } else {
      vibrate(pattern);
    }
  }, [vibrate]);

  // Convenience methods for common actions
  const ctaHaptic = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const successHaptic = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const errorHaptic = useCallback(() => triggerHaptic('error'), [triggerHaptic]);
  const selectionHaptic = useCallback(() => triggerHaptic('light'), [triggerHaptic]);

  return {
    triggerHaptic,
    ctaHaptic,
    successHaptic,
    errorHaptic,
    selectionHaptic,
    isSupported: isHapticSupported(),
  };
};
