const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pair_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Pairs',
      key: 'id',
    },
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [[
        // Игровые достижения
        'first_game', 'game_win_streak_3', 'game_win_streak_5', 'game_win_streak_10',
        'chess_master', 'poker_champion', 'quiz_genius', 'wordle_wizard',
        
        // Достижения уроков
        'first_lesson', 'lesson_streak_7', 'lesson_streak_30', 'communication_expert',
        'all_themes_complete', 'speed_learner',
        
        // Социальные достижения  
        'first_gift', 'generous_partner', 'event_creator', 'memory_keeper',
        'daily_active_7', 'daily_active_30',
        
        // Milestone достижения
        'first_month', 'first_year', 'harmony_50', 'harmony_75', 'harmony_100',
        'lovebirds', 'soulmates'
      ]],
    },
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general',
    validate: {
      isIn: [['games', 'lessons', 'gifts', 'social', 'milestones']],
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rarity: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'common',
    validate: {
      isIn: [['common', 'rare', 'epic', 'legendary']],
    },
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 1,
      max: 1000,
    },
  },
  earned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  is_hidden: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'achievements',
  indexes: [
    { fields: ['pair_id'] },
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['category'] },
    { fields: ['rarity'] },
    { fields: ['earned_at'] },
    { fields: ['pair_id', 'earned_at'] },
    { fields: ['pair_id', 'category'] },
    { fields: ['user_id', 'earned_at'] }
  ]
});

Achievement.associate = (models) => {
  Achievement.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair',
    onDelete: 'CASCADE'
  });
  
  Achievement.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'SET NULL'
  });
};

// Предопределенные шаблоны достижений
Achievement.TEMPLATES = {
  // Игровые достижения
  first_game: {
    title: 'Первая игра',
    description: 'Сыграли первую игру вместе!',
    category: 'games',
    rarity: 'common',
    points: 10,
    icon: '🎮'
  },
  chess_master: {
    title: 'Мастер шахмат',
    description: 'Выиграли 10 партий в шахматы',
    category: 'games',
    rarity: 'rare',
    points: 50,
    icon: '♟️'
  },
  
  // Достижения уроков
  first_lesson: {
    title: 'Первый урок',
    description: 'Прошли первый урок вместе',
    category: 'lessons',
    rarity: 'common',
    points: 15,
    icon: '📚'
  },
  communication_expert: {
    title: 'Эксперт общения',
    description: 'Прошли все уроки по общению',
    category: 'lessons',
    rarity: 'epic',
    points: 100,
    icon: '💬'
  },
  
  // Социальные достижения
  first_gift: {
    title: 'Первый подарок',
    description: 'Подарили первый подарок партнеру',
    category: 'gifts',
    rarity: 'common',
    points: 20,
    icon: '🎁'
  },
  memory_keeper: {
    title: 'Хранитель воспоминаний',
    description: 'Создали 50 событий в календаре',
    category: 'social',
    rarity: 'rare',
    points: 75,
    icon: '📷'
  },
  
  // Milestone достижения
  first_month: {
    title: 'Первый месяц',
    description: 'Месяц активности в приложении',
    category: 'milestones',
    rarity: 'rare',
    points: 100,
    icon: '💖'
  },
  harmony_100: {
    title: 'Идеальная гармония',
    description: 'Достигли 100% индекса гармонии',
    category: 'milestones',
    rarity: 'legendary',
    points: 500,
    icon: '✨'
  }
};

// Статические методы для работы с достижениями
Achievement.grantAchievement = async function(pairId, userId, type, additionalMetadata = {}) {
  try {
    // Проверяем, не получено ли уже это достижение
    const existing = await this.findOne({
      where: { pair_id: pairId, type, user_id: userId }
    });
    
    if (existing) {
      return null; // Уже получено
    }
    
    const template = this.TEMPLATES[type];
    if (!template) {
      throw new Error(`Unknown achievement type: ${type}`);
    }
    
    // Создаем достижение
    const achievement = await this.create({
      pair_id: pairId,
      user_id: userId,
      type,
      title: template.title,
      description: template.description,
      category: template.category,
      rarity: template.rarity,
      points: template.points,
      icon: template.icon,
      metadata: { ...additionalMetadata, earned_at: new Date() }
    });
    
    // Логируем в ActivityLog
    if (sequelize.models.ActivityLog) {
      await sequelize.models.ActivityLog.logEvent(
        pairId, 
        userId, 
        'achievement_earned', 
        { achievement_id: achievement.id, type, points: template.points }
      );
    }
    
    return achievement;
    
  } catch (error) {
    console.error('Failed to grant achievement:', error);
    return null;
  }
};

