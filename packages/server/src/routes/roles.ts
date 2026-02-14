import { Router } from 'express';
import { loadAllTemplates } from '@openwork/agents';

export const rolesRouter = Router();

rolesRouter.get('/', (_req, res) => {
  try {
    const templates = loadAllTemplates();
    const roles = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      integrations: t.mcpServers.map((m) => ({
        id: m.id,
        name: m.name,
        envKeys: Object.keys(m.env),
      })),
      skills: t.skills,
      tools: t.tools,
    }));
    res.json({ roles });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
