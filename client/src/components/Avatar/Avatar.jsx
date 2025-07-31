import React from 'react';
import PropTypes from 'prop-types';
import styles from './Avatar.module.css';

const Avatar = ({ src, alt = 'avatar', size = 'medium', variant = 'circle', className = '' }) => {
  const sizeClass = styles[size] || '';
  const variantClass = styles[variant] || '';

  return (
    <div className={`${styles.avatarContainer} ${sizeClass} ${variantClass} ${className}`.trim()}>
        <img
            src={src}
            alt={alt}
            className={styles.avatarImage}
        />
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['circle', 'rounded', 'square']),
  className: PropTypes.string,
};

export default Avatar;