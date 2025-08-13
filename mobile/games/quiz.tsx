import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, User, ArrowLeft, Trophy, Target, CircleCheck as CheckCircle, Circle as XCircle, Star, Zap, Crown } from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  BounceIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface PlayerScoreProps {
  name: string;
  score: number;
  isYou?: boolean;
  isLeading?: boolean;
  streak?: number;
}

function PlayerScore({ name, score, isYou = false, isLeading = false, streak = 0 }: PlayerScoreProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isLeading) {
      scale.value = withSequence(
        withSpring(1.05, { damping: 15 }),
        withSpring(1, { damping: 15 })
      );
    }
  }, [isLeading, score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.playerScore, isLeading && styles.leadingPlayer, animatedStyle]}>
      <LinearGradient
        colors={isLeading ? ['#D97A6C', '#E89F93'] : ['#FFFFFF', '#FFF8F6']}
        style={styles.playerScoreGradient}
      >
        <View style={styles.playerScoreContent}>
          <View style={[
            styles.playerScoreAvatar,
            { backgroundColor: isLeading ? 'rgba(255,255,255,0.2)' : '#EADFD8' }
          ]}>
            <User size={16} color={isLeading ? '#FFFFFF' : '#D97A6C'} strokeWidth={2} />
          </View>
          <View style={styles.playerScoreInfo}>
            <Text style={[
              styles.playerScoreName,
              { color: isLeading ? '#FFFFFF' : '#4A3F3D' }
            ]}>
              {name} {isYou && '(Вы)'}
            </Text>
            <View style={styles.scoreRow}>
              <Text style={[
                styles.playerScorePoints,
                { color: isLeading ? 'rgba(255,255,255,0.8)' : '#8C7F7D' }
              ]}>
                {score} очков
              </Text>
              {streak > 1 && (
                <View style={styles.streakBadge}>
                  <Zap size={10} color="#D97A6C" strokeWidth={2} />
                  <Text style={styles.streakText}>{streak}</Text>
                </View>
              )}
            </View>
          </View>
          {isLeading && (
            <Crown size={16} color="#FFFFFF" strokeWidth={2} />
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  showResult: boolean;
  timeLeft: number;
  questionNumber: number;
  totalQuestions: number;
}

function QuestionCard({ 
  question, 
  selectedAnswer, 
  onSelectAnswer, 
  showResult, 
  timeLeft, 
  questionNumber, 
  totalQuestions 
}: QuestionCardProps) {
  const getDifficultyColor = () => {
    switch (question.difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#D35D5D';
      default: return '#8C7F7D';
    }
  };

  const getDifficultyLabel = () => {
    switch (question.difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return '';
    }
  };

  return (
    <Animated.View 
      entering={SlideInRight.delay(200)} 
      exiting={SlideOutLeft}
      style={styles.questionCard}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FFF8F6']}
        style={styles.questionGradient}
      >
        <View style={styles.questionHeader}>
          <View style={styles.questionMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{question.category}</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
              <Text style={styles.difficultyText}>{getDifficultyLabel()}</Text>
            </View>
          </View>
          
          <View style={[
            styles.timerContainer,
            timeLeft <= 5 && styles.timerUrgent
          ]}>
            <Clock size={14} color={timeLeft <= 5 ? '#D35D5D' : '#D97A6C'} strokeWidth={2} />
            <Text style={[
              styles.timerText,
              timeLeft <= 5 && styles.timerTextUrgent
            ]}>
              {timeLeft}с
            </Text>
          </View>
        </View>
        
        <View style={styles.questionProgress}>
          <Text style={styles.questionNumber}>
            Вопрос {questionNumber} из {totalQuestions}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: `${(questionNumber / totalQuestions) * 100}%` }
              ]}
              entering={FadeInUp.delay(100)}
            />
          </View>
        </View>
        
        <Text style={styles.questionText}>{question.question}</Text>
        
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const isWrong = showResult && isSelected && !isCorrect;
            
            return (
              <OptionButton
                key={index}
                option={option}
                index={index}
                isSelected={isSelected}
                isCorrect={showResult && isCorrect}
                isWrong={isWrong}
                onPress={() => onSelectAnswer(index)}
                disabled={showResult}
                delay={300 + index * 50}
              />
            );
          })}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

interface OptionButtonProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onPress: () => void;
  disabled: boolean;
  delay: number;
}

