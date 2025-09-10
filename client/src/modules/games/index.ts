// Games module exports - основные экспорты
export { default as GamesPage } from './pages/GamesPage/GamesPage'
export { default as GameLobbyPage } from './pages/GameLobbyPage/GameLobbyPage'
export { default as GameRoomPage } from './pages/GameRoomPage/GameRoomPage'
export { default as PokerPage } from './pages/PokerPage/PokerPage'
export { default as TournamentPage } from './pages/TournamentPage/TournamentPage'
export { default as TournamentsPage } from './pages/TournamentsPage/TournamentsPage'

export { default as ChessGame } from './components/ChessGame/ChessGame'
export { default as PokerGame } from './components/PokerGame/PokerGame'
export { default as QuizGame } from './components/QuizGame/QuizGame'

export { useGameLobby } from './hooks/useGameLobby'
export { useGameSocket } from './hooks/useGameSocket'

export { gameSlice } from './store/gameSlice'
