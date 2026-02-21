import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';
import { env } from './env.js';

export type DbClient = NodePgDatabase<typeof schema>;

export const db: DbClient = drizzle(env.DATABASE_URL, { schema });
