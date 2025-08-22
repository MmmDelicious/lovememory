import React from 'react';
import styles from './AuthLayout.module.css';
import { FaHeart } from 'react-icons/fa';
const AuthLayout = ({ children }) => {
  return (
    <div className={styles.page}>
      <div className={styles.brandingPanel}>
        <div className={styles.brandingContent}>
          <h1 className={styles.brandingTitle}>
            LoveMemory <FaHeart className={styles.heartIcon} />
          </h1>
          <p className={styles.brandingText}>
            Все самые важные моменты вашей истории в одном месте.
          </p>
        </div>
      </div>
      <div className={styles.formPanel}>
        {children}
      </div>
    </div>
  );
};
export default AuthLayout;
