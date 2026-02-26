import cors from 'cors';
import express, { type Express } from 'express';
import { receptionRouter } from './routes/lane.routes.js';
import { playerRouter } from './routes/player.routes.js';
import { httpLogger } from './middleware/httpLogger.js';
import { authRouter } from './routes/auth.routes.js';

export const buildApp = (): Express => {
  const app = express();

  app.use(httpLogger);
  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => res.json({ service: 'lapstream-server', ok: true }));
  app.use('/reception', receptionRouter);
  app.use('/player', playerRouter);
  app.use('/auth', authRouter);

  return app;
};
