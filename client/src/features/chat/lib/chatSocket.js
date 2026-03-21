import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const resolveSocketUrl = () => {
  if (!API_BASE_URL) {
    return window.location.origin;
  }

  if (API_BASE_URL.startsWith('/')) {
    return window.location.origin;
  }

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
};

export const createChatSocket = (token) =>
  io(resolveSocketUrl(), {
    path: '/socket.io/',
    transports: ['websocket'],
    auth: {
      token: `Bearer ${token}`
    }
  });
