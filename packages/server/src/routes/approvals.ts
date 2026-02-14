import { Router } from 'express';

export const approvalsRouter = Router();

approvalsRouter.get('/', (_req, res) => {
  res.json({ message: 'approvals endpoint — not implemented yet' });
});
