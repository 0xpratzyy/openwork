import { Router } from 'express';
import { listIntegrations, getIntegration, updateIntegration } from '@openwork/core';

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
    const { config } = req.body as { agentId?: string; config: Record<string, string> };

    const existing = getIntegration(id);
    if (!existing) {
      res.status(404).json({ error: 'Integration not found' });
      return;
    }

    updateIntegration(id, {
      configEncrypted: JSON.stringify(config),
      status: 'configured',
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
