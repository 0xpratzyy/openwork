import express from 'express';
import cors from 'cors';
import { rolesRouter } from './routes/roles.js';
import { setupRouter } from './routes/setup.js';
import { integrationsRouter } from './routes/integrations.js';
import { agentsRouter } from './routes/agents.js';
import { approvalsRouter } from './routes/approvals.js';
import { statusRouter } from './routes/status.js';

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

// Serve wizard and dashboard static files
// app.use('/', express.static('../wizard/dist'));
// app.use('/dashboard', express.static('../dashboard/dist'));

app.listen(PORT, () => {
  console.log(`OpenWork server running on http://localhost:${PORT}`);
});

export default app;
