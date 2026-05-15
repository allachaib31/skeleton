import express, { Application, Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env.config';
import { globalLimit, corsOptions, helmetOptions } from './config/security.config';
import { sendError, sendSuccess } from './common/responses/api.response';
import { AppError } from './common/errors/AppError';
import { HttpError } from './common/errors/HttpError';
import { languageMiddleware } from './middlewares/language.middleware';
import { translate } from './config/i18n.config';

const app: Application = express();

const mongoSanitizeRequest: RequestHandler = (req, _res, next) => {
  const sanitize = (mongoSanitize as unknown as { sanitize: (target: unknown) => unknown }).sanitize;

  ['body', 'params', 'headers', 'query'].forEach((key) => {
    const target = (req as Request & Record<string, unknown>)[key];

    if (target && typeof target === 'object') {
      sanitize(target);
    }
  });

  next();
};

// Security Middlewares
app.disable('x-powered-by');

if (env.TRUST_PROXY) {
  app.set('trust proxy', /^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY);
}

app.use(languageMiddleware);
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

// Rate limiting
app.use(globalLimit);

// Parse JSON and URLEncoded payloads
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// Data sanitization against NoSQL query injection
app.use(mongoSanitizeRequest);

// Prevent parameter pollution
app.use(hpp());

// Compression
app.use(compression());

// Health Check
app.get(`${env.API_PREFIX}/health`, (req: Request, res: Response) => {
  sendSuccess(res, null, translate('common.api_healthy', req.language));
});

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';

// Swagger documentation
if (env.NODE_ENV !== 'production') {
  app.use(`${env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import rolesRoutes from './modules/roles/roles.routes';
import permissionsRoutes from './modules/permissions/permissions.routes';
import adminRoutes from './modules/admin/admin.routes';
import uploadsRoutes from './modules/uploads/upload.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import i18nRoutes from './modules/i18n/i18n.routes';

app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/users`, usersRoutes);
app.use(`${env.API_PREFIX}/admin/roles`, rolesRoutes);
app.use(`${env.API_PREFIX}/admin/permissions`, permissionsRoutes);
app.use(`${env.API_PREFIX}/admin`, adminRoutes);
app.use(`${env.API_PREFIX}/uploads`, uploadsRoutes);
app.use(`${env.API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${env.API_PREFIX}/i18n`, i18nRoutes);

// Unknown routes handler
app.all('/{*path}', (req: Request, res: Response, next: NextFunction) => {
  next(HttpError.notFound(translate('errors.not_found_path', req.language, { path: req.originalUrl })));
});

// Global Error Handler
import { globalErrorHandler } from './middlewares/error.middleware';
app.use(globalErrorHandler);

export default app;
