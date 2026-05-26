import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';
import { AppError } from '../common/errors/AppError';
import { sendError } from '../common/responses/api.response';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { translate } from '../config/i18n.config';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  let error = { ...err };
  error.message = err.message;

  if (env.NODE_ENV === 'development' && (!err.isOperational || err.statusCode >= 500)) {
    console.error('ERROR 💥', err);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'Duplicate field value';
    const message = translate('errors.duplicate_field', req.language, { value });
    error = new AppError(message, 400, 'DUPLICATE_KEY');
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = translate('errors.invalid_input', req.language, { details: errors.join('. ') });
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // Mongoose bad ObjectId (CastError)
  if (err instanceof mongoose.Error.CastError) {
    const message = translate('errors.invalid_id', req.language, { path: err.path });
    error = new AppError(message, 400, 'INVALID_ID');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError(translate('errors.invalid_token', req.language), 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError(translate('errors.token_expired', req.language), 401, 'TOKEN_EXPIRED');
  }

  // Zod Errors 
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({ field: issue.path.join('.'), message: translate(issue.message, req.language) }));
    return sendError(res, translate('validation.failed', req.language), errors, 422);
  }

  const statusCode = error.statusCode || 500;

  // Log 500 errors
  if (statusCode === 500) {
    console.error('🔥 FATAL SERVER ERROR:', err);
  }

  if (error instanceof AppError || error.isOperational) {
    sendError(res, translate(error.message, req.language), null, statusCode);
  } else {
    // Programming or other unknown error: don't leak error details
    sendError(
      res,
      env.NODE_ENV === 'production' ? translate('errors.something_wrong', req.language) : translate(error.message, req.language),
      env.NODE_ENV === 'development' ? { stack: err.stack } : null,
      statusCode
    );
  }
};
