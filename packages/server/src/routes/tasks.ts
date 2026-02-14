import { Router } from 'express';

export const tasksRouter = Router();

// Tasks are in-memory for now (no DB)
tasksRouter.get('/', (_req, res) => {
  res.json({ tasks: [] });
});

tasksRouter.get('/audit', (_req, res) => {
  res.json({ logs: [] });
});
