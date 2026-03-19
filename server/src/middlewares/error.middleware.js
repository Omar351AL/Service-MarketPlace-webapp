import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';

import { isProduction } from '../config/env.js';

export const errorMiddleware = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: error.flatten()
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'A record with one of these values already exists.'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        message: 'The requested record could not be found.'
      });
    }
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: error.message
    });
  }

  return res.status(statusCode).json({
    message,
    details: error.details ?? null,
    stack: isProduction ? undefined : error.stack
  });
};
