import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './logger.js';
import { doSync } from './config/slotsync.js';
import { input } from '@inquirer/prompts'

const start = async (): Promise<void> => {
    // sync up the server side config with the database state
    await doSync();

    const app = buildApp();


    const server = app.listen(env.PORT, env.HOST, () => {
        logger.info(`lapstream-server listening on http://${env.HOST}:${env.PORT}`);
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
    if (error instanceof Error) {
        logger.error({ err: error }, 'failed to start server');
    } else {
        logger.error({ err: String(error) }, 'failed to start server');
    }
    process.exit(1);
});

