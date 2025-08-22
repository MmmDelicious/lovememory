import React, { useEffect } from 'react';
import styles from './AuthCallbackPage.module.css';
const AuthCallbackPage = () => {
  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('token');
      const userString = params.get('user');
      if (token && userString) {
        const user = JSON.parse(decodeURIComponent(userString));
        const authData = { token, user };
        localStorage.setItem('auth', JSON.stringify(authData));
        if (window.opener) {
          window.opener.postMessage({
            type: 'auth-success',
            payload: authData
          }, import.meta.env.VITE_SERVER_URL);
        }
      } else {
        console.error('Auth callback failed: Missing token or user data in URL hash.');
        localStorage.setItem('auth_error', 'Google Sign-In failed.');
        if (window.opener) {
          window.opener.postMessage({
            type: 'auth-error',
            payload: 'Google Sign-In failed.'
          }, import.meta.env.VITE_SERVER_URL);
        }
      }
    } catch (error) {
      console.error('Error processing auth callback:', error);
      localStorage.setItem('auth_error', 'An error occurred during Google Sign-In.');
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
