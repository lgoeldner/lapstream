import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { z } from 'zod';


dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string(),
  CONFIG_PATH: z.string(),
  ADMIN_API_TOKEN: z.string().transform(it => Buffer.from(it, 'utf8')),
  JWT_SECRET: z.string().transform(it => new Uint8Array(Buffer.from(it, 'base64'))),
  REFRESH_TOKEN_PEPPER: z.string().transform(it => Buffer.from(it, 'base64'))
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(process.env);

const serverConfigSchema = z.object({
  paceGroups: z.array(z.object({
    name: z.string(),
    count: z.int().min(1).max(64)
  }))
});


export const serverConfig = serverConfigSchema.parse(JSON.parse(readFileSync(env.CONFIG_PATH, "ascii")));
