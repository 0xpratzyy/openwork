import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

// Use in-memory DB for tests
function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'inactive',
      workspace_path TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      type TEXT NOT NULL,
      config_encrypted TEXT,
      status TEXT NOT NULL DEFAULT 'disconnected'
    );
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      action TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      metadata TEXT,
      requested_at INTEGER NOT NULL,
      resolved_at INTEGER,
      resolver TEXT
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      action TEXT NOT NULL,
      details TEXT,
      timestamp INTEGER NOT NULL
    );
  `);
  return { sqlite, db: drizzle(sqlite, { schema }) };
}

describe('Database CRUD', () => {
  let sqlite: any;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    const t = createTestDb();
    sqlite = t.sqlite;
    db = t.db;
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('agents', () => {
    it('should create and retrieve an agent', () => {
      db.insert(schema.agents).values({
        id: 'eng-1',
        role: 'engineering',
        name: 'Engineering Agent',
        status: 'active',
        workspacePath: '/tmp/eng',
        createdAt: new Date(),
      }).run();

      const agent = db.select().from(schema.agents).where(eq(schema.agents.id, 'eng-1')).get();
      expect(agent).toBeDefined();
      expect(agent!.name).toBe('Engineering Agent');
      expect(agent!.role).toBe('engineering');
    });

    it('should list all agents', () => {
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1', status: 'active', createdAt: new Date() }).run();
      db.insert(schema.agents).values({ id: 'a2', role: 'mkt', name: 'A2', status: 'active', createdAt: new Date() }).run();
      const all = db.select().from(schema.agents).all();
      expect(all).toHaveLength(2);
    });

    it('should update agent status', () => {
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1', status: 'active', createdAt: new Date() }).run();
      db.update(schema.agents).set({ status: 'offline' }).where(eq(schema.agents.id, 'a1')).run();
      const agent = db.select().from(schema.agents).where(eq(schema.agents.id, 'a1')).get();
      expect(agent!.status).toBe('offline');
    });

    it('should upsert agent (insert twice with same id should not crash)', () => {
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1', status: 'active', createdAt: new Date() }).run();
      // Second insert with onConflictDoUpdate
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1 Updated', status: 'active', createdAt: new Date() })
        .onConflictDoUpdate({ target: schema.agents.id, set: { name: 'A1 Updated' } })
        .run();
      const agent = db.select().from(schema.agents).where(eq(schema.agents.id, 'a1')).get();
      expect(agent!.name).toBe('A1 Updated');
    });

    it('should delete an agent', () => {
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1', status: 'active', createdAt: new Date() }).run();
      db.delete(schema.agents).where(eq(schema.agents.id, 'a1')).run();
      const agent = db.select().from(schema.agents).where(eq(schema.agents.id, 'a1')).get();
      expect(agent).toBeUndefined();
    });
  });

  describe('integrations', () => {
    beforeEach(() => {
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1', status: 'active', createdAt: new Date() }).run();
    });

    it('should create and retrieve an integration', () => {
      db.insert(schema.integrations).values({ id: 'i1', agentId: 'a1', type: 'github', status: 'connected' }).run();
      const int = db.select().from(schema.integrations).where(eq(schema.integrations.id, 'i1')).get();
      expect(int).toBeDefined();
      expect(int!.type).toBe('github');
    });

    it('should filter integrations by agent', () => {
      db.insert(schema.integrations).values({ id: 'i1', agentId: 'a1', type: 'github', status: 'connected' }).run();
      db.insert(schema.integrations).values({ id: 'i2', agentId: 'a1', type: 'linear', status: 'connected' }).run();
      const list = db.select().from(schema.integrations).where(eq(schema.integrations.agentId, 'a1')).all();
      expect(list).toHaveLength(2);
    });
  });

  describe('approvals', () => {
    beforeEach(() => {
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1', status: 'active', createdAt: new Date() }).run();
    });

    it('should create and resolve an approval', () => {
      db.insert(schema.approvals).values({
        id: 'ap1', agentId: 'a1', action: 'deploy', riskLevel: 'high',
        status: 'pending', requestedAt: new Date(),
      }).run();

      db.update(schema.approvals).set({
        status: 'approved', resolvedAt: new Date(), resolver: 'admin',
      }).where(eq(schema.approvals.id, 'ap1')).run();

      const ap = db.select().from(schema.approvals).where(eq(schema.approvals.id, 'ap1')).get();
      expect(ap!.status).toBe('approved');
      expect(ap!.resolver).toBe('admin');
    });
  });

  describe('tasks', () => {
    beforeEach(() => {
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1', status: 'active', createdAt: new Date() }).run();
    });

    it('should create and update a task', () => {
      db.insert(schema.tasks).values({
        id: 't1', agentId: 'a1', description: 'Fix bug', status: 'pending', createdAt: new Date(),
      }).run();

      db.update(schema.tasks).set({ status: 'completed', completedAt: new Date() }).where(eq(schema.tasks.id, 't1')).run();

      const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, 't1')).get();
      expect(task!.status).toBe('completed');
      expect(task!.completedAt).toBeDefined();
    });
  });

  describe('audit_log', () => {
    beforeEach(() => {
      db.insert(schema.agents).values({ id: 'a1', role: 'eng', name: 'A1', status: 'active', createdAt: new Date() }).run();
    });

    it('should log and retrieve actions', () => {
      db.insert(schema.auditLog).values({
        id: 'log1', agentId: 'a1', action: 'deploy', details: '{"env":"prod"}', timestamp: new Date(),
      }).run();

      const logs = db.select().from(schema.auditLog).all();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('deploy');
    });
  });
});
