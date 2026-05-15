import { Request, Response, NextFunction } from 'express';
import { resolveLanguage } from '../config/i18n.config';

export const languageMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const acceptLanguage = req.headers['accept-language'];
  req.language = resolveLanguage(Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage) as 'en' | 'fr' | 'ar';
  next();
};
