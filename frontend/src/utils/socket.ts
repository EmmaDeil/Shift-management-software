import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(token?: string) {
  if (socket) return socket;

  const base = import.meta.env.VITE_API_WS_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/.+$/, '') : 'http://localhost:5000');

  socket = io(base, {
    auth: {
      token: token || localStorage.getItem('token') || undefined,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.debug('Socket connected', socket?.id);
  });

  socket.on('disconnect', () => {
    console.debug('Socket disconnected');
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { initSocket, getSocket, disconnectSocket };
