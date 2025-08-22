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
  Play,
  Eye,
  Shuffle
} from 'lucide-react';
import styles from './GamesPage.module.css';
interface Game {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  shortReason?: string;
  icon: React.ReactNode;
  path: string;
  gradient: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  players: string;
  playersText: string;
  duration: string;
  featured?: boolean;
}
const GAMES: Game[] = [
  {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    description: 'Классическая игра для двоих',
    longDescription: 'Простая и увлекательная игра, которая никогда не выходит из моды.',
    shortReason: 'Быстрая партия • Идеально для двоих',
    icon: <Target size={20} />,
    path: '/games/tic-tac-toe',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'easy',
    players: '2',
    playersText: '2 игрока',
    duration: '5 мин',
    featured: true
  },
  {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    description: 'Стратегическая битва умов',
    longDescription: 'Королевская игра, которая развивает логическое мышление и стратегические навыки.',
    shortReason: 'Развивает мышление • Классика',
    icon: <Crown size={20} />,
    path: '/games/chess',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    image: 'https://images.pexels.com/photos/260024/pexels-photo-260024.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'hard',
    players: '2',
    playersText: '2 игрока',
    duration: '30 мин'
  },
  {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    description: 'Проверьте знания вместе',
    longDescription: 'Увлекательные вопросы на разные темы. Узнайте, кто из вас эрудит!',
    shortReason: 'Проверка эрудиции • До 15 мин',
    icon: <Brain size={20} />,
    path: '/games/quiz',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '2-4',
    playersText: '2-4 игрока',
    duration: '15 мин',
    featured: true
  },
  {
    id: 'poker',
    name: 'Покер',
    category: 'Карточные',
    description: 'Карточная игра на удачу и мастерство',
    longDescription: 'Классический покер с элементами блефа и стратегии. Почувствуйте себя в казино!',
    shortReason: 'Блеф и стратегия • Для компании',
    icon: <Sparkles size={20} />,
    path: '/games/poker',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    image: 'https://images.pexels.com/photos/1871508/pexels-photo-1871508.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'hard',
    players: '2-6',
    playersText: '2-6 игроков',
    duration: '45 мин'
  },
  {
    id: 'memory',
    name: 'Мемори',
    category: 'Память',
    description: 'Тренируйте память вместе',
    longDescription: 'Найдите все пары карточек и покажите свою феноменальную память!',
    shortReason: 'Тренировка памяти • Всего 10 мин',
    icon: <Zap size={20} />,
    path: '/games/memory',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    image: 'https://images.pexels.com/photos/1040157/pexels-photo-1040157.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'easy',
    players: '2',
    playersText: '2 игрока',
    duration: '10 мин'
  },
  {
    id: 'wordle',
    name: 'Wordle',
    category: 'Слова',
    description: 'Угадайте слово за 6 попыток',
    longDescription: 'Популярная игра в слова. Используйте логику и интуицию, чтобы угадать загаданное слово!',
    shortReason: 'Игра в слова • Логика и интуиция',
    icon: <Trophy size={20} />,
    path: '/games/wordle',
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    image: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '1-2',
    playersText: '1-2 игрока',
    duration: '10 мин',
    featured: true
  },
  {
    id: 'codenames',
    name: 'Codenames',
    category: 'Командная',
    description: 'Игра с ассоциациями для команд',
    longDescription: 'Командная игра на ассоциации. Капитаны дают подсказки, а игроки отгадывают слова!',
    shortReason: 'Командная работа • Ассоциации',
    icon: <Eye size={20} />,
    path: '/games/codenames',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.pexels.com/photos/3183132/pexels-photo-3183132.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '4',
    playersText: '4 игрока',
    duration: '20 мин',
    featured: true
  }
];
const CATEGORIES = ['Все', 'Классика', 'Стратегия', 'Викторина', 'Карточные', 'Память', 'Слова', 'Командная'];
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
const getRandomGame = () => {
  const randomIndex = Math.floor(Math.random() * GAMES.length);
  return GAMES[randomIndex];
};
const GamesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const filteredGames = selectedCategory === 'Все' 
    ? GAMES 
    : GAMES.filter(game => game.category === selectedCategory);
  const featuredGames = GAMES.filter(game => game.featured).slice(0, 4);
  const handleRandomGame = () => {
    const randomGame = getRandomGame();
    window.location.href = randomGame.path;
  };
  return (
    <div className={styles.container}>
      {}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingShape} style={{ '--delay': '0s' } as React.CSSProperties}></div>
        <div className={styles.floatingShape} style={{ '--delay': '3s' } as React.CSSProperties}></div>
        <div className={styles.floatingShape} style={{ '--delay': '6s' } as React.CSSProperties}></div>
      </div>
      {}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Игровая комната</h1>
          <p className={styles.heroSubtitle}>Выбирайте и играйте вдвоём</p>
        </div>
      </section>
      {}
      {featuredGames.length > 0 && (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Star size={20} />
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
                <div className={styles.featuredCardImage}>
                  <img src={game.image} alt={game.name} />
                  <div className={styles.featuredCardOverlay}></div>
                  <div className={styles.featuredCardContent}>
                    <h3 className={styles.featuredCardTitle}>{game.name}</h3>
                    <p className={styles.featuredCardDescription}>
                      {game.shortReason || game.description}
                    </p>
                  </div>
                  {hoveredGame === game.id && (
                    <div className={styles.featuredCardHover}>
                      <div className={styles.featuredCardHoverContent}>
                        <div className={styles.featuredCardIcon}>
                          {game.icon}
                        </div>
                        <h4 className={styles.featuredCardHoverTitle}>{game.name}</h4>
                        <p className={styles.featuredCardHoverDescription}>
                          {game.longDescription}
                        </p>
                        <div className={styles.featuredCardMeta}>
                          <span className={styles.metaItem}>
                            <Users size={12} />
                            {game.playersText}
                          </span>
                          <span className={styles.metaItem}>
                            <Trophy size={12} />
                            {game.duration}
                          </span>
                        </div>
                        <div className={styles.featuredCardPlayButton}>
                          <Play size={16} />
                          Играть
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {}
      <section className={styles.filterSection}>
        <div className={styles.categoryFilter}>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`${styles.categoryChip} ${
                selectedCategory === category ? styles.categoryChipActive : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>
      {}
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
                <div className={styles.gameCardInfo}>
                  <h3 className={styles.gameCardTitle}>{game.name}</h3>
                  <p className={styles.gameCardDescription}>{game.description}</p>
                  <div className={styles.gameCardMeta}>
                    <span>
                      <Users size={12} />
                      {game.playersText}
                    </span>
                    <span>
                      <Trophy size={12} />
                      {game.duration}
                    </span>
                  </div>
                </div>
                <div className={styles.gameCardAction}>
                  <span>Играть</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Готовы начать?</h2>
          <p className={styles.ctaSubtitle}>
            Выберите игру — и поехали
          </p>
          <div className={styles.ctaActions}>
            <Link to="/games/tic-tac-toe" className={styles.ctaButton}>
              <Play size={18} />
              Начать игру
            </Link>
            <button 
              onClick={handleRandomGame}
              className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
            >
              <Shuffle size={16} />
              Случайная игра
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
export default GamesPage;
