import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { sendError } from '../common/responses/api.response';

export const validate = (schema: ZodType, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req[target]);
      
      if (!result.success) {
        const errors = result.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        sendError(res, 'Validation failed', errors, 422);
        return;
      }
      
      // Express exposes req.query as a getter in newer versions, so direct assignment can fail.
      if (target === 'query') {
        Object.defineProperty(req, 'query', {
          value: result.data,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      } else {
        req[target] = result.data as Request[typeof target];
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
