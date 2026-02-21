import cors from 'cors';
import express, { type Express } from 'express';
import {
  assignPlayerToSlotController,
  getPlayerSlotsController,
  registerPlayerController,
  removePlayerFromSlotController
} from './controllers/playerAdmin.controller.js';
import { playerRouter } from './routes/player.routes.js';
import { slotRouter } from './routes/slots.routes.js';
import { httpLogger } from './middleware/httpLogger.js';

export const buildApp = (): Express => {
  const app = express();

  app.use(httpLogger);
  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => res.json({ service: 'lapstream-server', ok: true }));
  app.use('/player', playerRouter);
  app.use('/slots', slotRouter);

  return app;
};
