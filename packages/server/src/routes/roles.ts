import { Router } from 'express';

export const rolesRouter = Router();

rolesRouter.get('/', (_req, res) => {
  res.json({ message: 'roles endpoint — not implemented yet' });
});
