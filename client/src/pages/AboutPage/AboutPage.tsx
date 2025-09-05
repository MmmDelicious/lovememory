import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import NatureElements from '../../components/NatureElements';
import ScrollElements from '../../components/NatureElements/ScrollElements';
import styles from './AboutPage.module.css';

// Import Lottie animations
import loveAnimation from '../../assets/lessons/Love.json';
import relationshipAnimation from '../../assets/lessons/Relationship.json';
import coupleAnimation from '../../assets/lessons/Couple sharing and caring love.json';

const AboutPage: React.FC = () => {
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    // Intersection Observer for scroll animations
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

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll(
      '.animate-on-scroll, .animate-slide-left, .animate-slide-right, .reveal-up, .reveal-scale'
    );
    animatedElements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div className={styles.aboutPage}>
      <ScrollElements />
      {/* Hero Section */}
      <section className={`${styles.heroSection} full-width-section`}>
        <div className="section-container">
          <div className={`${styles.heroContent} grid-modern grid-modern--60-40`}>
            <NatureElements />
            
            <div className={`${styles.heroText} animate-slide-left`}>
              <h1 className={`${styles.heroTitle} elegant-title`}>
                LoveMemory
                <svg className={styles.heartIcon} viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="var(--color-accent-dusty)"/>
                </svg>
              </h1>
              <p className={styles.heroSubtitle}>
                Приложение для создания и сохранения ваших самых ценных моментов вместе
              </p>
              <p className={styles.heroDescription}>
                Каждая пара уникальна. Каждая история особенная. 
                LoveMemory помогает вам запечатлеть магию ваших отношений и создать собственную книгу любви.
              </p>
              <div className={styles.heroButtons}>
                <Link to="/register" className="btn-app-style btn-app-style--primary">
                  <div className="btn-app-style__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="btn-app-style__content">
                    <p className="btn-app-style__subtitle">Создать</p>
                    <p className="btn-app-style__title">Начать историю</p>
                  </div>
                </Link>
                <Link to="/login" className="btn-app-style">
                  <div className="btn-app-style__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <div className="btn-app-style__content">
                    <p className="btn-app-style__subtitle">Есть аккаунт?</p>
                    <p className="btn-app-style__title">Войти</p>
                  </div>
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

      {/* What is LoveMemory Section */}
      <section className={`${styles.section} full-width-section`}>
        <div className="section-container">
          <div className={`${styles.sectionContent} grid-modern grid-modern--40-60`}>
            <div className={`${styles.animationContainer} animate-slide-left floating-element--slow`}>
              <Lottie 
                animationData={relationshipAnimation} 
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
              <div className={styles.featureList}>
                <div className={`${styles.featureItem} reveal-up`}>
                  <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="var(--color-accent-sage)"/>
                  </svg>
                  <span>Совместный календарь событий</span>
                </div>
                <div className={`${styles.featureItem} reveal-up`}>
                  <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none">
                    <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM9 12H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill="var(--color-accent-terracotta)"/>
                  </svg>
                  <span>Игры для укрепления отношений</span>
                </div>
                <div className={`${styles.featureItem} reveal-up`}>
                  <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="var(--color-accent-dusty)"/>
                  </svg>
                  <span>Персонализированные советы</span>
                </div>
                <div className={`${styles.featureItem} reveal-up`}>
                  <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="var(--color-accent-forest)"/>
                  </svg>
                  <span>Аналитика ваших отношений</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
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

      {/* Mobile App Section */}
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
            <div className={styles.appButtons}>
              <a href="#" className="btn-app-style">
                <div className="btn-app-style__icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div className="btn-app-style__content">
                  <p className="btn-app-style__subtitle">Скоро в</p>
                  <p className="btn-app-style__title">App Store</p>
                </div>
              </a>
              <a href="#" className="btn-app-style">
                <div className="btn-app-style__icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
                  </svg>
                </div>
                <div className="btn-app-style__content">
                  <p className="btn-app-style__subtitle">Скоро в</p>
                  <p className="btn-app-style__title">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${styles.ctaSection} full-width-section`}>
        <div className="section-container">
          <div className={`${styles.ctaContent} reveal-scale`}>
            <h2 className={`${styles.ctaTitle} elegant-title soft-glow`}>
              Готовы начать вашу историю?
            </h2>
            <p className={styles.ctaText}>
              Присоединяйтесь к LoveMemory и создавайте незабываемые моменты вместе
            </p>
            <Link to="/register" className="btn-app-style btn-app-style--primary">
              <div className="btn-app-style__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
              </div>
              <div className="btn-app-style__content">
                <p className="btn-app-style__subtitle">Присоединиться</p>
                <p className="btn-app-style__title">Создать аккаунт</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
