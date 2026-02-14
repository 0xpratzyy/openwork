import { Router } from 'express';
import { execSync } from 'node:child_process';
import { listAgents, listIntegrations } from '@openwork/core';

export const statusRouter = Router();

statusRouter.get('/', (_req, res) => {
  let openclawRunning = false;
  try {
    execSync('pgrep -f "openclaw.*gateway" || pgrep -f openclaw', { stdio: 'pipe' });
    openclawRunning = true;
  } catch {
    // also try checking if openclaw gateway responds
    try {
      execSync('openclaw gateway status', { stdio: 'pipe', timeout: 3000 });
      openclawRunning = true;
    } catch {
      openclawRunning = false;
    }
  }

  let agentCount = 0;
  let integrationCount = 0;
  try {
    agentCount = listAgents().length;
    integrationCount = listIntegrations().length;
  } catch {
    // DB might not be initialized yet
  }

  res.json({ openclawRunning, agentCount, integrationCount });
});
