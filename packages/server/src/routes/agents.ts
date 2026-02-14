import { Router } from 'express';
import { listAgents, removeAgentFromConfig, removeAgent } from '@openwork/core';

export const agentsRouter = Router();

agentsRouter.get('/', (_req, res) => {
  try {
    const agents = listAgents();
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

agentsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Remove workspace and OpenClaw config
    await removeAgent(id);
    // Remove from openclaw.json
    removeAgentFromConfig(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
