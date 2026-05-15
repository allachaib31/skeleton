import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const withTransaction = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    req.session = session;
    
    try {
      await fn(req, res, next);
      
      if (!session.hasEnded) {
        await session.commitTransaction();
        session.endSession();
      }
    } catch (error) {
      if (!session.hasEnded) {
        await session.abortTransaction();
        session.endSession();
      }
      next(error);
    }
  };
};
