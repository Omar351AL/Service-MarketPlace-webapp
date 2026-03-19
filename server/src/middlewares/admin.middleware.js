import { ApiError } from '../utils/ApiError.js';

export const requireAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new ApiError(403, 'Admin access required.'));
  }

  return next();
};
