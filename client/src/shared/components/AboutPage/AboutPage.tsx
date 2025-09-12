import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import { Volume2, VolumeX, Star, User, Apple, Smartphone, Heart } from 'lucide-react';
import NatureElements from '../../effects/NatureElements/NatureElements';
import ScrollElements from '../../effects/NatureElements/ScrollElements';
import styles from './AboutPage.module.css';


import loveAnimation from '../../../modules/education/assets/lessons/Love.json';
import relationshipAnimation from '../../../modules/education/assets/lessons/Relationship.json';
import coupleAnimation from '../../../modules/education/assets/lessons/Couple sharing and caring love.json';


const AboutPage: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const initializeSounds = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.1;
      audioRef.current.loop = true;
    }
  };

  const toggleSounds = () => {
    if (audioRef.current) {
      if (soundEnabled) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.log);
      }
      setSoundEnabled(!soundEnabled);
    }
  };

  useEffect(() => {
    initializeSounds();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const animatedElements = document.querySelectorAll(
      '.animate-on-scroll, .animate-slide-left, .animate-slide-right, .reveal-up, .reveal-scale'
    );
    animatedElements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className={`${styles.aboutPage} sound-enabled`}>
      <audio ref={audioRef} className="birds-audio">
        Your browser does not support the audio element.
      </audio>
      
      <button 
        onClick={toggleSounds}
        className="btn-prototype btn-prototype--outline"
        style={{
          position: 'fixed',
          top: '100px',
          right: '24px',
          zIndex: 1000,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          padding: '0',
          minHeight: 'auto'
        }}
        title={soundEnabled ? 'Отключить звуки' : 'Включить звуки птиц'}
      >
        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
      
      <ScrollElements />
      <section className={`${styles.heroSection} full-width-section`}>
        <div className="section-container">
          <div className={`${styles.heroContent} grid-modern grid-modern--60-40`}>
            <NatureElements />
            
            <div className={`${styles.heroText} animate-slide-left`}>
              <h1 style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                fontWeight: 'bold',
                color: 'var(--color-text-primary)',
                margin: '0 0 24px 0',
                lineHeight: 1.1
              }}>
                Ваша история любви с LoveMemory
                <img 
                  src="/src/shared/assets/pictures/single-3d-heart--glossy--pastel-pink--soft-shadows.png"
                  alt="💖"
                  style={{width: '48px', height: '48px', marginLeft: '16px', verticalAlign: 'middle'}}
                />
              </h1>
              <p style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 32px 0',
                lineHeight: 1.6
              }}>
                Добро пожаловать в LoveMemory — ваш идеальный спутник в отношениях. Откройте мир, где любовь процветает через совместные переживания, понимание и игривые моменты.
              </p>
              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                <Link to="/register" className="btn-prototype sound-trigger">
                  <Star size={20} />
                  Присоединиться
                </Link>
                <Link to="/login" className="btn-prototype btn-prototype--outline sound-trigger">
                  <User size={20} />
                  Войти
                </Link>
              </div>
            </div>
            <div className={`${styles.heroAnimation} animate-slide-right floating-element--delayed`}>
              <Lottie 
                animationData={loveAnimation} 
                loop={true}
                className={styles.lottieAnimation}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} full-width-section`}>
        <div className="section-container">
          <div className={`${styles.sectionContent} grid-modern grid-modern--40-60`}>
            <div className={`${styles.animationContainer} animate-slide-left floating-element--slow`}>
              <Lottie 
                animationData={JSON.parse(JSON.stringify(relationshipAnimation))} 
                loop={true}
                className={styles.lottieAnimation}
              />
            </div>
            <div className={`${styles.textContent} animate-slide-right`}>
              <h2 className={`${styles.sectionTitle} elegant-title`}>
                Что такое <span className="soft-glow">LoveMemory</span>?
              </h2>
              <p className={`${styles.sectionText} reveal-up`}>
                Это персональное пространство для вашей пары, где каждый момент становится частью большой истории. 
                Создавайте события, делитесь воспоминаниями, играйте вместе и укрепляйте связь.
              </p>
              <div className={styles.aiCardsContainer}>
                <div className={`${styles.aiCard} reveal-up`} style={{'--delay': '0.1s'} as React.CSSProperties}>
                  <div className={styles.aiCardIcon}>
                    <img 
                      src="/src/shared/assets/pictures/single-3d-heart--glossy--pastel-pink--soft-shadows.png"
                      alt="AI Gift"
                      style={{width: '30px', height: '30px', objectFit: 'contain'}}
                    />
                  </div>
                  <h3 className={styles.aiCardTitle}>AI подарки</h3>
                  <p className={styles.aiCardText}>
                    Искусственный интеллект подберет идеальный подарок для вашей второй половинки на основе ваших интересов и предпочтений
                  </p>
                </div>

                <div className={`${styles.aiCard} reveal-up`} style={{'--delay': '0.2s'} as React.CSSProperties}>
                  <div className={styles.aiCardIcon}>
                    <img 
                      src="/src/shared/assets/pictures/tiny-envelope-with-heart-seal--minimal-flat-vector.png"
                      alt="AI Date"
                      style={{width: '30px', height: '30px', objectFit: 'contain'}}
                    />
                  </div>
                  <h3 className={styles.aiCardTitle}>AI свидания</h3>
                  <p className={styles.aiCardText}>
                    Умный помощник составит романтическое свидание, учитывая ваши общие интересы, бюджет и свободное время
                  </p>
                </div>

                <div className={`${styles.aiCard} reveal-up`} style={{'--delay': '0.3s'} as React.CSSProperties}>
                  <div className={styles.aiCardIcon}>
                    <img 
                      src="/src/shared/assets/pictures/small-5-petal-flower--vector-style--pastel-pink--i.png"
                      alt="AI Interests"
                      style={{width: '30px', height: '30px', objectFit: 'contain'}}
                    />
                  </div>
                  <h3 className={styles.aiCardTitle}>AI совместимость</h3>
                  <p className={styles.aiCardText}>
                    Алгоритмы найдут ваши скрытые общие интересы и предложат новые активности для укрепления отношений
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt} full-width-section`}>
        <div className="section-container">
          <div className={`${styles.sectionContent} grid-modern grid-modern--60-40`}>
            <div className={`${styles.textContent} animate-slide-left`}>
              <h2 className={`${styles.sectionTitle} elegant-title`}>
                Как это работает?
              </h2>
              <div className={styles.stepsList}>
                <div className={`${styles.step} reveal-up`}>
                  <span className={styles.stepNumber}>01</span>
                  <div>
                    <h3 className={styles.stepTitle}>Регистрируйтесь вместе</h3>
                    <p className={styles.stepText}>Создайте аккаунты и найдите друг друга в приложении</p>
                  </div>
                </div>
                <div className={`${styles.step} reveal-up`}>
                  <span className={styles.stepNumber}>02</span>
                  <div>
                    <h3 className={styles.stepTitle}>Планируйте события</h3>
                    <p className={styles.stepText}>Добавляйте планы, свидания и важные моменты в календарь</p>
                  </div>
                </div>
                <div className={`${styles.step} reveal-up`}>
                  <span className={styles.stepNumber}>03</span>
                  <div>
                    <h3 className={styles.stepTitle}>Играйте и развивайтесь</h3>
                    <p className={styles.stepText}>Участвуйте в играх и получайте инсайты о ваших отношениях</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${styles.animationContainer} animate-slide-right floating-element`}>
              <Lottie 
                animationData={coupleAnimation} 
                loop={true}
                className={styles.lottieAnimation}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} full-width-section`}>
        <div className="section-container">
          <div className={`${styles.centeredContent} reveal-scale`}>
            <h2 className={`${styles.sectionTitle} elegant-title`}>
              Скоро в мобильных приложениях
            </h2>
            <p className={`${styles.sectionText} reveal-up`}>
              Мы работаем над мобильными версиями для iOS и Android. 
              Уже сейчас вы можете пользоваться LoveMemory через веб-браузер.
            </p>
              <div style={{display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap'}}>
              <a href="#" className="btn-app-prototype sound-trigger">
                <div className="btn-app-prototype__icon">
                  <Apple size={20} />
                </div>
                <div className="btn-app-prototype__content">
                  <p className="btn-app-prototype__subtitle">Скачать в</p>
                  <p className="btn-app-prototype__title">App Store</p>
                </div>
              </a>
              <a href="#" className="btn-app-prototype sound-trigger" style={{background: 'var(--color-secondary)'}}>
                <div className="btn-app-prototype__icon">
                  <Smartphone size={20} />
                </div>
                <div className="btn-app-prototype__content">
                  <p className="btn-app-prototype__subtitle">Загрузить в</p>
                  <p className="btn-app-prototype__title">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.ctaSection} full-width-section`}>
        <div className="section-container">
          <div className={`${styles.ctaContent} reveal-scale`}>
            <h2 className={`${styles.ctaTitle} elegant-title soft-glow`}>
              Готовы начать вашу историю?
            </h2>
            <p className={styles.ctaText}>
              Присоединяйтесь к LoveMemory и создавайте незабываемые моменты вместе
            </p>
            <Link to="/register" className="btn-prototype btn-prototype--secondary sound-trigger" style={{fontSize: 'var(--text-lg)', padding: '16px 32px'}}>
              <Heart size={20} />
              Начать историю любви
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
