import React, { useState, useEffect } from 'react';
import { User, Trophy, Users, Target, SkipForward, Eye, MessageSquare } from 'lucide-react';
import styles from './CodenamesGame.module.css';
interface CodenamesGameProps {
  gameState: any;
  user: any;
  makeMove: (move: any) => void;
  handleReturnToLobby: () => void;
}
interface Card {
  id: number;
  word: string;
  type: 'red' | 'blue' | 'neutral' | 'assassin' | null;
  revealed: boolean;
}
interface Team {
  captain: string;
  player: string;
  name: string;
  color: string;
}
const CodenamesGame: React.FC<CodenamesGameProps> = ({ 
  gameState, 
  user, 
  makeMove, 
  handleReturnToLobby 
}) => {
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(gameState?.timeRemaining || 0);
  const [teamChatMessages, setTeamChatMessages] = useState<{[key: string]: string[]}>({
    team1: [],
    team2: []
  });
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = React.useRef<{[key: string]: HTMLDivElement | null}>({});
  const userRole = gameState?.playerRole;
  const isCaptain = React.useMemo(() => {
    if (!gameState?.teams || !user?.id) return false;
    return Object.values(gameState.teams).some((team: any) => team.captain === user.id);
  }, [gameState?.teams, user?.id]);
  const isCurrentPlayer = gameState?.currentPlayer === user.id;
  const currentTeam = gameState?.currentTeam;
  const currentPhase = gameState?.currentPhase;
  useEffect(() => {
    setError('');
  }, [isCurrentPlayer, currentPhase]);
  useEffect(() => {
    if (gameState?.timeRemaining !== undefined) {
      setTimeRemaining(gameState.timeRemaining);
    }
  }, [gameState?.timeRemaining]);
  useEffect(() => {
    if (gameState?.status !== 'in_progress' || timeRemaining <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState?.status, gameState?.turnStartTime, timeRemaining]);
  useEffect(() => {
    Object.keys(chatMessagesRef.current).forEach(teamId => {
      const chatElement = chatMessagesRef.current[teamId];
      if (chatElement) {
        chatElement.scrollTop = chatElement.scrollHeight;
      }
    });
  }, [teamChatMessages]);
  const handleCardClick = async (cardId: number) => {
    if (currentPhase !== 'guessing' || !isCurrentPlayer || isCaptain) return;
    try {
      setError('');
      const result = await makeMove({
        type: 'guess',
        cardId: cardId
      });
      if (result?.error) {
        setError(result.error);
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка при выборе карты');
    }
  };
  const handlePass = async () => {
    try {
      setError('');
      const result = await makeMove({
        type: 'pass'
      });
      if (result?.error) {
        setError(result.error);
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка при пропуске хода');
    }
  };
  const getCardClassName = (card: Card) => {
    let className = styles.card;
    if (card.revealed) {
      className += ` ${styles.cardRevealed}`;
      switch (card.type) {
        case 'red':
          className += ` ${styles.cardRed}`;
          break;
        case 'blue':
          className += ` ${styles.cardBlue}`;
          break;
        case 'neutral':
          className += ` ${styles.cardNeutral}`;
          break;
        case 'assassin':
          className += ` ${styles.cardAssassin}`;
          break;
      }
    } else {
      if (isCaptain && card.type) {
        switch (card.type) {
          case 'red':
            className += ` ${styles.cardRedHint}`;
            break;
          case 'blue':
            className += ` ${styles.cardBlueHint}`;
            break;
          case 'neutral':
            className += ` ${styles.cardNeutralHint}`;
            break;
          case 'assassin':
            className += ` ${styles.cardAssassinHint}`;
            break;
        }
      }
      if (currentPhase === 'guessing' && isCurrentPlayer && !isCaptain) {
        className += ` ${styles.cardClickable}`;
      }
    }
    return className;
  };
  const getTeamDisplayName = (teamId: string) => {
    return gameState?.teams?.[teamId]?.name || teamId;
  };
  const getPlayerName = (playerId: string) => {
    if (playerId === user.id) {
      const displayName = user.first_name 
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user.name || user.username || 'Вы';
      return `${displayName} (Вы)`;
    }
    const playerInfo = gameState?.playersInfo?.[playerId];
    if (playerInfo) {
      return playerInfo.first_name 
        ? `${playerInfo.first_name} ${playerInfo.last_name || ''}`.trim()
        : playerInfo.name || playerInfo.username || `Игрок ${playerId.substring(0, 6)}`;
    }
    return `Игрок ${playerId.substring(0, 6)}`;
  };
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  if (!gameState || !gameState.teams || !gameState.board) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>Загрузка игры...</span>
        </div>
      </div>
    );
  }
  if (gameState?.status === 'finished') {
    const isWinner = gameState.winner === userRole?.team;
    const winnerTeamName = getTeamDisplayName(gameState.winner);
    return (
      <div className={styles.gameFinished}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>
            {isWinner ? <Trophy size={48} /> : <Target size={48} />}
          </div>
          <h2 className={styles.resultTitle}>
            {isWinner ? 'Победа!' : 'Поражение'}
          </h2>
          <p className={styles.resultText}>
            Победила команда: {winnerTeamName}
          </p>
          <button 
            onClick={handleReturnToLobby}
            className={styles.returnButton}
          >
            Вернуться в лобби
          </button>
        </div>
      </div>
    );
  }
  const handleChatSubmit = (teamId: 'team1' | 'team2', message: string) => {
    if (!message.trim()) return;
    const clueMatch = message.trim().match(/^(\S+)\s+(\d+)$/);
    if (clueMatch && isCaptain && userRole?.team === teamId && currentPhase === 'giving_clue' && isCurrentPlayer) {
      const [, clueWord, clueNumber] = clueMatch;
      const number = parseInt(clueNumber);
      if (number >= 1 && number <= 9) {
        makeMove({
          type: 'give_clue',
          clueWord: clueWord,
          clueNumber: number
        });
        setTeamChatMessages(prev => ({
          ...prev,
          [teamId]: [...prev[teamId], `👑 Подсказка: "${clueWord}" для ${clueNumber} карт`]
        }));
      } else {
        setTeamChatMessages(prev => ({
          ...prev,
          [teamId]: [...prev[teamId], `❌ Число должно быть от 1 до 9`]
        }));
      }
    } else {
      const playerName = getPlayerName(user.id);
      setTeamChatMessages(prev => ({
        ...prev,
        [teamId]: [...prev[teamId], `${playerName}: ${message}`]
      }));
    }
    setChatInput('');
  };
  const renderTeamChat = (teamId: 'team1' | 'team2', teamData: Team) => {
    const isRedTeam = teamData.color === 'red';
    const chatClass = isRedTeam ? styles.teamChatRed : styles.teamChatBlue;
    const headerClass = isRedTeam ? styles.teamChatHeaderRed : styles.teamChatHeaderBlue;
    const userTeam = userRole?.team;
    const isUserTeam = userTeam === teamId;
    const canUseChat = isUserTeam;
    return (
      <div className={`${styles.teamChat} ${chatClass}`}>
        <div className={`${styles.teamChatHeader} ${headerClass}`}>
          {teamData.name}
          {currentTeam === teamId && <span> 🎯</span>}
        </div>
        <div className={styles.teamChatMembers}>
          <div className={styles.teamChatMember}>
            <span className={styles.teamChatMemberRole}>👑</span>
            <span>{getPlayerName(teamData.captain)}</span>
          </div>
          <div className={styles.teamChatMember}>
            <span className={styles.teamChatMemberRole}>🎯</span>
            <span>{getPlayerName(teamData.player)}</span>
          </div>
          <div className={styles.teamChatMember}>
            <span className={styles.teamChatMemberRole}>📊</span>
            <span>{gameState?.teamProgress?.[teamId]?.revealed || 0} / {gameState?.teamProgress?.[teamId]?.total || 0}</span>
          </div>
        </div>
        <div 
          className={styles.teamChatMessages}
          ref={(el) => { chatMessagesRef.current[teamId] = el; }}
        >
          {gameState?.currentClue && currentTeam === teamId && (
            <div className={styles.teamChatMessage} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6' }}>
              💡 Текущая подсказка: "{gameState.currentClue}" для {gameState.currentClueNumber} карт
              {gameState?.guessesLeft > 0 && ` (осталось попыток: ${gameState.guessesLeft})`}
            </div>
          )}
          {teamChatMessages[teamId].map((message, index) => (
            <div key={index} className={styles.teamChatMessage}>
              {message}
            </div>
          ))}
          {teamChatMessages[teamId].length === 0 && (
            <div className={styles.teamChatMessage} style={{ opacity: 0.6 }}>
              {isUserTeam && isCaptain && currentPhase === 'giving_clue' && isCurrentPlayer 
                ? "👑 Введите подсказку в формате: слово число (например: животные 3)"
                : isUserTeam 
                ? "Чат вашей команды"
                : "Чат соперников"}
            </div>
          )}
        </div>
        {canUseChat && (
          <div className={styles.teamChatInput}>
            <input 
              type="text" 
              value={isUserTeam ? chatInput : ''}
              onChange={(e) => isUserTeam && setChatInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && isUserTeam) {
                  handleChatSubmit(teamId, chatInput);
                }
              }}
              placeholder={
                isUserTeam && isCaptain && currentPhase === 'giving_clue' && isCurrentPlayer
                  ? "Подсказка: слово число"
                  : isUserTeam
                  ? "Сообщение команде..."
                  : "Недоступно"
              }
              className={styles.teamChatInputField}
              disabled={!isUserTeam}
            />
          </div>
        )}
      </div>
    );
  };
  return (
    <div className={styles.gameContainer}>
      {}
      {gameState?.teams?.team1 && renderTeamChat('team1', gameState.teams.team1)}
      {}
      <div className={styles.gameMainArea}>
        {}
        <div className={styles.teamsInfo}>
        {Object.entries(gameState.teams).map(([teamId, team]: [string, Team]) => (
          <div 
            key={teamId}
            className={`${styles.teamInfo} ${currentTeam === teamId ? styles.currentTeam : ''}`}
          >
            <div className={`${styles.teamHeader} ${team.color === 'red' ? styles.teamred : styles.teamblue}`}>
              <h3>{team.name}</h3>
              <div className={styles.teamProgress}>
                {gameState?.teamProgress?.[teamId]?.revealed || 0} / {gameState?.teamProgress?.[teamId]?.total || 0}
              </div>
            </div>
            <div className={styles.teamMembers}>
              <div className={styles.teamMember}>
                <User size={16} />
                <span className={styles.role}>Капитан:</span>
                <span className={styles.playerName}>{getPlayerName(team.captain)}</span>
              </div>
              <div className={styles.teamMember}>
                <Users size={16} />
                <span className={styles.role}>Игрок:</span>
                <span className={styles.playerName}>{getPlayerName(team.player)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {}
      {gameState?.status === 'in_progress' && (
        <div className={styles.timerSection}>
          <div className={`${styles.timer} ${timeRemaining <= 30 ? styles.timerWarning : ''} ${timeRemaining <= 10 ? styles.timerCritical : ''}`}>
            <span className={styles.timerIcon}>⏱️</span>
            <span className={styles.timerText}>Осталось времени: {formatTime(timeRemaining)}</span>
          </div>
        </div>
      )}
      {}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {}
      {gameState?.currentClue && (
        <div className={styles.currentClue}>
          <MessageSquare size={20} />
          <span>Подсказка: <strong>"{gameState.currentClue}"</strong> для <strong>{gameState.currentClueNumber}</strong> слов</span>
          {gameState?.guessesLeft > 0 && (
            <span className={styles.guessesLeft}>
              Осталось попыток: {gameState.guessesLeft}
            </span>
          )}
        </div>
      )}
      {}
      <div className={styles.gameBoard}>
        {gameState.board.map((card: Card) => (
          <button
            key={card.id}
            className={getCardClassName(card)}
            onClick={() => handleCardClick(card.id)}
            disabled={currentPhase !== 'guessing' || !isCurrentPlayer || isCaptain || card.revealed}
          >
            <span className={styles.cardWord}>{card.word}</span>
            {card.revealed && card.type && (
              <div className={styles.cardTypeIndicator}>
                {card.type === 'red' && '🔴'}
                {card.type === 'blue' && '🔵'}
                {card.type === 'neutral' && '⚪'}
                {card.type === 'assassin' && '💀'}
              </div>
            )}
          </button>
        ))}
      </div>
      {}
      <div className={styles.actionsPanel}>
        {}
        {!isCaptain && currentPhase === 'guessing' && isCurrentPlayer && gameState?.canPass && (
          <button 
            onClick={handlePass}
            className={styles.passButton}
          >
            <SkipForward size={20} />
            Пропустить ход
          </button>
        )}
        {}
        <div className={styles.turnInfo}>
          {currentPhase === 'giving_clue' ? (
            <span>
              {isCurrentPlayer ? 'Ваш ход - напишите подсказку в чат команды' : 'Капитан дает подсказку'}
            </span>
          ) : (
            <span>
              {isCurrentPlayer ? 'Ваш ход - выберите карту' : 'Игрок выбирает карту'}
            </span>
          )}
        </div>
        {}
        {isCaptain && (
          <div className={styles.captainHint}>
            <Eye size={16} />
            <span>👑 Капитан: Вы видите цвета всех карт</span>
          </div>
        )}
      </div>
      {}
      {gameState?.gameHistory && gameState.gameHistory.length > 0 && (
        <div className={styles.gameHistory}>
          <h4>История ходов:</h4>
          <div className={styles.historyList}>
            {gameState.gameHistory.slice(-5).reverse().map((entry: any, index: number) => (
              <div key={index} className={styles.historyEntry}>
                {entry.type === 'clue' && (
                  <span>
                    {getTeamDisplayName(entry.team)}: подсказка "{entry.clue}" для {entry.number} слов
                  </span>
                )}
                {entry.type === 'guess' && (
                  <span>
                    {getTeamDisplayName(entry.team)}: выбрал "{entry.word}" 
                    {entry.cardType === 'red' && ' 🔴'}
                    {entry.cardType === 'blue' && ' 🔵'}
                    {entry.cardType === 'neutral' && ' ⚪'}
                    {entry.cardType === 'assassin' && ' 💀'}
                  </span>
                )}
                {entry.type === 'pass' && (
                  <span>
                    {getTeamDisplayName(entry.team)}: пропустил ход
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      {}
      {gameState?.teams?.team2 && renderTeamChat('team2', gameState.teams.team2)}
    </div>
  );
};
export default CodenamesGame;

