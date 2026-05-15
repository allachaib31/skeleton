import { z } from 'zod';

const envSchema = z.object({
  VITE_ENV: z.string().optional(),
  VITE_APP_NAME: z.string().min(1),
  VITE_APP_URL: z.string().url(),
  VITE_API_BASE_URL: z.string().url(),
  VITE_SOCKET_URL: z.string().url(),
  VITE_DEFAULT_LANGUAGE: z.string().min(2).max(5),
  VITE_ENABLE_SEO: z.string().transform((val) => val === 'true'),
  VITE_ENABLE_ANALYTICS: z.string().transform((val) => val === 'true'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    const missingVars = result.error.errors.map((err) => err.path.join('.')).join(', ');
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error(`Invalid environment variables: ${missingVars}. Check your .env file.`);
  }

  return result.data;
};

export const env = parseEnv();

// Type declaration for Vite env
declare global {
  interface ImportMetaEnv extends z.infer<typeof envSchema> {}
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
