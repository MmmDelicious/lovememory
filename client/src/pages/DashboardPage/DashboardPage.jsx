import React, { useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const { isLoading } = useAuth();

  useEffect(() => {
    const mainContent = document.querySelector('.mainContent');
    mainContent.classList.add('dashboard');
    return () => {
      mainContent.classList.remove('dashboard');
    };
  }, []);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <Calendar />
  );
};

export default DashboardPage;