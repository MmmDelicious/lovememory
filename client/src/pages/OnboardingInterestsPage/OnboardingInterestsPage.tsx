import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

// Конфигурация маскота для разных режимов
const getMascotConfig = (isEditMode: boolean): MascotConfig => ({
  initialMessage: isEditMode 
    ? 'Редактируйте свои интересы! Вы можете добавить новые, убрать ненужные или изменить интенсивность.'
    : 'Расскажите о ваших интересах! Это поможет создать персональные рекомендации для совместного времяпрепровождения.',
  phrases: { 
    error: ['Что-то пошло не так. Попробуйте еще раз!'], 
    idle: isEditMode ? [
      'Можно убрать то, что уже не интересно, и добавить новые увлечения!',
      'Отмечайте то, что действительно вас волнует сейчас.',
      'Интенсивность можно изменить — вкусы меняются!'
    ] : [
      'Выбирайте честно — алгоритм учтет даже то, что вам не нравится.',
      'Используйте шкалу интенсивности для точной настройки предпочтений.',
      'Чем больше интересов выберете, тем точнее будут рекомендации.',
      'Интересы помогут подобрать активности для укрепления ваших отношений.'
    ],
    success: isEditMode 
      ? ['Прекрасно! Ваши интересы обновлены. Теперь рекомендации станут ещё точнее!']
      : ['Отлично! Теперь мы знаем ваши предпочтения и сможем предлагать идеальные активности для вас двоих.']
  }
});

const OnboardingInterestsPage: React.FC = () => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<UserInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams] = useSearchParams();
  
  // Определяем режим: редактирование или первоначальный выбор
  const isEditMode = searchParams.get('mode') === 'edit';
  const [originalInterests, setOriginalInterests] = useState<UserInterest[]>([]);
  
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(getMascotConfig(isEditMode));

  useEffect(() => {
    loadInterests();
  }, [isEditMode, user?.id]);

  const loadInterests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await interestService.getAllInterests();
      setInterests(data);
      
      // В режиме редактирования загружаем существующие интересы пользователя
      if (isEditMode && user?.id) {
        try {
          const userInterestsResponse = await interestService.getUserInterests(user.id);
          if (userInterestsResponse && userInterestsResponse.length > 0) {
            // Преобразуем в формат UserInterest для selectedInterests
            const formattedInterests: UserInterest[] = userInterestsResponse.map(ui => ({
              interest_id: ui.interest_id,
              preference: ui.preference,
              intensity: ui.intensity
            }));
            setSelectedInterests(formattedInterests);
            setOriginalInterests(formattedInterests);

          }
        } catch (userInterestsError) {
          console.error('Error loading user interests:', userInterestsError);
          // Не прерываем основную загрузку, только логируем
        }
      }
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
    // Проверяем минимальное количество интересов
    if (selectedInterests.length === 0) {
      triggerError('Пожалуйста, выберите хотя бы один интерес или нажмите "Пропустить".');
      return;
    }
    
    if (selectedInterests.length < 5) {
      triggerError('Рекомендуем выбрать минимум 5 интересов для лучших рекомендаций. Но вы можете продолжить с ' + selectedInterests.length + '.');
      // Не возвращаемся, позволяем продолжить
    }

    if (!user?.id) {
      triggerError('Пользователь не найден');
      navigate('/login');
      return;
    }

    try {
      setIsSaving(true);
      
      
      if (isEditMode) {
        // В режиме редактирования: умное обновление
        const originalIds = originalInterests.map(oi => oi.interest_id);
        const selectedIds = selectedInterests.map(si => si.interest_id);
        
        // Найдем интересы для удаления
        const toRemove = originalIds.filter(id => !selectedIds.includes(id));
        
        
        // Удаляем ненужные интересы
        for (const interestId of toRemove) {
          try {
            await interestService.removeUserInterest(user.id, interestId);
          } catch (removeError) {
            console.error(`Error removing interest ${interestId}:`, removeError);
          }
        }
        
        // Обновляем/добавляем выбранные интересы
        if (selectedInterests.length > 0) {

          await interestService.setMultipleUserInterests(user.id, selectedInterests);
        }
        

      } else {
        // Первоначальное сохранение интересов
        if (selectedInterests.length > 0) {

          await interestService.setMultipleUserInterests(user.id, selectedInterests);
        }
      }
      
      // Показываем сообщение об успехе
      handleInteraction();
      
      setTimeout(() => {
        navigate(isEditMode ? '/profile' : '/dashboard');
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
      
      triggerError(errorMessage + ' Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    // Пользователь может пропустить этот шаг даже с 0 интересами
    
    // Показываем сообщение о том, что интересы можно добавить потом
    if (selectedInterests.length === 0) {
      triggerError('Вы можете добавить интересы позже в настройках профиля.');
    }
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
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
      {/* Маскот только для первоначального онбординга */}
      {!isEditMode && (
        <div className={styles.mascotSection}>
          <StaticMascot 
            bubbleKey={mascotMessage} 
            message={mascotMessage} 
            animationData={congratsAnimation} 
            onAvatarClick={handleAvatarClick} 
          />
        </div>
      )}

      <motion.div 
        className={styles.content}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {!isEditMode && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '100%' }}></div>
            </div>
            <span className={styles.progressText}>Шаг 2 из 2</span>
          </div>
        )}
        
        {isEditMode && (
          <div className={styles.editHeader}>
            <h1 className={styles.editTitle}>Редактирование интересов</h1>
            <p className={styles.editSubtitle}>Обновите свои интересы чтобы получать более точные рекомендации</p>
          </div>
        )}

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
          {isEditMode ? (
            <>
              <Button 
                type="secondary" 
                onClick={() => navigate('/profile')}
                disabled={isSaving}
              >
                Отмена
              </Button>
              
              <Button 
                type="primary" 
                onClick={handleContinue}
                disabled={isSaving}
                loading={isSaving}
              >
                {isSaving ? 'Сохраняем...' : 'Сохранить изменения'}
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
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
