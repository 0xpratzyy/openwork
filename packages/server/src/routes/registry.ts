import { Router } from 'express';
import { listRegistryIntegrations, getRegistryIntegration, searchRegistryIntegrations } from '@openwork/core';

export const registryRouter = Router();

registryRouter.get('/', (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const query = req.query.q as string | undefined;
    const integrations = query
      ? searchRegistryIntegrations(query)
      : listRegistryIntegrations(category);
    res.json({ integrations });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

registryRouter.get('/:id', (req, res) => {
  try {
    const integration = getRegistryIntegration(req.params.id);
    if (!integration) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(integration);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
