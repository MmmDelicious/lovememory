import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Crown, 
  Clock, 
  User, 
  RotateCcw, 
  Flag,
  ArrowLeft,
  Trophy,
  Target,
  Pause,
  Play
} from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  BounceIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');
const BOARD_SIZE = Math.min(screenWidth - 40, 360);
const CELL_SIZE = BOARD_SIZE / 8;

type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' | null;
type PieceColor = 'white' | 'black';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

interface ChessPosition {
  row: number;
  col: number;
}

interface PlayerInfoProps {
  name: string;
  rating: number;
  timeLeft: number;
  isActive: boolean;
  isTop?: boolean;
  capturedPieces: ChessPiece[];
}

function PlayerInfo({ name, rating, timeLeft, isActive, isTop = false, capturedPieces }: PlayerInfoProps) {
  const pulseScale = useSharedValue(1);
  
  useEffect(() => {
    if (isActive) {
      pulseScale.value = withSequence(
        withSpring(1.02, { damping: 15 }),
        withSpring(1, { damping: 15 })
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 60;

  return (
    <Animated.View 
      entering={FadeInDown.delay(isTop ? 100 : 200)} 
      style={[styles.playerInfo, isTop && styles.playerInfoTop, animatedStyle]}
    >
      <LinearGradient
        colors={isActive ? ['#D97A6C', '#E89F93'] : ['#FFFFFF', '#FFF8F6']}
        style={styles.playerGradient}
      >
        <View style={styles.playerHeader}>
          <View style={styles.playerDetails}>
            <View style={[
              styles.playerAvatar,
              { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#EADFD8' }
            ]}>
              <User size={16} color={isActive ? '#FFFFFF' : '#D97A6C'} strokeWidth={2} />
            </View>
            <View style={styles.playerText}>
              <Text style={[
                styles.playerName,
                { color: isActive ? '#FFFFFF' : '#4A3F3D' }
              ]}>
                {name}
              </Text>
              <View style={styles.ratingContainer}>
                <Crown size={10} color={isActive ? 'rgba(255,255,255,0.8)' : '#8C7F7D'} strokeWidth={2} />
                <Text style={[
                  styles.playerRating,
                  { color: isActive ? 'rgba(255,255,255,0.8)' : '#8C7F7D' }
                ]}>
                  {rating}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={[
            styles.timeContainer,
            { 
              backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#EADFD8',
              borderColor: isLowTime ? '#D35D5D' : 'transparent',
              borderWidth: isLowTime ? 1 : 0
            }
          ]}>
            <Clock size={12} color={isActive ? '#FFFFFF' : isLowTime ? '#D35D5D' : '#D97A6C'} strokeWidth={2} />
            <Text style={[
              styles.timeText,
              { color: isActive ? '#FFFFFF' : isLowTime ? '#D35D5D' : '#D97A6C' }
            ]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
        
        {capturedPieces.length > 0 && (
          <View style={styles.capturedPieces}>
            <Text style={[styles.capturedLabel, { color: isActive ? 'rgba(255,255,255,0.7)' : '#8C7F7D' }]}>
              Взято:
            </Text>
            <View style={styles.capturedList}>
              {capturedPieces.slice(0, 6).map((piece, index) => (
                <Animated.Text 
                  key={index} 
                  style={styles.capturedPiece}
                  entering={BounceIn.delay(index * 100)}
                >
                  {getPieceSymbol(piece.type, piece.color)}
                </Animated.Text>
              ))}
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function getPieceSymbol(type: PieceType, color: PieceColor): string {
  if (!type) return '';
  
  const pieces = {
    white: {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙'
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟'
    }
  };
  
  return pieces[color][type] || '';
}

interface ChessCellProps {
  piece: ChessPiece | null;
  row: number;
  col: number;
  isSelected: boolean;
  isPossibleMove: boolean;
  onPress: () => void;
}

function ChessCell({ piece, row, col, isSelected, isPossibleMove, onPress }: ChessCellProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );
    
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isLight = (row + col) % 2 === 0;
  
  let backgroundColor = isLight ? '#FFF8F6' : '#F2E9E8';
  if (isSelected) backgroundColor = '#D97A6C';
  if (isPossibleMove) backgroundColor = '#EADFD8';

  return (
    <Animated.View style={[styles.cell, { backgroundColor }, animatedStyle]}>
      <TouchableOpacity
        style={styles.cellTouchable}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {piece && (
          <Animated.Text 
            style={[
              styles.piece,
              isSelected && styles.selectedPiece
            ]}
            entering={BounceIn.delay(50)}
          >
            {getPieceSymbol(piece.type, piece.color)}
          </Animated.Text>
        )}
        {isPossibleMove && !piece && (
          <Animated.View 
            style={styles.moveIndicator}
            entering={BounceIn.delay(100)}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function ChessBoard() {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(() => {
    const initialBoard: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    // Black pieces
    for (let col = 0; col < 8; col++) {
      initialBoard[0][col] = { type: backRow[col], color: 'black' };
      initialBoard[1][col] = { type: 'pawn', color: 'black' };
    }
    
    // White pieces
    for (let col = 0; col < 8; col++) {
      initialBoard[7][col] = { type: backRow[col], color: 'white' };
      initialBoard[6][col] = { type: 'pawn', color: 'white' };
    }
    
    return initialBoard;
  });
  
  const [selectedPosition, setSelectedPosition] = useState<ChessPosition | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<ChessPosition[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessPosition; to: ChessPosition } | null>(null);

  const handleCellPress = (row: number, col: number) => {
    const piece = board[row][col];
    
    if (selectedPosition) {
      // Try to move piece
      const isPossibleMove = possibleMoves.some(move => move.row === row && move.col === col);
      
      if (isPossibleMove) {
        const newBoard = [...board.map(row => [...row])];
        const selectedPiece = board[selectedPosition.row][selectedPosition.col];
        
        if (selectedPiece) {
          newBoard[row][col] = selectedPiece;
          newBoard[selectedPosition.row][selectedPosition.col] = null;
          setBoard(newBoard);
          setLastMove({ from: selectedPosition, to: { row, col } });
          
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      }
      
      setSelectedPosition(null);
      setPossibleMoves([]);
    } else if (piece && piece.color === 'white') {
      // Select piece (only allow white pieces for now)
      setSelectedPosition({ row, col });
      
      // Simple possible moves calculation (just for demo)
      const moves: ChessPosition[] = [];
      if (piece.type === 'pawn' && row > 0) {
        if (!board[row - 1][col]) moves.push({ row: row - 1, col });
        if (row === 6 && !board[row - 2][col]) moves.push({ row: row - 2, col });
      }
      
      setPossibleMoves(moves);
      
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    }
  };

  const isSelected = (row: number, col: number) => {
    return selectedPosition?.row === row && selectedPosition?.col === col;
  };

  const isPossibleMove = (row: number, col: number) => {
    return possibleMoves.some(move => move.row === row && move.col === col);
  };

  return (
    <Animated.View entering={BounceIn.delay(300)} style={styles.boardContainer}>
      <View style={styles.boardWrapper}>
        <View style={styles.board}>
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => (
              <ChessCell
                key={`${rowIndex}-${colIndex}`}
                piece={piece}
                row={rowIndex}
                col={colIndex}
                isSelected={isSelected(rowIndex, colIndex)}
                isPossibleMove={isPossibleMove(rowIndex, colIndex)}
                onPress={() => handleCellPress(rowIndex, colIndex)}
              />
            ))
          )}
        </View>
        
        {/* Board coordinates */}
        <View style={styles.coordinates}>
          <View style={styles.files}>
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, index) => (
              <Text key={file} style={styles.coordinateText}>{file}</Text>
            ))}
          </View>
          <View style={styles.ranks}>
            {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank, index) => (
              <Text key={rank} style={styles.coordinateText}>{rank}</Text>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

function ActionButton({ icon, label, onPress, variant = 'default', disabled = false }: ActionButtonProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );
    
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity 
        style={[
          styles.actionButton, 
          disabled && styles.actionButtonDisabled
        ]} 
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[
          styles.actionIcon,
          variant === 'danger' && styles.dangerIcon
        ]}>
          {icon}
        </View>
        <Text style={[
          styles.actionText,
          variant === 'danger' && styles.dangerText,
          disabled && styles.disabledText
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ChessScreen() {
  const [gameState, setGameState] = useState({
    currentPlayer: 'white' as PieceColor,
    moveCount: 1,
    gameStatus: 'playing' as 'playing' | 'check' | 'checkmate' | 'draw' | 'paused',
    timeLeft: { white: 600, black: 600 },
  });

  const [capturedPieces] = useState({
    white: [
      { type: 'pawn' as PieceType, color: 'black' as PieceColor },
      { type: 'knight' as PieceType, color: 'black' as PieceColor },
    ],
    black: [
      { type: 'pawn' as PieceType, color: 'white' as PieceColor },
    ],
  });

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (gameState.gameStatus === 'playing' && !isPaused) {
      const timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: {
            ...prev.timeLeft,
            [prev.currentPlayer]: Math.max(0, prev.timeLeft[prev.currentPlayer] - 1)
          }
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.currentPlayer, gameState.gameStatus, isPaused]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleResign = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    Alert.alert(
      'Сдаться?',
      'Вы уверены, что хотите сдаться? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Сдаться', 
          style: 'destructive', 
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            router.back();
          }
        }
      ]
    );
  };

  const handleOfferDraw = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Alert.alert(
      'Предложить ничью',
      'Отправить предложение ничьей сопернику?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Предложить', 
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            console.log('Offer draw');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#4A3F3D" strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Шахматы</Text>
          <Text style={styles.headerSubtitle}>Ход {gameState.moveCount}</Text>
        </View>
        
        <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
          {isPaused ? (
            <Play size={20} color="#4A3F3D" strokeWidth={2} />
          ) : (
            <Pause size={20} color="#4A3F3D" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Top Player (Opponent) */}
      <PlayerInfo
        name="Соперник"
        rating={1420}
        timeLeft={gameState.timeLeft.black}
        isActive={gameState.currentPlayer === 'black' && !isPaused}
        isTop={true}
        capturedPieces={capturedPieces.white}
      />

      {/* Chess Board */}
      <View style={styles.gameArea}>
        <ChessBoard />
      </View>

      {/* Bottom Player (You) */}
      <PlayerInfo
        name="Вы"
        rating={1380}
        timeLeft={gameState.timeLeft.white}
        isActive={gameState.currentPlayer === 'white' && !isPaused}
        capturedPieces={capturedPieces.black}
      />

      {/* Game Controls */}
      <Animated.View entering={FadeInUp.delay(400)} style={styles.controls}>
        <ActionButton
          icon={<Target size={18} color="#8C7F7D" strokeWidth={2} />}
          label="Ничья"
          onPress={handleOfferDraw}
        />
        
        <ActionButton
          icon={<RotateCcw size={18} color="#8C7F7D" strokeWidth={2} />}
          label="Отменить"
          onPress={() => console.log('Undo move')}
          disabled={gameState.moveCount <= 1}
        />
        
        <ActionButton
          icon={<Flag size={18} color="#D35D5D" strokeWidth={2} />}
          label="Сдаться"
          onPress={handleResign}
          variant="danger"
        />
      </Animated.View>

      {/* Game Status Overlay */}
      {(gameState.gameStatus !== 'playing' || isPaused) && (
        <Animated.View 
          entering={BounceIn.delay(500)} 
          style={styles.statusOverlay}
        >
          <View style={styles.statusContainer}>
            <LinearGradient
              colors={['#D97A6C', '#E89F93']}
              style={styles.statusGradient}
            >
              {isPaused ? (
                <>
                  <Pause size={32} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.statusTitle}>Пауза</Text>
                  <Text style={styles.statusText}>Игра приостановлена</Text>
                  <TouchableOpacity style={styles.resumeButton} onPress={handlePause}>
                    <Text style={styles.resumeButtonText}>Продолжить</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Trophy size={32} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.statusTitle}>
                    {gameState.gameStatus === 'checkmate' ? 'Мат!' : 
                     gameState.gameStatus === 'check' ? 'Шах!' : 'Ничья!'}
                  </Text>
                  <Text style={styles.statusText}>
                    {gameState.gameStatus === 'checkmate' ? 'Игра окончена' : 
                     gameState.gameStatus === 'check' ? 'Король под угрозой' : 'Партия завершена вничью'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </View>
        </Animated.View>
      )}
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
  pauseButton: {
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
  playerInfo: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  playerInfoTop: {
    marginTop: 0,
  },
  playerGradient: {
    padding: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerText: {},
  playerName: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerRating: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    marginLeft: 4,
  },
  capturedPieces: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  capturedLabel: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '500',
    marginBottom: 6,
  },
  capturedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  capturedPiece: {
    fontSize: 16,
    marginRight: 6,
    marginBottom: 2,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  boardContainer: {
    alignItems: 'center',
  },
  boardWrapper: {
    position: 'relative',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  cellTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  piece: {
    fontSize: CELL_SIZE * 0.6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selectedPiece: {
    transform: [{ scale: 1.1 }],
  },
  moveIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D97A6C',
    opacity: 0.8,
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  coordinates: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  files: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -24,
    left: 0,
    width: BOARD_SIZE,
    justifyContent: 'space-around',
  },
  ranks: {
    position: 'absolute',
    top: 0,
    left: -24,
    height: BOARD_SIZE,
    justifyContent: 'space-around',
  },
  coordinateText: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F2E9E8',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2E9E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dangerIcon: {
    backgroundColor: '#FFEBEE',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
  },
  dangerText: {
    color: '#D35D5D',
  },
  disabledText: {
    color: '#B8A8A4',
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  statusGradient: {
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
  },
  statusTitle: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  resumeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  resumeButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});