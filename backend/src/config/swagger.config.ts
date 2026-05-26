import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

const options: import('swagger-jsdoc').Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'tafa3olcard Backend API',
      version: '1.0.0',
      description: 'API Documentation for the tafa3olcard backend',
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
