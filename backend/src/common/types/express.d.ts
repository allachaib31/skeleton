import mongoose from 'mongoose';

export {};

type RequestLanguage = 'en' | 'fr' | 'ar';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        permissions: string[];
      };
      language?: RequestLanguage;
      requestId?: string;
      session?: mongoose.ClientSession;
    }
  }
}
