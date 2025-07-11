import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import Button from '../../components/Button/Button';
import StaticMascot from '../../components/StaticMascot/StaticMascot';
import greetAnimation from '../../assets/greet.json' with { type: 'json' };
import styles from './RegisterPage.module.css';

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
    'Понедельник, а я уже на пределе. Заполняйте быстрее.', // Понедельник
    'Вторник. Ну, хоть не понедельник, правда?', // Вторник
    'Среда — половина недели позади, держимся!', // Среда
    'Четверг! Завтра пятница, почти спасены.', // Четверг
    'Пятница! Ура, выходные близко, давайте регистрируйтесь.', // Пятница
    'Суббота. Все отдыхают, а я тут с вами. Ну, заполняйте.', // Суббота
  ];
  return dayPhrases[day];
};

const registerPhrases = [
  'Добро пожаловать в MemoryLove, давайте создадим ваш аккаунт.',
  'Новая пара? Отлично, заполните анкету, я всё запишу.',
  'Регистрация? Сейчас всё оформим, не задерживайтесь.',
  'У подруги тройня на подходе, а вы тут анкету заполняете — давайте быстрее!',
  'Ваши воспоминания начинаются здесь, заполните данные.',
];

const errorPhrasesGeneral = [
  'Хм, что-то не так. Проверьте данные, пожалуйста.',
  'Кажется, анкета неполная. Давайте ещё раз?',
  'Ой, что-то пошло не так. Проверьте всё внимательно.',
];

const errorPhrasesName = [
  'Имя не указали? Без имени я вас в книгу не запишу!',
  'Ну серьёзно, без имени? У подруги тройня, а я тут жду вашего имени.',
  'Имя пустое? Это что, инкогнито? Давайте заполним.',
  'Без имени не пускаем, даже в MemoryLove. Впишите, пожалуйста.',
  'Имя забыли? Я тут не экстрасенс, заполните анкету.',
];

const errorPhrasesEmail = [
  'Email не указан? Без него я вас не зарегистрирую.',
  'Это точно email? Проверьте, что-то не сходится.',
  'Email пустой? Ну, так не пойдёт, заполняйте.',
];

const errorPhrasesPassword = [
  'Пароль пустой? Без него воспоминания не сохранить.',
  'Пароль слишком короткий? Давайте посерьёзнее.',
  'Без пароля не пускаем, придумайте что-нибудь.',
];

const annoyedPhrases = [
  'Пожалуйста, не надо так настойчиво кликать.',
  'Я всё вижу, кликать не обязательно!',
  'Секундочку, я тут не просто так стою.',
];

const idlePhrases = [
  'Ну что, задумались? Анкету заполнять будем?',
  'Ваши воспоминания ждут, а вы всё думаете.',
  'Эй, не спите у входа, давайте регистрироваться!',
];

const storyPhrases = [
  'Тут одна пара вчера полчаса имя придумывала. Вы-то быстрее?',
  'Знаете, вчера один парень email с тремя опечатками ввёл. Смешно, но не повторяйте.',
  'У подруги уже тройня, а я тут с вашими анкетами. Давайте заполняйте.',
  'Был тут один, хотел пароль "123", серьёзно? Вы-то, надеюсь, креативнее.',
];

const easterEggPhrases = [
  'Кликать на меня — не анкету заполнить, давайте уже регистрируйтесь!',
  'Пять кликов? Это что, проверка на терпение? Я сдала!',
  'Ого, вы настойчивый. Но анкету всё равно надо заполнить.',
];

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [greeting] = useState(
    `${getTimeBasedGreeting()}, ${getDayBasedPhrase()} ${registerPhrases[Math.floor(Math.random() * registerPhrases.length)]}`
  );
  const [mascotMessage, setMascotMessage] = useState(greeting);
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
    if (!firstName) {
      handleSetTemporaryMessage(errorPhrasesName[Math.floor(Math.random() * errorPhrasesName.length)], 5000, greeting);
      return;
    }
    if (!email) {
      handleSetTemporaryMessage(errorPhrasesEmail[Math.floor(Math.random() * errorPhrasesEmail.length)], 5000, greeting);
      return;
    }
    if (!password) {
      handleSetTemporaryMessage(errorPhrasesPassword[Math.floor(Math.random() * errorPhrasesPassword.length)], 5000, greeting);
      return;
    }
    try {
      await authService.register(email, password, firstName);
      navigate('/login');
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Попробуйте, пожалуйста, снова.';
      const errorPrefix = errorPhrasesGeneral[Math.floor(Math.random() * errorPhrasesGeneral.length)];
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
        <div className={styles.registerBox}>
          <h1 className={styles.title}>MemoryLove</h1>
          <p className={styles.subtitle}>Присоединяйтесь к MemoryLove</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="text"
              placeholder="Ваше имя"
              className={styles.input}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                handleInputChange();
              }}
              required
            />
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
            <Button type="primary" submit>Зарегистрироваться</Button>
          </form>
          <p className={styles.loginLink}>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;