import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

const options: import('swagger-jsdoc').Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Production Backend API',
      version: '1.0.0',
      description: 'API Documentation for the production-ready Node.js + Express + TypeScript backend skeleton',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
