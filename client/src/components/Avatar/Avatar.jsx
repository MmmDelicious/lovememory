import React from 'react';
import PropTypes from 'prop-types';
import styles from './Avatar.module.css';
const Avatar = ({ src, alt = 'avatar', size = 'medium', variant = 'circle', className = '' }) => {
  const sizeClass = styles[size] || '';
  const variantClass = styles[variant] || '';
  const imageSrc = src || '';
  return (
    <div className={`${styles.avatarContainer} ${sizeClass} ${variantClass} ${className}`.trim()}>
        <img
            src={imageSrc}
            alt={alt}
            className={styles.avatarImage}
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${alt}&background=random&size=128`;
            }}
        />
    </div>
  );
};
Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['circle', 'rounded', 'square']),
  className: PropTypes.string,
};
export default Avatar;
