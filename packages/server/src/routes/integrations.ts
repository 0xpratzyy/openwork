import { Router } from 'express';

export const integrationsRouter = Router();

integrationsRouter.get('/', (_req, res) => {
  res.json({ message: 'integrations endpoint — not implemented yet' });
});
