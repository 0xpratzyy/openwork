import express from 'express';
import cors from 'cors';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { rolesRouter } from './routes/roles.js';
import { setupRouter } from './routes/setup.js';
import { integrationsRouter } from './routes/integrations.js';
import { agentsRouter } from './routes/agents.js';
import { approvalsRouter } from './routes/approvals.js';
import { statusRouter } from './routes/status.js';
import { tasksRouter } from './routes/tasks.js';
import { registryRouter } from './routes/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 18800;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/roles', rolesRouter);
app.use('/api/setup', setupRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/status', statusRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/registry', registryRouter);

// Serve wizard static files
const wizardDist = join(__dirname, '..', '..', 'wizard', 'dist');
if (existsSync(wizardDist)) {
  app.use('/', express.static(wizardDist));
  // SPA fallback
  app.get('/{*path}', (_req, res) => {
    res.sendFile(join(wizardDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`OpenWork server running on http://localhost:${PORT}`);
});

export default app;
