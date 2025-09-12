import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingModule } from '../../modules';
import { useAuth } from '../../../../modules/auth/hooks/useAuth';
import styles from './OnboardingInterestsPage.module.css';

/**
 * Тонкая страница онбординга интересов
 * Содержит только навигационную логику, всю бизнес-логику делегирует модулю OnboardingModule
 */
const OnboardingInterestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    // Перенаправляем на профиль после завершения
    navigate('/profile');
  };

  const handleSkip = () => {
    // Пропускаем онбординг и переходим к профилю
    navigate('/profile');
  };

  return (
    <div className={styles.container}>
      <OnboardingModule
        userId={user?.id}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </div>
  );
};

export default OnboardingInterestsPage;