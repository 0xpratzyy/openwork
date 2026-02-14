import { Router } from 'express';
import { loadAllTemplates } from '@openwork/agents';
import { getRegistryIntegration } from '@openwork/core';

export const rolesRouter = Router();

rolesRouter.get('/', (_req, res) => {
  try {
    const templates = loadAllTemplates();
    const roles = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      integrations: t.mcpServers.map((m) => {
        // Enrich with registry data if available
        const registry = getRegistryIntegration(m.id);
        return {
          id: m.id,
          name: registry?.name ?? m.name,
          description: registry?.description ?? undefined,
          npmPackage: registry?.npmPackage ?? undefined,
          transport: registry?.transport ?? undefined,
          configSchema: registry?.configSchema ?? undefined,
          tools: registry?.tools ?? undefined,
          status: registry?.status ?? undefined,
          stars: registry?.stars ?? undefined,
          envKeys: Object.keys(m.env),
        };
      }),
      skills: t.skills,
      tools: t.tools,
    }));
    res.json({ roles });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
