import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  initialMessage: 'Расскажите нашему ИИ о ваших интересах! 🤖 Нажимайте на карточки для выбора, а ползунком указывайте степень отношения ✨',
  phrases: { 
    error: ['Ой, что-то пошло не так! Попробуйте снова 😅'], 
    idle: [
      'Выбирайте даже то, что не нравится - ИИ учтёт это при подборе мест! 👎→👍',
      'Ползунок показывает ваше отношение: ❤️ обожаю, 👍 нравится, 😐 нейтрально, 👎 не нравится',
      'Алгоритм создаёт ваш уникальный профиль на основе всех предпочтений! 🧠'
    ],
    success: ['Превосходно! ИИ теперь знает ваши вкусы и антипатии. Рекомендации будут точными! 🎯✨']
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

  const getCategoryTitle = (category: string): string => {
    const titles: Record<string, string> = {
      food: 'Кулинария и еда',
      cinema: 'Кино и сериалы',
      sport: 'Спорт и активность',
      music: 'Музыка',
      travel: 'Путешествия',
      art: 'Искусство и культура',
      hobby: 'Хобби и увлечения',
      nature: 'Природа и экология',
      books: 'Книги и чтение',
      games: 'Игры',
      technology: 'Технологии',
      fashion: 'Мода и стиль',
      cooking: 'Готовка',
      fitness: 'Фитнес',
      photography: 'Фотография',
      dancing: 'Танцы',
      shopping: 'Шоппинг',
      animals: 'Животные',
      cars: 'Автомобили',
      crafts: 'Рукоделие',
      education: 'Образование',
      volunteering: 'Волонтерство',
      other: 'Другое'
    };
    return titles[category] || category;
  };

  const getCategoryEmoji = (category: string): string => {
    const emojis: Record<string, string> = {
      food: '🍽️',
      cinema: '🎬',
      sport: '⚽',
      music: '🎵',
      travel: '✈️',
      art: '🎨',
      hobby: '🎯',
      nature: '🌿',
      books: '📚',
      games: '🎮',
      technology: '💻',
      fashion: '👗',
      cooking: '👨‍🍳',
      fitness: '💪',
      photography: '📸',
      dancing: '💃',
      shopping: '🛍️',
      animals: '🐕',
      cars: '🚗',
      crafts: '🧵',
      education: '🎓',
      volunteering: '🤝',
      other: '🔍'
    };
    return emojis[category] || '📝';
  };

  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      food: 'Ваши предпочтения в еде и ресторанах',
      cinema: 'Жанры кино и сериалов, которые вы любите',
      sport: 'Виды спорта и физической активности',
      music: 'Музыкальные жанры и исполнители',
      travel: 'Типы отдыха и путешествий',
      art: 'Искусство, музеи, выставки',
      hobby: 'Ваши увлечения и хобби',
      nature: 'Активности на природе',
      books: 'Литературные жанры и авторы',
      games: 'Видеоигры и настольные игры',
      technology: 'Технологии и гаджеты',
      fashion: 'Стиль и мода',
      cooking: 'Готовка и кулинария',
      fitness: 'Тренировки и фитнес',
      photography: 'Фотография и съемка',
      dancing: 'Танцы и хореография',
      shopping: 'Покупки и шоппинг',
      animals: 'Домашние и дикие животные',
      cars: 'Автомобили и техника',
      crafts: 'Рукоделие и творчество',
      education: 'Обучение и развитие',
      volunteering: 'Волонтерство и помощь',
      other: 'Другие интересы'
    };
    return descriptions[category] || 'Выберите интересы в этой категории';
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

      <div className={styles.content}>
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

        <div className={styles.helpText}>
          <p>
            💡 <strong>Совет:</strong> Выберите интересы честно — это поможет нам подбирать места, 
            которые вам действительно понравятся!
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingInterestsPage;
