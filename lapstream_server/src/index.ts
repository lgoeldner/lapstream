import { buildApp } from './app.js';
import { env } from './config/env.js';
import { doSync } from './config/slotsync.js';

const start = async (): Promise<void> => {
    // sync up the server side config with the database state
    await doSync();

    const app = buildApp();
    

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
