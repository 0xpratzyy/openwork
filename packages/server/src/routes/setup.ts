import { Router } from 'express';

export const setupRouter = Router();

setupRouter.get('/', (_req, res) => {
  res.json({ message: 'setup endpoint — not implemented yet' });
});
