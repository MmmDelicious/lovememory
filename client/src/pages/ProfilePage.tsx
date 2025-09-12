import React from 'react';
import ProfilePage from '../modules/users/pages/ProfilePage/ProfilePage';

/**
 * Простая страница-роут для профиля
 * Только композиция, вся логика в модуле users
 */
const ProfilePageRoute: React.FC = () => {
  return <ProfilePage />;
};

export default ProfilePageRoute;

