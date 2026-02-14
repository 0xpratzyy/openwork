import { Router } from 'express';
import { execSync } from 'node:child_process';
import { listAgents } from '@openwork/core';

export const statusRouter = Router();

statusRouter.get('/', (_req, res) => {
  let openclawRunning = false;
  try {
    execSync('pgrep -f "openclaw.*gateway" || pgrep -f openclaw', { stdio: 'pipe' });
    openclawRunning = true;
  } catch {
    try {
      execSync('openclaw gateway status', { stdio: 'pipe', timeout: 3000 });
      openclawRunning = true;
    } catch {
      openclawRunning = false;
    }
  }

  let agents: Array<{ id: string; role: string; name: string; status: string }> = [];
  try {
    agents = listAgents().map((a) => ({ id: a.id, role: a.role, name: a.name, status: a.status }));
  } catch { /* ignore */ }

  res.json({ openclawRunning, agentCount: agents.length, integrationCount: 0, agents });
});
