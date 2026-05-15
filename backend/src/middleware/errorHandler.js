// src/middleware/errorHandler.js

/**
 * Global Express error handler.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err.message);
  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message ?? 'Internal server error',
  });
}