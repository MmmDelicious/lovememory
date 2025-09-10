import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playHoverSound: () => void;
  playClickSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSounds = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSounds must be used within a SoundProvider');
  }
  return context;
};

interface SoundProviderProps {
  children: React.ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.05;
      audioRef.current.loop = true;
    }
  }, []);

  const toggleSound = () => {
    if (audioRef.current) {
      if (soundEnabled) {
        audioRef.current.pause();
      } else {
      }
      setSoundEnabled(!soundEnabled);
    }
  };

  const playHoverSound = () => {
    if (soundEnabled) {
    }
  };

  const playClickSound = () => {
    if (soundEnabled) {
    }
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playHoverSound, playClickSound }}>
      {children}
      <audio ref={audioRef} style={{ display: 'none' }}>
      </audio>
    </SoundContext.Provider>
  );
};

const SoundManager = SoundProvider;
export default SoundManager;
