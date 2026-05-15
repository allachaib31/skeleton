import { Response } from 'express';
import { translate } from '../../config/i18n.config';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta: Record<string, unknown> | null;
  errors: unknown | null;
}

export const sendSuccess = <T = unknown>(
  res: Response,
  data: T | null = null,
  message = translate('common.operation_successful'),
  meta: Record<string, unknown> | null = null,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
    errors: null,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message = translate('common.operation_failed'),
  errors: unknown = null,
  statusCode = 400
): void => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    data: null,
    meta: null,
    errors,
  };
  res.status(statusCode).json(response);
};
