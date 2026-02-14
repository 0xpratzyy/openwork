import { Router } from 'express';
import { listRegistryIntegrations, getRegistryIntegration } from '@openwork/core';

export const integrationsRouter = Router();

integrationsRouter.get('/', (_req, res) => {
  try {
    const integrations = listRegistryIntegrations();
    const result = integrations.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      categories: i.categories,
      status: i.status,
      configSchema: i.configSchema,
    }));
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

    // For now, just acknowledge. MCP config writing can be expanded later.
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
