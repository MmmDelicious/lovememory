import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '../Avatar/Avatar';
import maleAvatar from '../../assets/man.png';
import femaleAvatar from '../../assets/woman.png';
import styles from './UserAvatar.module.css';

const UserAvatar = ({ user, size, variant, className }) => {
    const isFemale = user && user.gender === 'female';

    const getAvatarSrc = () => {
        if (user && user.avatarUrl) {
            return user.avatarUrl;
        }
        return isFemale ? femaleAvatar : maleAvatar;
    };

    const avatarClassName = [
        className,
        !isFemale ? styles.maleAvatar : styles.femaleAvatar
    ].filter(Boolean).join(' ');

    return (
        <Avatar
            src={getAvatarSrc()}
            alt={user ? `${user.name}'s avatar` : 'avatar'}
            size={size}
            variant={variant}
            className={avatarClassName}
        />
    );
};

UserAvatar.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        avatarUrl: PropTypes.string,
        gender: PropTypes.oneOf(['male', 'female']),
    }),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['circle', 'rounded', 'square']),
    className: PropTypes.string,
};

export default UserAvatar;