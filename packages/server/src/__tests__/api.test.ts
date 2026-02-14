import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock @openwork/core before importing routes
vi.mock('@openwork/core', () => ({
  listAgents: vi.fn(() => []),
  deleteAgent: vi.fn(),
  removeAgent: vi.fn(async () => {}),
  listPendingApprovals: vi.fn(() => []),
  getApproval: vi.fn(() => null),
  dbResolveApproval: vi.fn(),
  listIntegrations: vi.fn(() => []),
  getIntegration: vi.fn(() => null),
  updateIntegration: vi.fn(),
  listTasks: vi.fn(() => []),
  getAuditLog: vi.fn(() => []),
  listRegistryIntegrations: vi.fn((category?: string) => {
    const all = [
      { id: 'github', name: 'GitHub', categories: ['engineering'], tools: [], configSchema: [], transport: 'stdio', status: 'verified', stars: 100 },
      { id: 'slack', name: 'Slack', categories: ['ops'], tools: [], configSchema: [], transport: 'stdio', status: 'verified', stars: 80 },
    ];
    if (category) return all.filter(i => i.categories.includes(category));
    return all;
  }),
  getRegistryIntegration: vi.fn((id: string) => {
    if (id === 'github') return { id: 'github', name: 'GitHub' };
    return undefined;
  }),
  searchRegistryIntegrations: vi.fn((q: string) => {
    if (q === 'git') return [{ id: 'github', name: 'GitHub' }];
    return [];
  }),
  generateAgent: vi.fn(async () => ({ id: 'eng-1', name: 'Engineering', role: 'engineering', workspacePath: '/tmp' })),
  generateRouterAgent: vi.fn(async () => ({ id: 'router', name: 'Router Agent', role: 'router', workspacePath: '/tmp', specialistsIncluded: ['eng-1'] })),
  dbCreateAgent: vi.fn((data: any) => data),
  createIntegration: vi.fn(),
  patchConfig: vi.fn(),
}));

vi.mock('@openwork/agents', () => ({
  loadAllTemplates: vi.fn(() => [
    { id: 'engineering', name: 'Engineering', description: 'Eng', mcpServers: [{ id: 'github', name: 'GitHub', env: {} }], skills: ['code'], tools: ['git'] },
    { id: 'marketing', name: 'Marketing', description: 'Mkt', mcpServers: [], skills: ['ads'], tools: [] },
    { id: 'sales', name: 'Sales', description: 'Sales', mcpServers: [], skills: ['crm'], tools: [] },
    { id: 'support', name: 'Support', description: 'Support', mcpServers: [], skills: ['docs'], tools: [] },
    { id: 'ops', name: 'Operations', description: 'Ops', mcpServers: [], skills: ['sheets'], tools: [] },
  ]),
  loadTemplate: vi.fn((id: string) => {
    const templates: Record<string, any> = {
      engineering: { id: 'engineering', name: 'Engineering', description: 'Eng', mcpServers: [{ id: 'github', name: 'GitHub', env: {} }], skills: ['code'], tools: ['git'] },
    };
    if (!templates[id]) throw new Error(`Unknown role: ${id}`);
    return templates[id];
  }),
}));

// Mock execSync for status route
vi.mock('node:child_process', () => ({
  execSync: vi.fn(() => { throw new Error('not found'); }),
  spawn: vi.fn(),
}));

// Build a test app with routes
async function createTestApp() {
  const app = express();
  app.use(express.json());

  const { rolesRouter } = await import('../routes/roles.js');
  const { statusRouter } = await import('../routes/status.js');
  const { agentsRouter } = await import('../routes/agents.js');
  const { approvalsRouter } = await import('../routes/approvals.js');
  const { integrationsRouter } = await import('../routes/integrations.js');
  const { tasksRouter } = await import('../routes/tasks.js');
  const { registryRouter } = await import('../routes/registry.js');
  const { setupRouter } = await import('../routes/setup.js');

  app.use('/api/roles', rolesRouter);
  app.use('/api/status', statusRouter);
  app.use('/api/agents', agentsRouter);
  app.use('/api/approvals', approvalsRouter);
  app.use('/api/integrations', integrationsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/registry', registryRouter);
  app.use('/api/setup', setupRouter);

  return app;
}

describe('Server API', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('GET /api/status', () => {
    it('returns correct shape', async () => {
      const res = await request(app).get('/api/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('openclawRunning');
      expect(res.body).toHaveProperty('agentCount');
      expect(res.body).toHaveProperty('integrationCount');
      expect(typeof res.body.openclawRunning).toBe('boolean');
      expect(typeof res.body.agentCount).toBe('number');
    });
  });

  describe('GET /api/roles', () => {
    it('returns all 5 roles', async () => {
      const res = await request(app).get('/api/roles');
      expect(res.status).toBe(200);
      expect(res.body.roles).toHaveLength(5);
      expect(res.body.roles.map((r: any) => r.id)).toEqual(
        expect.arrayContaining(['engineering', 'marketing', 'sales', 'support', 'ops'])
      );
    });
  });

  describe('GET /api/agents', () => {
    it('returns array', async () => {
      const res = await request(app).get('/api/agents');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.agents)).toBe(true);
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('succeeds for any ID (mocked)', async () => {
      const res = await request(app).delete('/api/agents/nonexistent-id');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/integrations', () => {
    it('returns array', async () => {
      const res = await request(app).get('/api/integrations');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.integrations)).toBe(true);
    });
  });

  describe('GET /api/approvals', () => {
    it('returns array', async () => {
      const res = await request(app).get('/api/approvals');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.approvals)).toBe(true);
    });
  });

  describe('POST /api/approvals/:id/resolve', () => {
    it('returns 404 for nonexistent approval', async () => {
      const res = await request(app)
        .post('/api/approvals/fake-id/resolve')
        .send({ action: 'approve', resolvedBy: 'admin' });
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid action', async () => {
      const res = await request(app)
        .post('/api/approvals/fake-id/resolve')
        .send({ action: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/registry', () => {
    it('returns integrations', async () => {
      const res = await request(app).get('/api/registry');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.integrations)).toBe(true);
    });

    it('filters by category', async () => {
      const res = await request(app).get('/api/registry?category=engineering');
      expect(res.status).toBe(200);
      for (const i of res.body.integrations) {
        expect(i.categories).toContain('engineering');
      }
    });

    it('searches by query', async () => {
      const res = await request(app).get('/api/registry?q=git');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.integrations)).toBe(true);
    });
  });

  describe('GET /api/registry/:id', () => {
    it('returns integration by ID', async () => {
      const res = await request(app).get('/api/registry/github');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('github');
    });

    it('returns 404 for unknown ID', async () => {
      const res = await request(app).get('/api/registry/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/setup', () => {
    it('rejects empty roles', async () => {
      const res = await request(app).post('/api/setup').send({ roles: [] });
      expect(res.status).toBe(400);
    });

    it('rejects missing roles', async () => {
      const res = await request(app).post('/api/setup').send({});
      expect(res.status).toBe(400);
    });

    it('succeeds with valid roles', async () => {
      const res = await request(app).post('/api/setup').send({ roles: ['engineering'] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.agents)).toBe(true);
    });
  });

  describe('GET /api/tasks', () => {
    it('returns array', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
    });
  });
});
