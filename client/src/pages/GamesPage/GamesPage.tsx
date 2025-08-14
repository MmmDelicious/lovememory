import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Gamepad2, 
  Trophy, 
  Users, 
  Star, 
  Sparkles, 
  Crown,
  Target,
  Brain,
  Zap,
  ChevronRight,
  Play
} from 'lucide-react';
import styles from './GamesPage.module.css';

interface Game {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  path: string;
  gradient: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  players: string;
  duration: string;
  featured?: boolean;
}

const GAMES: Game[] = [
  {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    description: 'Классическая игра для двоих',
    longDescription: 'Простая и увлекательная игра, которая никогда не выходит из моды. Проверьте свою стратегию!',
    icon: <Target size={24} />,
    path: '/games/tic-tac-toe',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'easy',
    players: '2',
    duration: '5 мин',
    featured: true
  },
  {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    description: 'Стратегическая битва умов',
    longDescription: 'Королевская игра, которая развивает логическое мышление и стратегические навыки.',
    icon: <Crown size={24} />,
    path: '/games/chess',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    image: 'https://images.pexels.com/photos/260024/pexels-photo-260024.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'hard',
    players: '2',
    duration: '30 мин'
  },
  {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    description: 'Проверьте свои знания вместе',
    longDescription: 'Увлекательные вопросы на разные темы. Узнайте, кто из вас эрудит!',
    icon: <Brain size={24} />,
    path: '/games/quiz',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '2-4',
    duration: '15 мин',
    featured: true
  },
  {
    id: 'poker',
    name: 'Покер',
    category: 'Карточные',
    description: 'Карточная игра на удачу и мастерство',
    longDescription: 'Классический покер с элементами блефа и стратегии. Почувствуйте себя в казино!',
    icon: <Sparkles size={24} />,
    path: '/games/poker',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    image: 'https://images.pexels.com/photos/1871508/pexels-photo-1871508.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'hard',
    players: '2-6',
    duration: '45 мин'
  },
  {
    id: 'memory',
    name: 'Мемори',
    category: 'Память',
    description: 'Тренируйте память вместе',
    longDescription: 'Найдите все пары карточек и покажите свою феноменальную память!',
    icon: <Zap size={24} />,
    path: '/games/memory',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    image: 'https://images.pexels.com/photos/1040157/pexels-photo-1040157.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'easy',
    players: '2',
    duration: '10 мин'
  },
  {
    id: 'wordle',
    name: 'Wordle',
    category: 'Слова',
    description: 'Угадайте слово за 6 попыток',
    longDescription: 'Популярная игра в слова. Используйте логику и интуицию, чтобы угадать загаданное слово!',
    icon: <Trophy size={24} />,
    path: '/games/wordle',
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    image: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '1-2',
    duration: '10 мин',
    featured: true
  }
];

const CATEGORIES = ['Все', 'Классика', 'Стратегия', 'Викторина', 'Карточные', 'Память', 'Слова'];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return '#4CAF50';
    case 'medium': return '#FF9800';
    case 'hard': return '#F44336';
    default: return '#9E9E9E';
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'Легко';
    case 'medium': return 'Средне';
    case 'hard': return 'Сложно';
    default: return 'Неизвестно';
  }
};

const GamesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const filteredGames = selectedCategory === 'Все' 
    ? GAMES 
    : GAMES.filter(game => game.category === selectedCategory);

  const featuredGames = GAMES.filter(game => game.featured);

  return (
    <div className={styles.container}>
      {/* Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingShape} style={{ '--delay': '0s' } as React.CSSProperties}></div>
        <div className={styles.floatingShape} style={{ '--delay': '2s' } as React.CSSProperties}></div>
        <div className={styles.floatingShape} style={{ '--delay': '4s' } as React.CSSProperties}></div>
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.mascot}>
            <div className={styles.mascotFace}>
              <Heart className={styles.mascotHeart} size={20} />
              <div className={styles.mascotEyes}>
                <span>^</span>
                <span>^</span>
              </div>
              <div className={styles.mascotMouth}>ω</div>
            </div>
            <div className={styles.mascotGlow}></div>
          </div>
          
          <h1 className={styles.heroTitle}>
            Игровая комната
            <Sparkles className={styles.titleIcon} size={32} />
          </h1>
          
          <p className={styles.heroSubtitle}>
            Проведите время весело, играя вместе с партнером
          </p>

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <Gamepad2 size={20} />
              <span>{GAMES.length} игр</span>
            </div>
            <div className={styles.statItem}>
              <Users size={20} />
              <span>Для пар</span>
            </div>
            <div className={styles.statItem}>
              <Trophy size={20} />
              <span>С рейтингом</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      {featuredGames.length > 0 && (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Star size={24} />
              Рекомендуемые игры
            </h2>
          </div>
          
          <div className={styles.featuredGrid}>
            {featuredGames.map((game) => (
              <Link
                key={game.id}
                to={game.path}
                className={styles.featuredCard}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                <div className={styles.featuredCardBackground}>
                  <img src={game.image} alt={game.name} />
                  <div className={styles.featuredCardOverlay} style={{ background: game.gradient }}></div>
                </div>
                
                <div className={styles.featuredCardContent}>
                  <div className={styles.featuredCardIcon}>
                    {game.icon}
                  </div>
                  
                  <div className={styles.featuredCardInfo}>
                    <h3 className={styles.featuredCardTitle}>{game.name}</h3>
                    <p className={styles.featuredCardDescription}>{game.longDescription}</p>
                    
                    <div className={styles.featuredCardMeta}>
                      <span className={styles.metaItem}>
                        <Users size={14} />
                        {game.players}
                      </span>
                      <span className={styles.metaItem}>
                        <Trophy size={14} />
                        {getDifficultyLabel(game.difficulty)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.featuredCardAction}>
                    <Play size={20} />
                  </div>
                </div>
                
                {hoveredGame === game.id && (
                  <div className={styles.featuredCardGlow}></div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className={styles.filterSection}>
        <div className={styles.categoryFilter}>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`${styles.categoryButton} ${
                selectedCategory === category ? styles.categoryButtonActive : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Games Grid */}
      <section className={styles.gamesSection}>
        <div className={styles.gamesGrid}>
          {filteredGames.map((game) => (
            <Link
              key={game.id}
              to={game.path}
              className={styles.gameCard}
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
            >
              <div className={styles.gameCardImage}>
                <img src={game.image} alt={game.name} />
                <div className={styles.gameCardOverlay}></div>
                
                <div className={styles.gameCardBadge}>
                  <span 
                    className={styles.difficultyBadge}
                    style={{ backgroundColor: getDifficultyColor(game.difficulty) }}
                  >
                    {getDifficultyLabel(game.difficulty)}
                  </span>
                </div>
              </div>
              
              <div className={styles.gameCardContent}>
                <div className={styles.gameCardHeader}>
                  <div className={styles.gameCardIcon}>
                    {game.icon}
                  </div>
                  <div className={styles.gameCardCategory}>
                    {game.category}
                  </div>
                </div>
                
                <h3 className={styles.gameCardTitle}>{game.name}</h3>
                <p className={styles.gameCardDescription}>{game.description}</p>
                
                <div className={styles.gameCardMeta}>
                  <div className={styles.metaGroup}>
                    <Users size={16} />
                    <span>{game.players} игрока</span>
                  </div>
                  <div className={styles.metaGroup}>
                    <Trophy size={16} />
                    <span>{game.duration}</span>
                  </div>
                </div>
                
                <div className={styles.gameCardAction}>
                  <span>Играть</span>
                  <ChevronRight size={18} />
                </div>
              </div>
              
              {hoveredGame === game.id && (
                <div className={styles.gameCardGlow}></div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Готовы начать играть?</h2>
          <p className={styles.ctaSubtitle}>
            Выберите игру и создайте незабываемые моменты вместе
          </p>
          <div className={styles.ctaActions}>
            <Link to="/games/tic-tac-toe" className={styles.ctaButton}>
              <Play size={20} />
              Начать игру
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GamesPage;