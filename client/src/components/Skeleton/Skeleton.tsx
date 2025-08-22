import React from 'react';
import styles from './Skeleton.module.css';
interface SkeletonProps {
  variant?: 'text' | 'avatar' | 'card' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  rounded?: boolean;
}
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  rounded = false
}) => {
  const getSkeletonStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };
  const getSkeletonClass = () => {
    let classes = styles.skeleton;
    switch (variant) {
      case 'avatar':
        classes += ` ${styles.avatar}`;
        break;
      case 'card':
        classes += ` ${styles.card}`;
        break;
      case 'rectangular':
        classes += ` ${styles.rectangular}`;
        break;
      default:
        classes += ` ${styles.text}`;
    }
    if (rounded) classes += ` ${styles.rounded}`;
    if (className) classes += ` ${className}`;
    return classes;
  };
  if (count === 1) {
    return (
      <div 
        className={getSkeletonClass()}
        style={getSkeletonStyle()}
      />
    );
  }
  return (
    <div className={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <div 
          key={index}
          className={getSkeletonClass()}
          style={getSkeletonStyle()}
        />
      ))}
    </div>
  );
};
export const SkeletonText: React.FC<{ lines?: number; width?: string }> = ({ 
  lines = 3, 
  width 
}) => (
  <Skeleton variant="text" count={lines} width={width} />
);
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Skeleton variant="avatar" width={size} height={size} />
);
export const SkeletonCard: React.FC<{ height?: number }> = ({ height = 200 }) => (
  <Skeleton variant="card" height={height} />
);
export const SkeletonButton: React.FC<{ width?: number }> = ({ width = 120 }) => (
  <Skeleton variant="rectangular" width={width} height={40} rounded />
);
export const SkeletonUserCard: React.FC = () => (
  <div className={styles.userCard}>
    <SkeletonAvatar size={48} />
    <div className={styles.userInfo}>
      <Skeleton variant="text" width="60%" height={16} />
      <Skeleton variant="text" width="40%" height={14} />
    </div>
  </div>
);
export const SkeletonEventCard: React.FC = () => (
  <div className={styles.eventCard}>
    <Skeleton variant="card" height={120} />
    <div className={styles.eventContent}>
      <Skeleton variant="text" width="80%" height={18} />
      <Skeleton variant="text" width="60%" height={14} />
      <Skeleton variant="text" width="40%" height={14} />
    </div>
  </div>
);
export const SkeletonGameCard: React.FC = () => (
  <div className={styles.gameCard}>
    <Skeleton variant="rectangular" height={100} />
    <div className={styles.gameInfo}>
      <Skeleton variant="text" width="70%" height={16} />
      <Skeleton variant="text" width="50%" height={14} />
      <div className={styles.gameActions}>
        <SkeletonButton width={80} />
        <SkeletonButton width={100} />
      </div>
    </div>
  </div>
);
export default Skeleton;

