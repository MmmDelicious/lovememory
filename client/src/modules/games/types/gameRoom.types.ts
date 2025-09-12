export interface GameState {
  status: 'waiting' | 'in_progress' | 'finished';
  gameType: string;
  currentPlayerId: string;
  currentPlayer: string;
  currentTeam?: string;
  currentPhase?: string;
  playerRole?: {
    team: string;
    role: string;
  };
  winner?: {
    playerId: string;
    name: string;
  };
  players?: Array<{
    id: string;
    name: string;
  }>;
}

export interface GameRoomProps {
  roomId: string;
  gameState: GameState;
  user: any;
  makeMove: (move: any) => void;
  onReturnToLobby: () => void;
}
