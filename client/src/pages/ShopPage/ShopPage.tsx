import React, { useState, useEffect } from 'react';
import { Gift, Heart, Star, Sparkles, Send, Camera, Type, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import LottiePlayer from 'react-lottie-player';
import styles from './ShopPage.module.css';

// Import animations
import guitarAnimation from '../../assets/guitar.json';
import runningCharacterAnimation from '../../assets/running-character.json';

interface GiftOption {
  id: string;
  name: string;
  description: string;
  animation: any;
  price: number;
  category: 'romantic' | 'fun' | 'seasonal';
}

interface VirtualGift {
  id: string;
  fromUserId: string;
  toUserId: string;
  giftType: string;
  message: string;
  photo?: string;
  createdAt: string;
  isDelivered: boolean;
}

const ShopPage: React.FC = () => {
  const { user, token } = useAuth();
  const { coins, setCoins, refreshCoins } = useCurrency();
  const [selectedGift, setSelectedGift] = useState<GiftOption | null>(null);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [giftPhoto, setGiftPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'romantic' | 'fun' | 'seasonal'>('all');

  // Available gift options
  const giftOptions: GiftOption[] = [
    {
      id: 'guitar',
      name: 'Музыкальный подарок',
      description: 'Романтическая мелодия для вашей любви',
      animation: guitarAnimation,
      price: 75,
      category: 'romantic'
    },
    {
      id: 'running-character',
      name: 'Энергичный сюрприз',
      description: 'Позитивный заряд энергии и веселья',
      animation: runningCharacterAnimation,
      price: 50,
      category: 'fun'
    }
  ];

  // Filter gifts by category
  const filteredGifts = activeCategory === 'all' 
    ? giftOptions 
    : giftOptions.filter(gift => gift.category === activeCategory);

  // Generate default message based on user gender and gift type
  const generateDefaultMessage = (giftType: string): string => {
    const userGender = user?.gender || 'male';
    const senderName = user?.first_name || 'Ваш любимый человек';
    
    const messages = {
      guitar: {
        male: `Дорогая! Эта мелодия напоминает мне о тебе... 🎸💕`,
        female: `Любимый! Пусть эта музыка расскажет о моих чувствах... 🎸💕`
      },
      'running-character': {
        male: `Солнышко! Заряжаю тебя позитивом на весь день! 🏃‍♂️⚡`,
        female: `Дорогой! Бегу к тебе со всей любовью! 🏃‍♀️💫`
      }
    };

    const defaultMsg = messages[giftType as keyof typeof messages]?.[userGender] || 
                     'Специально для тебя подготовил(а) этот подарок! 💝';
    
    return `${defaultMsg}\n\nДля тебя приготовил(а): ${senderName}`;
  };

  const handleSelectGift = (gift: GiftOption) => {
    if (coins < gift.price) {
      alert(`Недостаточно монеток! Нужно ${gift.price}, у вас ${coins}`);
      return;
    }
    
    setSelectedGift(gift);
    setGiftMessage(generateDefaultMessage(gift.id));
    setIsGiftModalOpen(true);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGiftPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift || !user) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('giftType', selectedGift.id);
      formData.append('message', giftMessage);
      formData.append('price', selectedGift.price.toString());
      
      if (giftPhoto) {
        formData.append('photo', giftPhoto);
      }

      const response = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update coins - use server response if available, otherwise refresh
        if (result.remainingCoins !== undefined) {
          setCoins(result.remainingCoins);
        } else {
          await refreshCoins();
        }
        
        // Close modal and reset
        setIsGiftModalOpen(false);
        setSelectedGift(null);
        setGiftMessage('');
        setGiftPhoto(null);
        setPhotoPreview(null);
        
        alert('Подарок успешно отправлен! 🎁');
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Произошла ошибка при отправке подарка');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsGiftModalOpen(false);
    setSelectedGift(null);
    setGiftMessage('');
    setGiftPhoto(null);
    setPhotoPreview(null);
  };

  return (
    <div className={styles.shopPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <Gift className={styles.titleIcon} size={32} />
              <div>
                <h1 className={styles.title}>Магазин подарков</h1>
                <p className={styles.subtitle}>Премиальные функции для укрепления отношений</p>
              </div>
            </div>
            
            <div className={styles.coinsDisplay}>
              <Sparkles className={styles.coinIcon} size={20} />
              <span className={styles.coinAmount}>{coins}</span>
              <span className={styles.coinLabel}>монеток</span>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className={styles.categoryFilter}>
          {[
            { id: 'all', label: 'Все', icon: Star },
            { id: 'romantic', label: 'Романтика', icon: Heart },
            { id: 'fun', label: 'Веселье', icon: Sparkles },
            { id: 'seasonal', label: 'Сезонные', icon: Gift }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.categoryButton} ${activeCategory === id ? styles.active : ''}`}
              onClick={() => setActiveCategory(id as any)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Gift Cards */}
        <div className={styles.giftGrid}>
          {filteredGifts.map((gift) => (
            <div key={gift.id} className={styles.giftCard}>
              <div className={styles.giftAnimation}>
                <LottiePlayer
                  animationData={gift.animation}
                  play
                  loop
                  style={{ width: '120px', height: '120px' }}
                />
              </div>
              
              <div className={styles.giftInfo}>
                <h3 className={styles.giftName}>{gift.name}</h3>
                <p className={styles.giftDescription}>{gift.description}</p>
                
                <div className={styles.giftFooter}>
                  <div className={styles.giftPrice}>
                    <Sparkles size={16} />
                    <span>{gift.price}</span>
                  </div>
                  
                  <button
                    className={`${styles.buyButton} ${coins < gift.price ? styles.disabled : ''}`}
                    onClick={() => handleSelectGift(gift)}
                    disabled={coins < gift.price}
                  >
                    {coins < gift.price ? 'Не хватает монет' : 'Отправить подарок'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGifts.length === 0 && (
          <div className={styles.emptyState}>
            <Gift size={64} className={styles.emptyIcon} />
            <h3>Подарки скоро появятся</h3>
            <p>В этой категории пока нет доступных подарков</p>
          </div>
        )}

        {/* Gift Modal */}
        {isGiftModalOpen && selectedGift && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Отправить подарок</h2>
                <button className={styles.closeButton} onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Gift Preview */}
                <div className={styles.giftPreview}>
                  <LottiePlayer
                    animationData={selectedGift.animation}
                    play
                    loop
                    style={{ width: '100px', height: '100px' }}
                  />
                  <h3>{selectedGift.name}</h3>
                </div>

                {/* Message Input */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <Type size={18} />
                    Сообщение
                  </label>
                  <textarea
                    className={styles.messageInput}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Ваше сообщение..."
                    rows={4}
                  />
                </div>

                {/* Photo Upload */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <Camera size={18} />
                    Фото (необязательно)
                  </label>
                  
                  <div className={styles.photoUpload}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className={styles.fileInput}
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className={styles.uploadButton}>
                      <Camera size={20} />
                      Выбрать фото
                    </label>
                    
                    {photoPreview && (
                      <div className={styles.photoPreview}>
                        <img src={photoPreview} alt="Preview" />
                        <button 
                          className={styles.removePhoto}
                          onClick={() => {
                            setGiftPhoto(null);
                            setPhotoPreview(null);
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Display */}
                <div className={styles.costInfo}>
                  <div className={styles.costRow}>
                    <span>Стоимость:</span>
                    <div className={styles.costAmount}>
                      <Sparkles size={16} />
                      <span>{selectedGift.price}</span>
                    </div>
                  </div>
                  <div className={styles.costRow}>
                    <span>Останется:</span>
                    <div className={styles.costAmount}>
                      <Sparkles size={16} />
                      <span>{coins - selectedGift.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelButton} 
                  onClick={closeModal}
                  disabled={isLoading}
                >
                  Отмена
                </button>
                <button 
                  className={styles.sendButton} 
                  onClick={handleSendGift}
                  disabled={isLoading || !giftMessage.trim()}
                >
                  {isLoading ? (
                    <>Отправка...</>
                  ) : (
                    <>
                      <Send size={18} />
                      Отправить подарок
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
