import { Server } from 'socket.io';

import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { parseBearerToken, verifyAccessToken } from '../services/jwt.service.js';

import { registerChatHandlers } from './chat.socket.js';

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const handshakeToken = socket.handshake.auth?.token || socket.handshake.headers.authorization;
    const token = parseBearerToken(handshakeToken) || handshakeToken;

    if (!token) {
      return next(new Error('Authentication required.'));
    }

    (async () => {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          name: true,
          status: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        return next(new Error('Authentication required.'));
      }

      socket.data.user = user;
      return next();
    })().catch(() => next(new Error('Authentication required.')));
  });

  io.on('connection', (socket) => {
    registerChatHandlers(io, socket);
  });

  return io;
};
