import { Router } from 'express';
import { loadTemplate } from '@openwork/agents';
import { generateAgent, generateRouterAgent, dbCreateAgent, createIntegration, patchConfig } from '@openwork/core';
import type { AgentConfig, BindingConfig, GeneratedAgent } from '@openwork/core';

export const setupRouter = Router();

interface SetupBody {
  roles: string[];
  integrations?: Record<string, Record<string, Record<string, string>>>;
}

setupRouter.post('/', async (req, res) => {
  try {
    const body = req.body as SetupBody;
    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
      res.status(400).json({ error: 'At least one role must be selected' });
      return;
    }

    const createdAgents: Array<{ id: string; name: string; role: string }> = [];
    const generatedAgents: GeneratedAgent[] = [];
    const agentConfigs: AgentConfig[] = [];
    const bindingConfigs: BindingConfig[] = [];

    for (const roleId of body.roles) {
      const template = loadTemplate(roleId);

      // Generate agent workspace
      let generated;
      try {
        generated = await generateAgent(template);
      } catch (err: any) {
        // If workspace exists, skip create
        if (err.message?.includes('already exists')) {
          generated = await generateAgent(template, { skipCreate: true });
        } else {
          throw err;
        }
      }

      // Store agent in DB
      const dbAgent = dbCreateAgent({
        id: generated.id,
        role: roleId,
        name: generated.name,
        workspacePath: generated.workspacePath,
      });

      // Store integrations
      const roleIntegrations = body.integrations?.[roleId] ?? {};
      for (const server of template.mcpServers) {
        const config = roleIntegrations[server.id] ?? {};
        createIntegration({
          agentId: generated.id,
          type: server.id,
          configEncrypted: JSON.stringify(config),
        });
      }

      agentConfigs.push({ name: generated.id });
      bindingConfigs.push({ agentId: generated.id, channel: 'slack' });
      createdAgents.push({ id: generated.id, name: generated.name, role: roleId });
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
    agentConfigs.push({ name: routerGenerated.id });
    bindingConfigs.push({ agentId: routerGenerated.id, channel: 'slack' });
    createdAgents.push({ id: routerGenerated.id, name: routerGenerated.name, role: 'router' });

    // Patch openclaw.json
    patchConfig(agentConfigs, bindingConfigs);

    res.json({ success: true, agents: createdAgents });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
