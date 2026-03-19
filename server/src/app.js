import path from 'node:path';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env, isProduction, uploadsDirectory } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import apiRoutes from './routes/index.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true
    })
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    env.UPLOADS_URL_PATH,
    express.static(path.resolve(uploadsDirectory), {
      fallthrough: true,
      maxAge: isProduction ? '7d' : 0
    })
  );

  app.use('/api', apiRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
