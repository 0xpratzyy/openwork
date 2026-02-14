import { Router } from 'express';
import { loadTemplate } from '@openwork/agents';
import {
  generateAgent, generateRouterAgent, dbCreateAgent, createIntegration,
  patchConfig, listAgents, listIntegrations, deleteAllAgents, deleteAllIntegrations,
  removeAgent, deleteAgent,
} from '@openwork/core';
import type { AgentConfig, BindingConfig, GeneratedAgent } from '@openwork/core';

export const setupRouter = Router();

interface SetupBody {
  roles: string[];
  integrations?: Record<string, Record<string, Record<string, string>>>;
}

setupRouter.post('/', async (req, res) => {
  const createdAgentIds: string[] = [];
  try {
    const body = req.body as SetupBody;
    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
      res.status(400).json({ error: 'At least one role must be selected' });
      return;
    }

    const createdAgents: Array<{ id: string; name: string; role: string; action: string }> = [];
    const generatedAgents: GeneratedAgent[] = [];
    const agentConfigs: AgentConfig[] = [];
    const bindingConfigs: BindingConfig[] = [];

    // Check existing agents for reporting
    const existingAgents = listAgents();
    const existingRoles = new Set(existingAgents.map((a: any) => a.role));

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

      // Upsert agent in DB
      const dbAgent = dbCreateAgent({
        id: generated.id,
        role: roleId,
        name: generated.name,
        workspacePath: generated.workspacePath,
      });
      createdAgentIds.push(generated.id);

      const roleIntegrations = body.integrations?.[roleId] ?? {};
      for (const server of template.mcpServers) {
        const config = roleIntegrations[server.id] ?? {};
        createIntegration({
          agentId: generated.id,
          type: server.id,
          configEncrypted: JSON.stringify(config),
        });
      }

      const action = existingRoles.has(roleId) ? 'updated' : 'created';
      agentConfigs.push({ name: generated.id });
      bindingConfigs.push({ agentId: generated.id, channel: 'slack' });
      createdAgents.push({ id: generated.id, name: generated.name, role: roleId, action });
      generatedAgents.push(generated);
    }

    // Always create the router agent after all specialists
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
    agentConfigs.push({ name: routerGenerated.id });
    bindingConfigs.push({ agentId: routerGenerated.id, channel: 'slack' });
    const routerAction = existingRoles.has('router') ? 'updated' : 'created';
    createdAgents.push({ id: routerGenerated.id, name: routerGenerated.name, role: 'router', action: routerAction });

    patchConfig(agentConfigs, bindingConfigs);

    res.json({ success: true, agents: createdAgents });
  } catch (err) {
    // Rollback partially created agents
    for (const id of createdAgentIds) {
      try { deleteAgent(id); } catch { /* best effort */ }
    }
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});

// Reset endpoint — clears all agents and integrations
setupRouter.post('/reset', async (_req, res) => {
  try {
    const agents = listAgents();
    const count = agents.length;

    // Remove agent workspaces
    for (const agent of agents) {
      try {
        await removeAgent(agent.id);
      } catch { /* best effort */ }
    }

    // Clear DB tables (integrations first due to FK)
    deleteAllIntegrations();
    deleteAllAgents();

    res.json({ success: true, removed: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: message });
  }
});
