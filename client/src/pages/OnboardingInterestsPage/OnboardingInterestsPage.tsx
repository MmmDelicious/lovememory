import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { RootState } from '../../store';
import InterestSelector, { Interest, UserInterest } from '../../components/InterestSelector/InterestSelector';
import Button from '../../components/Button/Button';
import StaticMascot from '../../components/StaticMascot/StaticMascot';
import { useInteractiveMascot } from '../../hooks/useInteractiveMascot';
import interestService from '../../services/interest.service';
import congratsAnimation from '../../assets/greet.json';
import styles from './OnboardingInterestsPage.module.css';

interface MascotConfig {
  initialMessage: string;
  phrases: {
    error: string[];
    idle: string[];
    success: string[];
  };
}

const mascotConfig: MascotConfig = {
  initialMessage: 'Расскажите о ваших интересах! Это поможет создать персональные рекомендации для ваших свиданий.',
  phrases: { 
    error: ['Что-то пошло не так. Попробуйте еще раз!'], 
    idle: [
      'Выбирайте честно — алгоритм учтет даже то, что вам не нравится.',
      'Используйте шкалу интенсивности для точной настройки предпочтений.',
      'Чем больше интересов выберете, тем точнее будут рекомендации.'
    ],
    success: ['Отлично! Теперь мы знаем ваши предпочтения и сможем предлагать идеальные места для свиданий.']
  }
};

const OnboardingInterestsPage: React.FC = () => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<UserInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await interestService.getAllInterests();
      setInterests(data);
    } catch (error) {
      console.error('Error loading interests:', error);
      
      let errorMessage = 'Не удалось загрузить интересы.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Необходимо войти в систему';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже.';
      } else if (!error.response) {
        errorMessage = 'Проблемы с подключением к серверу.';
      }
      
      setError(errorMessage + ' Попробуйте обновить страницу.');
      triggerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  const handleInterestToggle = (interestId: string, preference: 'love' | 'like' | 'neutral' | 'dislike') => {
    setSelectedInterests(prev => {
      const existing = prev.find(si => si.interest_id === interestId);
      
      if (preference === 'dislike') {
        // Удаляем интерес из списка
        return prev.filter(si => si.interest_id !== interestId);
      }
      
      if (existing) {
        // Обновляем существующий
        return prev.map(si => 
          si.interest_id === interestId 
            ? { ...si, preference }
            : si
        );
      } else {
        // Добавляем новый
        return [...prev, {
          interest_id: interestId,
          preference,
          intensity: 7 // По умолчанию "нравится"
        }];
      }
    });
    handleInteraction();
  };

  const handleIntensityChange = (interestId: string, intensity: number) => {
    setSelectedInterests(prev =>
      prev.map(si =>
        si.interest_id === interestId
          ? { ...si, intensity }
          : si
      )
    );
  };

  const handleContinue = async () => {
    if (selectedInterests.length < 5) {
      triggerError('Выберите минимум 5 интересов');
      return;
    }

    if (!user?.id) {
      triggerError('Пользователь не найден');
      navigate('/login');
      return;
    }

    try {
      setIsSaving(true);
      
      await interestService.setMultipleUserInterests(user.id, selectedInterests);
      
      // Показываем сообщение об успехе
      // Используем handleInteraction для показа успешного сообщения
      handleInteraction();
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving interests:', error);
      
      let errorMessage = 'Не удалось сохранить интересы.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Сессия истекла. Войдите снова.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 400) {
        errorMessage = 'Некорректные данные интересов.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже.';
      } else if (!error.response) {
        errorMessage = 'Проблемы с подключением к серверу.';
      }
      
      triggerError(errorMessage + ' Попробуйте еще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    // Пользователь может пропустить этот шаг
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Загружаем интересы...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h3>Произошла ошибка</h3>
          <p>{error}</p>
          <Button type="primary" onClick={loadInterests}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mascotSection}>
        <StaticMascot 
          bubbleKey={mascotMessage} 
          message={mascotMessage} 
          animationData={congratsAnimation} 
          onAvatarClick={handleAvatarClick} 
        />
      </div>

      <motion.div 
        className={styles.content}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '100%' }}></div>
          </div>
          <span className={styles.progressText}>Шаг 2 из 2</span>
        </div>

        <InterestSelector
          interests={interests}
          selectedInterests={selectedInterests}
          onInterestToggle={handleInterestToggle}
          onIntensityChange={handleIntensityChange}
          maxSelections={20}
          minSelections={5}
          groupByCategory={true}
        />

        <div className={styles.actions}>
          <Button 
            type="secondary" 
            onClick={handleSkip}
            disabled={isSaving}
          >
            Пропустить
          </Button>
          
          <Button 
            type="primary" 
            onClick={handleContinue}
            disabled={selectedInterests.length < 5 || isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Сохраняем...' : 'Завершить регистрацию'}
          </Button>
        </div>

        <motion.div 
          className={styles.helpText}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.helpIcon}>
            <Lightbulb size={20} />
          </div>
          <div className={styles.helpContent}>
            <h4 className={styles.helpTitle}>Персонализация рекомендаций</h4>
            <p className={styles.helpDescription}>
              Честный выбор интересов поможет нашему алгоритму подбирать места и активности, 
              которые действительно подойдут вам и вашему партнеру.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OnboardingInterestsPage;
