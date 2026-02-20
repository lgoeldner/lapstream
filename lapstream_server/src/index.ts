import { buildApp } from './app.js';
import { env } from './config/env.js';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import { usersTable } from './db/schema.js'

const start = async (): Promise<void> => {
    const db = drizzle(env.DATABASE_URL);

    const app = buildApp({ db });

    const server = app.listen(env.PORT, env.HOST, () => {
        console.log(`lapstream-server listening on http://${env.HOST}:${env.PORT}`);
    });

    const shutdown = async (): Promise<void> => {
        server.close(async () => {
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

start().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
