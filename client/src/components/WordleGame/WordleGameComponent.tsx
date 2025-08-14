import React, { useEffect, useState } from 'react';
import styles from './WordleGameComponent.module.css';
import { User } from 'lucide-react';

const KEYBOARD_ROWS = [
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю', 'Э']
];

type LetterStatus = 'correct' | 'present' | 'absent' | 'default';

function WordGrid({ guesses, currentGuess, targetWord, guessedLetters }: { guesses: string[], currentGuess: string, targetWord: string, guessedLetters: Record<string, LetterStatus> }) {
    const getLetterStatus = (letter: string, position: number): LetterStatus => {
        if (targetWord[position] === letter) return 'correct';
        if (targetWord.includes(letter)) return 'present';
        return 'absent';
    };

    const renderRow = (guess: string, rowIndex: number, isCurrentRow = false) => {
        const letters = isCurrentRow ? currentGuess.padEnd(5, ' ').split('') : guess.split('');
        
        return (
            <div key={isCurrentRow ? `current-${rowIndex}` : rowIndex} className={styles.wordRow}>
                {letters.map((letter, index) => {
                    let statusClass = '';
                    if (!isCurrentRow) {
                        const status = getLetterStatus(letter, index);
                        if (status === 'correct') statusClass = styles.correctCell;
                        else if (status === 'present') statusClass = styles.presentCell;
                        else if (status === 'absent') statusClass = styles.absentCell;
                    }

                    return (
                        <div key={index} className={`${styles.letterCell} ${statusClass} ${isCurrentRow && letter !== ' ' ? styles.filledCell : ''}`}>
                            <span className={`${styles.letterText} ${statusClass ? styles.letterTextWhite : ''}`}>{letter}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={styles.wordGrid}>
            {guesses.map((guess, index) => renderRow(guess, index))}
            {guesses.length < 6 && renderRow('', guesses.length, true)}
            {Array.from({ length: Math.max(0, 5 - guesses.length) }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.wordRow}>
                    {Array.from({ length: 5 }).map((_, j) => <div key={j} className={styles.letterCell}></div>)}
                </div>
            ))}
        </div>
    );
}


function Keyboard({ onKeyPress, guessedLetters }: { onKeyPress: (key: string) => void, guessedLetters: Record<string, LetterStatus> }) {
    return (
        <div className={styles.keyboard}>
            {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.keyboardRow}>
                    {rowIndex === 2 && <button className={`${styles.key} ${styles.actionKey}`} onClick={() => onKeyPress('ENTER')}><span className={styles.actionKeyText}>ВВОД</span></button>}
                    {row.map((key) => (
                        <button
                            key={key}
                            className={`${styles.key} ${guessedLetters[key] === 'correct' ? styles.correctKey : ''} ${guessedLetters[key] === 'present' ? styles.presentKey : ''} ${guessedLetters[key] === 'absent' ? styles.absentKey : ''}`}
                            onClick={() => onKeyPress(key)}
                        >
                            <span className={`${styles.keyText} ${guessedLetters[key] ? styles.keyTextWhite : ''}`}>{key}</span>
                        </button>
                    ))}
                    {rowIndex === 2 && <button className={`${styles.key} ${styles.actionKey}`} onClick={() => onKeyPress('BACKSPACE')}><span className={styles.actionKeyText}>←</span></button>}
                </div>
            ))}
        </div>
    );
}

function PlayerStats({ name, score, isLeading }: { name: string, score: number, isLeading: boolean }) {
    return (
        <div className={`${styles.playerStats} ${isLeading ? styles.leadingPlayer : ''}`}>
            <div className={styles.playerStatsGradient} style={{ background: isLeading ? 'linear-gradient(180deg, #D97A6C 0%, #E89F93 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F6 100%)' }}>
                <div className={styles.playerStatsHeader}>
                    <div className={styles.playerInfo}>
                        <div className={styles.playerAvatar} style={{ backgroundColor: isLeading ? 'rgba(255,255,255,0.2)' : '#EADFD8' }}><User size={16} color={isLeading ? '#FFFFFF' : '#D97A6C'} strokeWidth={2}/></div>
                        <div>
                            <div className={styles.playerName} style={{ color: isLeading ? '#FFFFFF' : '#4A3F3D' }}>{name}</div>
                            <div className={styles.playerScore} style={{ color: isLeading ? 'rgba(255,255,255,0.8)' : '#8C7F7D' }}>{score} слов</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface WordleGameProps {
  gameState: any;
  makeMove: (move: { guess: string }) => void;
  user: { id: string };
}

const WordleGameComponent: React.FC<WordleGameProps> = ({ gameState, makeMove, user }) => {
    const [currentGuess, setCurrentGuess] = useState('');
    
    const handleKeyPress = (key: string) => {
        if (gameState.status !== 'in_progress') return;
        if (key === 'BACKSPACE') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (key === 'ENTER') {
            if (currentGuess.length === 5) {
                makeMove({ guess: currentGuess });
                setCurrentGuess('');
            }
        } else if (currentGuess.length < 5 && /^[А-ЯЁ]$/.test(key.toUpperCase())) {
            setCurrentGuess(prev => prev + key.toUpperCase());
        }
    };
    
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace') handleKeyPress('BACKSPACE');
            else if (e.key === 'Enter') handleKeyPress('ENTER');
            else if (/^[а-яА-ЯёЁ]$/.test(e.key) && e.key.length === 1) handleKeyPress(e.key.toUpperCase());
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [currentGuess, gameState.status]);

    if (!gameState || !gameState.playerState || !gameState.opponentState) {
        return <div className={styles.container}>Загрузка Wordle...</div>;
    }

    const { playerState, opponentState } = gameState;
    
    return (
        <div className={styles.container}>
            <div className={styles.playersContainer}>
                <PlayerStats name="Вы" score={playerState.score} isLeading={playerState.score >= opponentState.score} />
                <PlayerStats name="Соперник" score={opponentState.score} isLeading={opponentState.score > playerState.score} />
            </div>
            <div className={styles.gameArea}>
                <WordGrid 
                    guesses={playerState.guesses} 
                    currentGuess={currentGuess}
                    targetWord={playerState.targetWord} 
                    guessedLetters={playerState.guessedLetters}
                />
            </div>
            <Keyboard onKeyPress={handleKeyPress} guessedLetters={playerState.guessedLetters} />
        </div>
    );
};

export default WordleGameComponent;