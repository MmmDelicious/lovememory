import React, { useEffect } from 'react';
import styles from './AuthCallbackPage.module.css';
const AuthCallbackPage = () => {
  useEffect(() => {
    try {
      // Читаем параметры из query string вместо hash
      const urlParams = new URLSearchParams(window.location.search);
      const userString = urlParams.get('user');
      
      if (userString) {
        const user = JSON.parse(decodeURIComponent(userString));
        // Токен уже установлен в httpOnly cookie сервером
        // Просто сообщаем родительскому окну об успехе
        if (window.opener) {
          window.opener.postMessage({
            type: 'auth-success',
            payload: { user }
          }, import.meta.env.VITE_SERVER_URL);
        }
      } else {
        console.error('Auth callback failed: Missing user data in URL.');
        if (window.opener) {
          window.opener.postMessage({
            type: 'auth-error',
            payload: 'Google Sign-In failed.'
          }, import.meta.env.VITE_SERVER_URL);
        }
      }
    } catch (error) {
      console.error('Error processing auth callback:', error);
      if (window.opener) {
        window.opener.postMessage({
          type: 'auth-error',
          payload: 'An error occurred during Google Sign-In.'
        }, import.meta.env.VITE_SERVER_URL);
      }
    } finally {
      window.close();
    }
  }, []);
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p className={styles.text}>Завершение входа...</p>
    </div>
  );
};
export default AuthCallbackPage;
