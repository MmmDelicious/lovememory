import React from 'react';
import styles from './Avatar.module.css';

const Avatar = ({ src, alt = 'avatar', size = 'medium', variant = 'circle', className = '' }) => {
  const sizeClass = styles[size] || '';
  const variantClass = styles[variant] || '';

  return (
    <div className={`${styles.avatarContainer} ${sizeClass} ${variantClass} ${className}`.trim()}>
      <img
        src={src || ''}
        alt={alt}
        className={styles.avatarImage}
        onError={(e) => {
          e.target.src = `https://ui-avatars.com/api/?name=${alt}&background=random&size=128`;
        }}
      />
    </div>
  );
};

export default Avatar;
