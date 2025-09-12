import React from 'react';
import { LessonsModule } from '../../modules';
import styles from './LessonsPage.module.css';

/**
 * Тонкая страница уроков
 * Содержит только минимальную логику, всю бизнес-логику делегирует модулю LessonsModule
 */
const LessonsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <LessonsModule />
    </div>
  );
};

export default LessonsPage;