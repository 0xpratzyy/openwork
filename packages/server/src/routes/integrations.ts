import { Router } from 'express';
import { listIntegrations, createIntegration, updateIntegration } from '@openwork/core';

export const integrationsRouter = Router();

integrationsRouter.get('/', (_req, res) => {
  try {
    const integrations = listIntegrations();
    const result = integrations.map((i: any) => ({
      id: i.id,
      agentId: i.agentId,
      type: i.type,
      status: i.status,
      hasConfig: !!i.configEncrypted && i.configEncrypted !== '{}',
    }));
    res.json({ integrations: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

integrationsRouter.post('/:id/configure', (req, res) => {
  try {
    const { id } = req.params;
    const { config, agentId } = req.body as { agentId?: string; config: Record<string, string> };

    // Try to find existing integration by type
    const integrations = listIntegrations();
    const existing = integrations.find((i: any) => i.type === id || i.id === id);

    if (existing) {
      // Update existing
      updateIntegration(existing.id, {
        configEncrypted: JSON.stringify(config),
        status: 'configured',
      });
    } else {
      // Create new integration
      createIntegration({
        agentId: agentId || 'unassigned',
        type: id,
        configEncrypted: JSON.stringify(config),
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