function OptionButton({ 
  option, 
  index, 
  isSelected, 
  isCorrect, 
  isWrong, 
  onPress, 
  disabled, 
  delay 
}: OptionButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    scale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );
    
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  let borderColor = '#F2E9E8';
  let backgroundColor = '#FFFFFF';
  
  if (isSelected && !disabled) {
    borderColor = '#D97A6C';
    backgroundColor = '#EADFD8';
  }
  if (isCorrect) {
    borderColor = '#4CAF50';
    backgroundColor = '#4CAF50';
  }
  if (isWrong) {
    borderColor = '#D35D5D';
    backgroundColor = '#D35D5D';
  }

  return (
    <Animated.View 
      entering={BounceIn.delay(delay)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.optionButton,
          { borderColor, backgroundColor }
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.optionContent}>
          <View style={[
            styles.optionIndex,
            (isSelected || isCorrect) && styles.optionIndexSelected
          ]}>
            <Text style={[
              styles.optionIndexText,
              (isSelected || isCorrect) && styles.optionIndexTextSelected
            ]}>
              {String.fromCharCode(65 + index)}
            </Text>
          </View>
          <Text style={[
            styles.optionText,
            (isSelected || isCorrect || isWrong) && styles.optionTextSelected
          ]}>
            {option}
          </Text>
          {isCorrect && (
            <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
          )}
          {isWrong && (
            <XCircle size={20} color="#FFFFFF" strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuizScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [scores, setScores] = useState({ player: 0, opponent: 120 });
  const [gamePhase, setGamePhase] = useState<'playing' | 'finished'>('playing');
  const [playerStreak, setPlayerStreak] = useState(0);
  const [opponentStreak, setOpponentStreak] = useState(2);

  const questions: Question[] = [
    {
      id: 1,
      question: 'Какая планета самая большая в Солнечной системе?',
      options: ['Сатурн', 'Юпитер', 'Нептун', 'Уран'],
      correctAnswer: 1,
      category: 'Астрономия',
      difficulty: 'easy'
    },
    {
      id: 2,
      question: 'В каком году была основана Москва?',
      options: ['1147', '1156', '1132', '1161'],
      correctAnswer: 0,
      category: 'История',
      difficulty: 'medium'
    },
    {
      id: 3,
      question: 'Кто написал роман "Война и мир"?',
      options: ['Достоевский', 'Пушкин', 'Толстой', 'Тургенев'],
      correctAnswer: 2,
      category: 'Литература',
      difficulty: 'easy'
    },
    {
      id: 4,
      question: 'Какой химический элемент имеет символ Au?',
      options: ['Серебро', 'Золото', 'Алюминий', 'Медь'],
      correctAnswer: 1,
      category: 'Химия',
      difficulty: 'medium'
    },
    {
      id: 5,
      question: 'Сколько симфоний написал Бетховен?',
      options: ['7', '8', '9', '10'],
      correctAnswer: 2,
      category: 'Музыка',
      difficulty: 'hard'
    },
  ];

  useEffect(() => {
    if (timeLeft > 0 && !showResult && gamePhase === 'playing') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp();
    }
  }, [timeLeft, showResult, gamePhase]);

  const handleTimeUp = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setShowResult(true);
    setPlayerStreak(0);
    setTimeout(() => {
      nextQuestion();
    }, 2500);
  };

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
    
    const isCorrect = index === questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      const points = getPointsForDifficulty(questions[currentQuestion].difficulty);
      setScores(prev => ({ ...prev, player: prev.player + points }));
      setPlayerStreak(prev => prev + 1);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setPlayerStreak(0);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    
    // Simulate opponent answer
    setTimeout(() => {
      const opponentCorrect = Math.random() > 0.3;
      if (opponentCorrect) {
        const points = getPointsForDifficulty(questions[currentQuestion].difficulty);
        setScores(prev => ({ ...prev, opponent: prev.opponent + points }));
        setOpponentStreak(prev => prev + 1);
      } else {
        setOpponentStreak(0);
      }
    }, 1000);
    
    setTimeout(() => {
      nextQuestion();
    }, 2500);
  };

  const getPointsForDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return 10;
      case 'medium': return 15;
      case 'hard': return 20;
      default: return 10;
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
    } else {
      setGamePhase('finished');
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (gamePhase === 'finished') {
    const isWinner = scores.player > scores.opponent;
    const coinReward = isWinner ? 50 : 10;
    
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#D97A6C" />
        
        <View style={styles.resultContainer}>
          <Animated.View entering={BounceIn.delay(100)} style={styles.resultCard}>
            <LinearGradient
              colors={isWinner ? ['#D97A6C', '#E89F93'] : ['#8C7F7D', '#B8A8A4']}
              style={styles.resultGradient}
            >
              <Trophy size={56} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.resultTitle}>
                {isWinner ? '🎉 Победа!' : '😔 Поражение'}
              </Text>
              <Text style={styles.resultScore}>
                {scores.player} : {scores.opponent}
              </Text>
              
              <View style={styles.resultStats}>
                <View style={styles.resultStat}>
                  <Target size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <Text style={styles.resultStatText}>
                    {Math.round((scores.player / (questions.length * 20)) * 100)}% точность
                  </Text>
                </View>
                <View style={styles.resultStat}>
                  <Zap size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <Text style={styles.resultStatText}>
                    +{coinReward} монет
                  </Text>
                </View>
              </View>
              
              <Text style={styles.resultText}>
                {isWinner 
                  ? 'Отличная игра! Вы показали прекрасные знания.'
                  : 'Хорошая попытка! Продолжайте тренироваться.'
                }
              </Text>
              
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.playAgainButton} onPress={() => {
                  // Reset game state
                  setCurrentQuestion(0);
                  setSelectedAnswer(null);
                  setShowResult(false);
                  setTimeLeft(15);
                  setScores({ player: 0, opponent: 0 });
                  setGamePhase('playing');
                  setPlayerStreak(0);
                  setOpponentStreak(0);
                }}>
                  <Text style={styles.playAgainText}>Играть еще</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.backToLobbyButton} onPress={() => router.back()}>
                  <Text style={styles.backToLobbyText}>В лобби</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#4A3F3D" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Викторина</Text>
          <Text style={styles.headerSubtitle}>Проверь свои знания</Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Progress Bar */}
      <Animated.View entering={FadeInDown.delay(150)} style={styles.progressContainer}>
        <View style={styles.mainProgressBar}>
          <Animated.View 
            style={[styles.mainProgressFill, { width: `${progress}%` }]}
            entering={FadeInUp.delay(200)}
          />
        </View>
      </Animated.View>

      {/* Player Scores */}
      <View style={styles.scoresContainer}>
        <PlayerScore
          name="Вы"
          score={scores.player}
          isYou={true}
          isLeading={scores.player >= scores.opponent}
          streak={playerStreak}
        />
        <PlayerScore
          name="Соперник"
          score={scores.opponent}
          isLeading={scores.opponent > scores.player}
          streak={opponentStreak}
        />
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <QuestionCard
          question={questions[currentQuestion]}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleSelectAnswer}
          showResult={showResult}
          timeLeft={timeLeft}
          questionNumber={currentQuestion + 1}
          totalQuestions={questions.length}
        />
      </View>

      {/* Game Info */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.gameInfo}>
        <View style={styles.gameInfoCard}>
          <LinearGradient
            colors={['#FFFFFF', '#FFF8F6']}
            style={styles.gameInfoGradient}
          >
            <View style={styles.gameInfoRow}>
              <View style={styles.gameInfoItem}>
                <Zap size={14} color="#D97A6C" strokeWidth={2} />
                <Text style={styles.gameInfoText}>Ставка: 25 🪙</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Trophy size={14} color="#D97A6C" strokeWidth={2} />
                <Text style={styles.gameInfoText}>Приз: 50 🪙</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mainProgressBar: {
    height: 6,
    backgroundColor: '#F2E9E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  mainProgressFill: {
    height: '100%',
    backgroundColor: '#D97A6C',
    borderRadius: 3,
  },
  scoresContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  playerScore: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  leadingPlayer: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  playerScoreGradient: {
    padding: 16,
  },
  playerScoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerScoreAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playerScoreInfo: {
    flex: 1,
  },
  playerScoreName: {
    fontSize: 13,
    fontFamily: 'System',
    fontWeight: '600',
    marginBottom: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerScorePoints: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EADFD8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  streakText: {
    fontSize: 9,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
    marginLeft: 2,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  questionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  questionGradient: {
    padding: 24,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#EADFD8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2E9E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerUrgent: {
    backgroundColor: '#FFEBEE',
  },
  timerText: {
    fontSize: 13,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
    marginLeft: 4,
  },
  timerTextUrgent: {
    color: '#D35D5D',
  },
  questionProgress: {
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F2E9E8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D97A6C',
    borderRadius: 2,
  },
  questionText: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
    lineHeight: 28,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2E9E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIndexSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  optionIndexText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
  },
  optionIndexTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#4A3F3D',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  gameInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gameInfoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  gameInfoGradient: {
    padding: 16,
  },
  gameInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameInfoText: {
    fontSize: 13,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
    marginLeft: 6,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(217, 122, 108, 0.1)',
  },
  resultCard: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  resultGradient: {
    padding: 40,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 32,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  resultScore: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  resultStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  resultStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultStatText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  resultText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  playAgainButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  playAgainText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backToLobbyButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  backToLobbyText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
  },
});