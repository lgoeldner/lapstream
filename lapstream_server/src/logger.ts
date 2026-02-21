import pino from 'pino';

const transport = process.env.NODE_ENV === 'production'
  ? undefined
  : pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  });

export const logger: pino.Logger<string, boolean> = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info'
  },
  transport
);
