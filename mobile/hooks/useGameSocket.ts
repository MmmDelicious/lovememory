import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';

export type GameState = any;

export function useGameSocket(roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [newHandStarted, setNewHandStarted] = useState(false);
  const prevStateRef = useRef<GameState | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [lastActionByPlayer, setLastActionByPlayer] = useState<Record<string, string>>({});
  const [turnStartMs, setTurnStartMs] = useState<number | null>(null);
  const [turnProgress, setTurnProgress] = useState<number>(0);

  useEffect(() => {
    if (!roomId) return;
    (async () => {
      const socket = await getSocket();
      socketRef.current = socket;

      const onConnect = () => {
        setIsConnected(true);
        socket.emit('join_room', roomId);
        // Запросим состояние на случай, если сервер не отправил сразу
        socket.emit('get_game_state', roomId);
      };
      const onDisconnect = () => setIsConnected(false);
      const onState = (state: GameState) => {
        try {
          // Heuristic mini-log for poker
          if (prevStateRef.current && state?.gameType === 'poker') {
            const prev = prevStateRef.current;
            const prevPlayers = prev.players || [];
            const currPlayers = state.players || [];
            // find diffs per player
            for (let i = 0; i < currPlayers.length; i++) {
              const c = currPlayers[i];
              const p = prevPlayers.find((x: any) => String(x.id) === String(c.id));
              if (!p) continue;
              // fold
              if (p.inHand && !c.inHand) {
                setActionLog((l) => [`${c.name || c.id}: Fold`, ...l].slice(0, 8));
                setLastActionByPlayer((m) => ({ ...m, [String(c.id)]: 'Fold' }));
                break;
              }
              // bet/call/raise
              if ((c.currentBet || 0) > (p.currentBet || 0)) {
                const delta = (c.currentBet || 0) - (p.currentBet || 0);
                // rough guess: if delta >= (state.callAmount || 0) and p.currentBet < Math.max(...prevPlayers.map((pp:any)=>pp.currentBet||0)) => raise
                const prevMaxBet = Math.max(0, ...prevPlayers.map((pp: any) => pp.currentBet || 0));
                const nowMaxBet = Math.max(0, ...currPlayers.map((pp: any) => pp.currentBet || 0));
                const action = nowMaxBet > prevMaxBet && c.currentBet === nowMaxBet ? 'Raise' : (delta > 0 ? 'Call' : 'Bet');
                setActionLog((l) => [`${c.name || c.id}: ${action} ${delta}`, ...l].slice(0, 8));
                setLastActionByPlayer((m) => ({ ...m, [String(c.id)]: `${action} ${delta}` }));
                break;
              }
              // check (current changed but bet same)
              if (prev.currentPlayerId !== state.currentPlayerId && c.currentBet === p.currentBet) {
                // emit once per turn change
                // determine who moved: prev.currentPlayerId
                const mover = currPlayers.find((x: any) => String(x.id) === String(prev.currentPlayerId));
                if (mover) {
                  setActionLog((l) => [`${mover.name || mover.id}: Check`, ...l].slice(0, 8));
                  setLastActionByPlayer((m) => ({ ...m, [String(mover.id)]: 'Check' }));
                }
                break;
              }
            }
          }
        } catch {}
        // Track turn start BEFORE updating prevState
        if (state?.currentPlayerId && state?.currentPlayerId !== prevStateRef.current?.currentPlayerId) {
          setTurnStartMs(Date.now());
        }
        prevStateRef.current = state;
        setGameState(state);
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('game_update', onState);
      socket.on('game_start', onState);
      socket.on('game_end', onState);
      socket.on('new_hand_started', () => {
        setNewHandStarted(true);
        setTimeout(() => setNewHandStarted(false), 2000);
      });

      if (socket.connected) onConnect();
    })();

    return () => {
      const socket = socketRef.current;
      if (!socket) return;
      // notify server we are leaving this room
      try { socket.emit('leave_room', roomId); } catch {}
      socket.off('game_update');
      socket.off('game_start');
      socket.off('game_end');
      socket.off('new_hand_started');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [roomId]);

  const makeMove = (move: any) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('make_move', { roomId, move });
  };

  const rebuy = () => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('rebuy', { roomId });
  };

  // progress timer for active turn (30s like server)
  useEffect(() => {
    const id = setInterval(() => {
      if (!turnStartMs) {
        setTurnProgress(0);
        return;
      }
      const elapsed = Date.now() - turnStartMs;
      setTurnProgress(Math.max(0, Math.min(1, elapsed / 30000)));
    }, 200);
    return () => clearInterval(id);
  }, [turnStartMs]);

  return { isConnected, gameState, makeMove, rebuy, newHandStarted, actionLog, lastActionByPlayer, turnProgress };
}


