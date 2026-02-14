import { Router } from 'express';
import { listTasks, getAuditLog } from '@openwork/core';

export const tasksRouter = Router();

tasksRouter.get('/', (_req, res) => {
  try {
    const agentId = _req.query.agentId as string | undefined;
    const tasks = listTasks(agentId);
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

tasksRouter.get('/audit', (_req, res) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 100;
    const logs = getAuditLog(limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
