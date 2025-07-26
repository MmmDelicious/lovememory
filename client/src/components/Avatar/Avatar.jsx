import React from 'react';
import PropTypes from 'prop-types';
import styles from './Avatar.module.css';

/**
 * Reusable avatar component.
 *
 * Props:
 * - src: image url (required)
 * - alt: alt text (optional)
 * - size: one of 'small' | 'medium' | 'large' (optional, default 'medium')
 * - variant: shape style – 'circle', 'rounded', or 'square' (optional, default 'circle')
 * - className: additional class names (optional)
 */
const Avatar = ({ src, alt = 'avatar', size = 'medium', variant = 'circle', className = '' }) => {
  const sizeClass = styles[size] || '';
  const variantClass = styles[variant] || '';

  return (
    <img
      src={src}
      alt={alt}
      className={`${styles.avatar} ${sizeClass} ${variantClass} ${className}`.trim()}
    />
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