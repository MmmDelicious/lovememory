// Переиспользуемые компоненты игр с простой логикой
export { default as GamesList } from './GamesList/GamesList';
export { default as CategoriesFilter } from './CategoriesFilter/CategoriesFilter';
export { default as FeaturedGames } from './FeaturedGames/FeaturedGames';
export { default as TournamentCard } from './TournamentCard/TournamentCard';

// Игровые компоненты (только отображение, без бизнес-логики)
export { TicTacToeBoard } from './TicTacToeBoard/TicTacToeBoard';
export { GameHeader } from './GameHeader/GameHeader';
export { GameResult } from './GameResult/GameResult';

// Компоненты, которые будут добавлены позже:
// export { ChessBoard } from './ChessBoard/ChessBoard';
// export { ChessPlayerInfo } from './ChessPlayerInfo/ChessPlayerInfo';
// export { ChessGameControls } from './ChessGameControls/ChessGameControls';
// export { QuizQuestion } from './QuizQuestion/QuizQuestion';
// export { QuizProgress } from './QuizProgress/QuizProgress';
// export { QuizResults } from './QuizResults/QuizResults';
// export { MemoryBoard } from './MemoryBoard/MemoryBoard';
// export { MemoryControls } from './MemoryControls/MemoryControls';
// export { MemoryStats } from './MemoryStats/MemoryStats';
