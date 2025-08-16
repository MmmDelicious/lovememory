import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

interface Gift {
  id: string;
  giftType: string;
  message: string;
  photoPath?: string;
  senderName: string;
  createdAt: string;
}

export const useGifts = () => {
  const [receivedGift, setReceivedGift] = useState<Gift | null>(null);
  const [isGiftVisible, setIsGiftVisible] = useState(false);
  const { user, token } = useAuth();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Listen for incoming gifts
    socket.on('gift_received', (gift: Gift) => {
      console.log('Gift received:', gift);
      setReceivedGift(gift);
      setIsGiftVisible(true);
    });

    socket.on('connect', () => {
      console.log('Connected to gift socket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from gift socket');
    });

    socket.on('connect_error', (error) => {
      console.error('Gift socket connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const closeGift = () => {
    setIsGiftVisible(false);
    setTimeout(() => {
      setReceivedGift(null);
    }, 300);
  };

  const checkForUnviewedGifts = async () => {
    try {
      const response = await fetch('/api/gifts/unviewed', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const gifts = await response.json();
        if (gifts.length > 0) {
          // Show the most recent unviewed gift
          const latestGift = gifts[0];
          setReceivedGift({
            id: latestGift.id,
            giftType: latestGift.giftType,
            message: latestGift.message,
            photoPath: latestGift.photoPath,
            senderName: latestGift.sender?.first_name || 'Ваш партнер',
            createdAt: latestGift.createdAt
          });
          setIsGiftVisible(true);
        }
      }
    } catch (error) {
      console.error('Error checking for unviewed gifts:', error);
    }
  };

  // Check for unviewed gifts on mount
  useEffect(() => {
    if (user) {
      checkForUnviewedGifts();
    }
  }, [user]);

  return {
    receivedGift,
    isGiftVisible,
    closeGift,
    checkForUnviewedGifts
  };
};
