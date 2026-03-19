import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const resolveSocketUrl = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:4000';
  }
};

export const createChatSocket = (token) =>
  io(resolveSocketUrl(), {
    transports: ['websocket'],
    auth: {
      token: `Bearer ${token}`
    }
  });
