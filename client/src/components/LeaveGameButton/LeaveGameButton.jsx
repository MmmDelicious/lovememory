import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import styles from './LeaveGameButton.module.css';

const LeaveGameButton = ({ gameType }) => {
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

LeaveGameButton.propTypes = {
  gameType: PropTypes.string.isRequired,
};

export default LeaveGameButton;