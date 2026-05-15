import { AppError } from './AppError';

export class HttpError {
  static badRequest(message = 'Bad Request', code?: string): AppError {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = 'Unauthorized', code?: string): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Forbidden', code?: string): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Not Found', code?: string): AppError {
    return new AppError(message, 404, code);
  }

  static conflict(message = 'Conflict', code?: string): AppError {
    return new AppError(message, 409, code);
  }

  static internal(message = 'Internal Server Error', code?: string): AppError {
    return new AppError(message, 500, code, false);
  }
}
