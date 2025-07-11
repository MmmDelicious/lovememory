import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import StaticMascot from '../../components/StaticMascot/StaticMascot';
import greetAnimation from '../../assets/greet.json' with { type: 'json' };
import styles from './LoginPage.module.css';

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

const getDayBasedPhrase = () => {
  const day = new Date().getDay();
  const dayPhrases = [
    'Воскресенье, а я уже мечтаю об отпуске.', // Воскресенье
    'Понедельник, а я уже на пределе. Давайте быстрее.', // Понедельник
    'Вторник. Ну, хоть не понедельник, правда?', // Вторник
    'Среда — половина недели позади, держимся!', // Среда
    'Четверг! Завтра пятница, почти спасены.', // Четверг
    'Пятница! Ура, выходные близко, давайте входите.', // Пятница
    'Суббота. Все отдыхают, а я тут с вами. Ну, проходите.', // Суббота
  ];
  return dayPhrases[day];
};

const loginPhrases = [
  'Добро пожаловать в MemoryLove, проходите.',
  'Рада вас видеть. Давайте проверим ваши данные.',
  'Сегодня оживлённо, но для вас место есть.',
  'У меня подруга на седьмом месяце, а вы тут у входа топчетесь — проходите уже!',
  'Ваши воспоминания ждут, давайте не задерживать их.',
];

const errorPhrases = [
  'Хм, что-то не так. Проверьте данные, пожалуйста.',
  'Кажется, в списках вас нет. Попробуем ещё раз?',
  'Ой, что-то пошло не так. Давайте внимательнее.',
  'Пароль не тот? Или пальцы устали? Проверьте ещё раз.',
];

const annoyedPhrases = [
  'Пожалуйста, не надо так настойчиво кликать.',
  'Я всё вижу, кликать не обязательно!',
  'Секундочку, я тут не просто так стою.',
];

const idlePhrases = [
  'Ну что, задумались? Давайте быстрее, у нас тут не только вы влюблённые.',
  'Ваши воспоминания ждут, а вы всё думаете.',
  'Эй, не спите у входа, очередь за вами!',
];

const storyPhrases = [
  'Тут одна пара вчера пароль забыла, представляете? Час у входа стояли.',
  'Знаете, вчера один парень пытался пароль "lovelove" ввести. Не сработало.',
  'У подруги тройня на подходе, а я тут с вашими паролями разбираюсь.',
  'Был тут один, три раза email перепутал. Вы-то, надеюсь, внимательнее?',
];

const easterEggPhrases = [
  'Кликать на меня — не пароль вспомнить, давайте уже входите!',
  'Пять кликов? Это что, проверка на терпение? Я сдала!',
  'Ого, вы настойчивый. Но пароль всё равно вводить надо.',
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [greeting] = useState(
    `${getTimeBasedGreeting()}, ${getDayBasedPhrase()} ${loginPhrases[Math.floor(Math.random() * loginPhrases.length)]}`
  );
  const [mascotMessage, setMascotMessage] = useState(greeting);
  const { login } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const storyTimerRef = useRef(null);

  useEffect(() => {
    // Таймер бездействия: 10 секунд — лёгкое напоминание, 20 секунд — история
    idleTimerRef.current = setTimeout(() => {
      handleSetTemporaryMessage(idlePhrases[Math.floor(Math.random() * idlePhrases.length)], 5000, greeting);
    }, 10000);
    storyTimerRef.current = setTimeout(() => {
      handleSetTemporaryMessage(storyPhrases[Math.floor(Math.random() * storyPhrases.length)], 7000, greeting);
    }, 20000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    };
  }, []);

  const handleSetTemporaryMessage = (message, duration, callbackMessage) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMascotMessage(message);
    timerRef.current = setTimeout(() => {
      setMascotMessage(callbackMessage);
    }, duration);
  };

  const handleAvatarClick = () => {
    setClickCount((prev) => prev + 1);
    if (clickCount + 1 >= 5) {
      setClickCount(0);
      handleSetTemporaryMessage(easterEggPhrases[Math.floor(Math.random() * easterEggPhrases.length)], 6000, greeting);
    } else {
      const annoyedMessage = annoyedPhrases[Math.floor(Math.random() * annoyedPhrases.length)];
      handleSetTemporaryMessage(annoyedMessage, 4000, greeting);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      handleSetTemporaryMessage('Без email и пароля я вас не пущу, сами понимаете.', 5000, greeting);
      return;
    }
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setLoginAttempts((prev) => prev + 1);
      const serverMessage = err.response?.data?.message || 'Проверьте данные, пожалуйста.';
      const errorPrefix = loginAttempts >= 2 
        ? 'Серьёзно, опять? ' 
        : errorPhrases[Math.floor(Math.random() * errorPhrases.length)];
      handleSetTemporaryMessage(`${errorPrefix} ${serverMessage}`, 7000, greeting);
      console.error(err);
    }
  };

  const handleInputChange = () => {
    // Сбрасываем таймеры бездействия и историй при вводе
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      handleSetTemporaryMessage(idlePhrases[Math.floor(Math.random() * idlePhrases.length)], 5000, greeting);
    }, 10000);
    storyTimerRef.current = setTimeout(() => {
      handleSetTemporaryMessage(storyPhrases[Math.floor(Math.random() * storyPhrases.length)], 7000, greeting);
    }, 20000);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.authContainer}>
        <StaticMascot
          bubbleKey={mascotMessage}
          message={mascotMessage}
          animationData={greetAnimation}
          onAvatarClick={handleAvatarClick}
        />
        <div className={styles.loginBox}>
          <h1 className={styles.title}>MemoryLove</h1>
          <p className={styles.subtitle}>Войдите, чтобы продолжить</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleInputChange();
              }}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              className={styles.input}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                handleInputChange();
              }}
              required
            />
            <Button type="primary" submit>Войти</Button>
          </form>
          <p className={styles.registerLink}>
            Нет аккаунта? <Link to="/register">Создать</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;