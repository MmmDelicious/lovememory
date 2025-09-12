import React from 'react';
import AuthPage from '../modules/auth/pages/AuthPage/AuthPage';

/**
 * Простая страница-роут для авторизации
 * Только композиция, вся логика в модуле auth
 */
const AuthPageRoute: React.FC = () => {
  return <AuthPage />;
};

export default AuthPageRoute;

