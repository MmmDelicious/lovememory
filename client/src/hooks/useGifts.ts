import { useUser } from '../store/hooks';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Gift {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  senderId: string;
  senderName: string;
  message?: string;
  createdAt: string;
  giftType: string; // Добавляем giftType для совместимости с GiftDisplay
}

export const useGifts = () => {
  const [receivedGift, setReceivedGift] = useState<Gift | null>(null);
  const [isGiftVisible, setIsGiftVisible] = useState(false);
  const user = useUser();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    
    // Временно используем пустой токен, так как в Redux User нет token
    const token = ''; // TODO: Добавить token в Redux User или использовать другой способ
    
    const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('gift_received', (gift: Gift) => {
      setReceivedGift(gift);
      setIsGiftVisible(true);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const closeGift = () => {
    setIsGiftVisible(false);
    setReceivedGift(null);
  };

  const fetchUnviewedGifts = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/gifts/unviewed', {
        headers: {
          'Authorization': `Bearer ${user.token || ''}`
        }
      });
      
      if (response.ok) {
        const gifts = await response.json();
        if (gifts.length > 0) {
          setReceivedGift(gifts[0]);
          setIsGiftVisible(true);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке подарков:', error);
    }
  };

  return {
    receivedGift,
    isGiftVisible,
    closeGift,
    fetchUnviewedGifts
  };
};

