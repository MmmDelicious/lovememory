import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';
import { getToken } from './auth.service';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket && socket.connected) return socket;
  const token = await getToken();
  socket = io(SOCKET_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    auth: token ? { token } : undefined,
  });
  return socket;
}

