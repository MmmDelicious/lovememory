import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Trophy, 
  Users, 
  Clock,
  Star,
  Target,
  Crown,
  Brain,
  Sparkles,
  Zap
} from 'lucide-react';
import styles from './MobileGames.module.css';
interface Game {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'easy' | 'medium' | 'hard';
  players: string;
  duration: string;
  featured?: boolean;
  gradient: string;
}
const GAMES: Game[] = [
  {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    description: 'Быстрая игра на логику',
    icon: <Target size={20} />,
    difficulty: 'easy',
    players: '2',
    duration: '5 мин',
    featured: true,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    description: 'Битва умов',
    icon: <Crown size={20} />,
    difficulty: 'hard',
    players: '2',
    duration: '30 мин',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    description: 'Проверьте знания',
    icon: <Brain size={20} />,
    difficulty: 'medium',
    players: '2-4',
    duration: '15 мин',
    featured: true,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'poker',
    name: 'Покер',
    category: 'Карточные',
    description: 'Игра на мастерство',
    icon: <Sparkles size={20} />,
    difficulty: 'hard',
    players: '2-6',
    duration: '45 мин',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    id: 'memory',
    name: 'Мемори',
    category: 'Память',
    description: 'Тренируйте память',
    icon: <Zap size={20} />,
    difficulty: 'easy',
    players: '2',
    duration: '10 мин',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  }
];
const CATEGORIES = ['Все', 'Классика', 'Стратегия', 'Викторина', 'Карточные', 'Память'];
const MobileGames: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredGames = GAMES.filter(game => {
    const matchesCategory = selectedCategory === 'Все' || game.category === selectedCategory;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const featuredGames = GAMES.filter(game => game.featured);
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
  return (
    <div className={styles.mobileGames}>
      {}
      <div className={styles.header}>
        <h1>Игры для двоих 🎮</h1>
        <p>Играйте вместе и укрепляйте отношения</p>
      </div>
      {}
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск игр..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
      {}
      <div className={styles.categoriesSection}>
        <div className={styles.categoriesScroll}>
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`${styles.categoryChip} ${selectedCategory === category ? styles.categoryActive : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      {}
      {selectedCategory === 'Все' && (
        <div className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h2>
              <Star size={20} />
              Популярные
            </h2>
          </div>
          <div className={styles.featuredScroll}>
            {featuredGames.map(game => (
              <Link
                key={game.id}
                to={`/games/${game.id}`}
                className={styles.featuredCard}
                style={{ background: game.gradient }}
              >
                <div className={styles.featuredIcon}>
                  {game.icon}
                </div>
                <div className={styles.featuredContent}>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <div className={styles.featuredMeta}>
                    <span><Users size={14} /> {game.players}</span>
                    <span><Clock size={14} /> {game.duration}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {}
      <div className={styles.gamesSection}>
        <div className={styles.sectionHeader}>
          <h2>Все игры ({filteredGames.length})</h2>
        </div>
        <div className={styles.gamesGrid}>
          {filteredGames.map(game => (
            <Link
              key={game.id}
              to={`/games/${game.id}`}
              className={styles.gameCard}
            >
              <div className={styles.gameHeader}>
                <div 
                  className={styles.gameIcon}
                  style={{ background: game.gradient }}
                >
                  {game.icon}
                </div>
                <div className={styles.gameInfo}>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                </div>
              </div>
              <div className={styles.gameMeta}>
                <div className={styles.metaItem}>
                  <Users size={14} />
                  <span>{game.players}</span>
                </div>
                <div className={styles.metaItem}>
                  <Clock size={14} />
                  <span>{game.duration}</span>
                </div>
                <div 
                  className={styles.difficultyBadge}
                  style={{ backgroundColor: getDifficultyColor(game.difficulty) }}
                >
                  {getDifficultyLabel(game.difficulty)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {}
      {filteredGames.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎮</div>
          <h3>Игры не найдены</h3>
          <p>Попробуйте изменить фильтры или поисковый запрос</p>
        </div>
      )}
    </div>
  );
};
export default MobileGames;
