import { Router } from 'express';

export const agentsRouter = Router();

agentsRouter.get('/', (_req, res) => {
  res.json({ message: 'agents endpoint — not implemented yet' });
});
