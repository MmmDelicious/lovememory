import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LeaveGameButton.module.css';

interface LeaveGameButtonProps {
  gameType: string;
}

const LeaveGameButton: React.FC<LeaveGameButtonProps> = ({ gameType }) => {
  const navigate = useNavigate();
  const handleLeave = () => {
    navigate(`/games/${gameType}`);
  };
  return (
    <button onClick={handleLeave} className={styles.leaveButton}>
      Выйти из игры
    </button>
  );
};
export default LeaveGameButton;
