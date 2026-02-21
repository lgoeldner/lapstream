import cors from 'cors';
import express, { type Express } from 'express';
import {
  assignPlayerToSlotController,
  registerPlayerController,
  removePlayerFromSlotController
} from './controllers/playerAdmin.controller.js';

export const buildApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => res.json({ service: 'lapstream-server', ok: true }));

  app.post('/register_user', registerPlayerController);
  app.post('/assign_player', assignPlayerToSlotController);
  app.post('/remove_player', removePlayerFromSlotController);

  return app;
};
