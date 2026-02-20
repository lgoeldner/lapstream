import cors from 'cors';
import express, { type Express } from 'express';
import { usersTable } from './db/schema.js';
import { z } from 'zod';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const newUserSchema = z.object({
  name: z.string(),
  age: z.int(),
});

type AppDeps = { db: NodePgDatabase };

export const buildApp = (deps: AppDeps): Express => {
  const { db } = deps;
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({ service: 'lapstream-server', ok: true });
  });

  app.post('/new_user', async (req, res) => {
    const p = newUserSchema.safeParse(req.body);
    console.log(p);
    if (p.success) {
      const to_insert: typeof usersTable.$inferInsert = p.data;
      const r = await db
        .insert(usersTable)
        .values(to_insert)
        .returning({ id: usersTable.id });

      return res.status(201).json({ 'status': 'success', id: r[0]?.id });
    }

    return res.status(500).json({ 'status': 'failure', err: p.error });
  })

  return app;
};
