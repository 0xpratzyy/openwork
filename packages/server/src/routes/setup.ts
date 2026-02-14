import { Router } from 'express';
import { loadTemplate } from '@openwork/agents';
import {
  generateAgent, generateRouterAgent, dbCreateAgent,
  patchConfig, listAgents, removeAgent, removeAllAgents,
} from '@openwork/core';
import type { AgentEntry, BindingEntry, GeneratedAgent } from '@openwork/core';

export const setupRouter = Router();

interface SetupBody {
  roles: string[];
  integrations?: Record<string, Record<string, Record<string, string>>>;
}

setupRouter.post('/', async (req, res) => {
  const createdAgentIds: string[] = [];
  const setupTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ success: false, error: 'Setup timed out after 120 seconds. Check if OpenClaw is running.' });
    }
  }, 120000);

  try {
    const body = req.body as SetupBody;
    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
      res.status(400).json({ error: 'At least one role must be selected' });
      return;
    }

    const createdAgents: Array<{ id: string; name: string; role: string; action: string }> = [];
    const generatedAgents: GeneratedAgent[] = [];
    const agentConfigs: Array<{ id: string; workspace?: string; [key: string]: unknown }> = [];
    const bindingConfigs: BindingEntry[] = [];

    const existingAgents = listAgents();
    const existingRoles = new Set(existingAgents.map((a) => a.role));

    for (const roleId of body.roles) {
      const template = loadTemplate(roleId);

      let generated;
      try {
        generated = await generateAgent(template);
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          generated = await generateAgent(template, { skipCreate: true });
        } else {
          throw err;
        }
      }

      dbCreateAgent({
        id: generated.id,
        role: roleId,
        name: generated.name,
        workspacePath: generated.workspacePath,
      });
      createdAgentIds.push(generated.id);

      const action = existingRoles.has(roleId) ? 'updated' : 'created';
      agentConfigs.push({ id: generated.id, workspace: generated.workspacePath });
      bindingConfigs.push({ agentId: generated.id, match: { channel: 'slack' } });
      createdAgents.push({ id: generated.id, name: generated.name, role: roleId, action });
      generatedAgents.push(generated);
    }

    let routerGenerated;
    try {
      routerGenerated = await generateRouterAgent(generatedAgents, { channel: 'slack' });
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        routerGenerated = await generateRouterAgent(generatedAgents, { channel: 'slack' }, { skipCreate: true });
      } else {
        throw err;
      }
    }
    dbCreateAgent({
      id: routerGenerated.id,
      role: 'router',
      name: routerGenerated.name,
      workspacePath: routerGenerated.workspacePath,
    });
    createdAgentIds.push(routerGenerated.id);
    agentConfigs.push({ id: routerGenerated.id, workspace: routerGenerated.workspacePath });
    bindingConfigs.push({ agentId: routerGenerated.id, match: { channel: 'slack' } });
    const routerAction = existingRoles.has('router') ? 'updated' : 'created';
    createdAgents.push({ id: routerGenerated.id, name: routerGenerated.name, role: 'router', action: routerAction });

    patchConfig(agentConfigs, bindingConfigs);

    clearTimeout(setupTimeout);
    res.json({ success: true, agents: createdAgents });
  } catch (err) {
    for (const id of createdAgentIds) {
      try { removeAgent(id); } catch { /* best effort */ }
    }
    clearTimeout(setupTimeout);
    const message = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: message });
    }
  }
});

setupRouter.post('/reset', async (_req, res) => {
  try {
    const agents = listAgents();
    const count = agents.length;

    for (const agent of agents) {
      try {
        await removeAgent(agent.id);
      } catch { /* best effort */ }
    }

    removeAllAgents();

    res.json({ success: true, removed: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});
