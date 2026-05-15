declare module 'swagger-ui-express';

declare module 'swagger-jsdoc' {
  interface SwaggerDefinition {
    [key: string]: unknown;
  }

  export interface Options {
    definition?: SwaggerDefinition;
    apis?: string[];
    [key: string]: unknown;
  }

  export default function swaggerJsdoc(options?: Options): Record<string, unknown>;
}

declare module '@socket.io/redis-adapter' {
  import type { AdapterConstructor } from 'socket.io-adapter';

  export function createAdapter(pubClient: unknown, subClient: unknown): AdapterConstructor;
}