// Получить достижения пары
Achievement.getPairAchievements = async function(pairId, options = {}) {
  const { category, rarity, limit = 50, offset = 0 } = options;
  
  const where = { pair_id: pairId };
  if (category) where.category = category;
  if (rarity) where.rarity = rarity;
  
  return await this.findAll({
    where,
    order: [['earned_at', 'DESC']],
    limit,
    offset,
    include: [
      { model: sequelize.models.User, as: 'User', attributes: ['id', 'first_name', 'display_name'] }
    ]
  });
};

// Получить статистику достижений пары
Achievement.getPairStats = async function(pairId) {
  const total = await this.count({ where: { pair_id: pairId } });
  const totalPoints = await this.sum('points', { where: { pair_id: pairId } }) || 0;
  
  const byCategory = await this.findAll({
    where: { pair_id: pairId },
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('points')), 'points']
    ],
    group: ['category'],
    raw: true
  });
  
  const byRarity = await this.findAll({
    where: { pair_id: pairId },
    attributes: [
      'rarity',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['rarity'],
    raw: true
  });
  
  return {
    total,
    totalPoints,
    byCategory,
    byRarity
  };
};

// Проверить и выдать игровые достижения
Achievement.checkAndGrantGameAchievements = async function(pairId, userId, gameType, isWin, gameStats = {}) {
  const achievements = [];
  
  try {
    // Проверяем первую игру
    const firstGame = await this.grantAchievement(pairId, userId, 'first_game');
    if (firstGame) achievements.push(firstGame);
    
    if (isWin) {
      // Проверяем серии побед
      const recentWins = await sequelize.models.GameParticipant.count({
        where: {
          user_id: userId,
          stats: {
            [sequelize.Op.contains]: { wins: { [sequelize.Op.gt]: 0 } }
          },
          createdAt: {
            [sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Последние 30 дней
          }
        }
      });
      
      // Достижения за серии
      if (recentWins >= 3) {
        const streak3 = await this.grantAchievement(pairId, userId, 'game_win_streak_3');
        if (streak3) achievements.push(streak3);
      }
      
      // Специфичные для игр достижения
      if (gameType === 'chess' && gameStats.gamesWon >= 10) {
        const chessMaster = await this.grantAchievement(pairId, userId, 'chess_master');
        if (chessMaster) achievements.push(chessMaster);
      }
    }
    
    return achievements;
    
  } catch (error) {
    console.error('Failed to check game achievements:', error);
    return [];
  }
};

// Проверить достижения уроков
Achievement.checkAndGrantLessonAchievements = async function(pairId, userId, lessonData = {}) {
  const achievements = [];
  
  try {
    // Первый урок
    const firstLesson = await this.grantAchievement(pairId, userId, 'first_lesson');
    if (firstLesson) achievements.push(firstLesson);
    
    // Проверяем количество пройденных уроков
    const lessonsCompleted = await sequelize.models.UserLessonProgress.count({
      where: { pair_id: pairId, completed_by_user_id: userId }
    });
    
    // Эксперт общения (если все уроки по теме пройдены)
    if (lessonData.theme === 'communication') {
      const communicationLessons = await sequelize.models.UserLessonProgress.count({
        where: { 
          pair_id: pairId, 
          completed_by_user_id: userId 
        },
        include: [{
          model: sequelize.models.Lesson,
          as: 'Lesson',
          where: { theme: 'communication' }
        }]
      });
      
      // Если прошел много уроков по общению, даем достижение
      if (communicationLessons >= 5) {
        const commExpert = await this.grantAchievement(pairId, userId, 'communication_expert');
        if (commExpert) achievements.push(commExpert);
      }
    }
    
    return achievements;
    
  } catch (error) {
    console.error('Failed to check lesson achievements:', error);
    return [];
  }
};

// Получить топ пар по очкам достижений
Achievement.getLeaderboard = async function(limit = 10) {
  return await this.findAll({
    attributes: [
      'pair_id',
      [sequelize.fn('SUM', sequelize.col('Achievement.points')), 'totalPoints'],
      [sequelize.fn('COUNT', sequelize.col('Achievement.id')), 'totalAchievements']
    ],
    group: ['pair_id', 'Pair.id'], // Добавляем Pair.id в GROUP BY
    order: [[sequelize.literal('"totalPoints"'), 'DESC']],
    limit,
    include: [
      { 
        model: sequelize.models.Pair, 
        as: 'Pair',
        attributes: ['id', 'name', 'harmony_index'] // Добавляем id в attributes
      }
    ],
    raw: false
  });
};

module.exports = Achievement;
