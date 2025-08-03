import { FaChess, FaTicketAlt, FaBrain } from 'react-icons/fa';
import { PiCardsFill } from "react-icons/pi";

export const GAMES_CONFIG = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    Icon: FaTicketAlt,
  },
  'chess': {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    Icon: FaChess,
  },
  'quiz': {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    Icon: FaBrain,
  },
  'poker': {
    id: 'poker',
    name: 'Покер "LoveVegas"',
    category: 'Карточные',
    Icon: PiCardsFill,
  }
};

export const GAMES_LIST = Object.values(GAMES_CONFIG);