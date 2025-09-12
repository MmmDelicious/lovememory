import React from 'react';
import DashboardPage from '../modules/dashboard/pages/DashboardPage/DashboardPage';

/**
 * Простая страница-роут для главной
 * Только композиция, вся логика в модуле dashboard
 */
const DashboardPageRoute: React.FC = () => {
  return <DashboardPage />;
};

export default DashboardPageRoute;

