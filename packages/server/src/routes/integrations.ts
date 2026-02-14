import { Router } from 'express';
import { listRegistryIntegrations, getRegistryIntegration, getConfig, setChannel } from '@openwork/core';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const integrationsRouter = Router();

integrationsRouter.get('/', (_req, res) => {
  try {
    const integrations = listRegistryIntegrations();
    const config = getConfig();
    const channels = config.channels || {};

    const result = integrations.map((i: any) => {
      // Check if this is a channel and if it's configured
      let connected = false;
      if (i.isChannel && channels[i.id]) {
        connected = true;
      }
      return {
        id: i.id,
        name: i.name,
        description: i.description,
        categories: i.categories,
        status: i.status,
        configSchema: i.configSchema,
        isChannel: i.isChannel || false,
        connected,
      };
    });
    res.json({ integrations: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

integrationsRouter.post('/:id/configure', (req, res) => {
  try {
    const { id } = req.params;
    const { config } = req.body as { config: Record<string, string> };

    const registry = getRegistryIntegration(id);
    if (!registry) {
      res.status(404).json({ error: `Unknown integration: ${id}` });
      return;
    }

    if ((registry as any).isChannel) {
      // Channel integration — write to openclaw.json channels section
      setChannel(id, config);
      res.json({ success: true, type: 'channel', message: `${registry.name} channel configured. Restart the gateway to apply.` });
      return;
    }

    // MCP integration — write API keys to env file
    const envPath = join(homedir(), '.openclaw', '.secrets', 'api-keys.env');
    let envContent = '';
    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, 'utf-8');
    }

    for (const [key, value] of Object.entries(config)) {
      if (!value) continue;
      // Update existing or append
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    // Ensure directory exists
    const secretsDir = join(homedir(), '.openclaw', '.secrets');
    mkdirSync(secretsDir, { recursive: true });
    writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');

    res.json({ success: true, type: 'mcp', message: `${registry.name} configured.` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
