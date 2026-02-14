/**
 * SQLite Persistence Layer
 *
 * Initializes SQLite at ~/.openwork/openwork.db with Drizzle ORM.
 * Runs migrations on first access (creates tables if not exist).
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: any = null;

const DB_DIR = join(homedir(), '.openwork');
const DB_PATH = join(DB_DIR, 'openwork.db');

const MIGRATIONS = `
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
`;

/**
 * Get (or initialize) the database connection.
 * Creates ~/.openwork directory and tables on first access.
 */
export function getDb() {
  if (_db) return _db;
  mkdirSync(DB_DIR, { recursive: true });
  _sqlite = new Database(DB_PATH);
  _sqlite.pragma('journal_mode = WAL');
  _sqlite.exec(MIGRATIONS);
  _db = drizzle(_sqlite, { schema });
  return _db;
}

/** Close the database connection */
export function closeDb(): void {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
  }
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Agent CRUD ──

/** Create or update an agent record (upsert) */
export function dbCreateAgent(data: { id?: string; role: string; name: string; workspacePath?: string }) {
  const db = getDb();
  const row = {
    id: data.id || `${data.role}-${genId()}`,
    role: data.role,
    name: data.name,
    status: 'active',
    workspacePath: data.workspacePath ?? null,
    createdAt: new Date(),
  };
  try {
    db.insert(schema.agents).values(row)
      .onConflictDoUpdate({
        target: schema.agents.id,
        set: { role: row.role, name: row.name, status: row.status, workspacePath: row.workspacePath },
      })
      .run();
  } catch (err) {
    throw new Error(`Failed to create agent "${row.id}": ${err instanceof Error ? err.message : String(err)}`);
  }
  return row;
}

/** Get an agent by ID */
export function getAgent(id: string) {
  const db = getDb();
  return db.select().from(schema.agents).where(eq(schema.agents.id, id)).get();
}

/** List all agents */
export function listAgents() {
  const db = getDb();
  return db.select().from(schema.agents).all();
}

/** Update agent fields */
export function updateAgent(id: string, updates: Partial<{ name: string; status: string }>) {
  const db = getDb();
  db.update(schema.agents).set(updates).where(eq(schema.agents.id, id)).run();
}

/** Delete an agent by ID */
export function deleteAgent(id: string) {
  const db = getDb();
  db.delete(schema.agents).where(eq(schema.agents.id, id)).run();
}

// ── Integration CRUD ──

/** Create a new integration record (handles duplicates gracefully) */
export function createIntegration(data: { agentId: string; type: string; configEncrypted?: string }) {
  const db = getDb();
  const row = { id: genId(), ...data, configEncrypted: data.configEncrypted ?? null, status: 'disconnected' };
  try {
    db.insert(schema.integrations).values(row)
      .onConflictDoUpdate({
        target: schema.integrations.id,
        set: { agentId: row.agentId, type: row.type, configEncrypted: row.configEncrypted, status: row.status },
      })
      .run();
  } catch (err) {
    throw new Error(`Failed to create integration: ${err instanceof Error ? err.message : String(err)}`);
  }
  return row;
}

/** Delete all integrations for a given agent */
export function deleteIntegrationsByAgent(agentId: string) {
  const db = getDb();
  db.delete(schema.integrations).where(eq(schema.integrations.agentId, agentId)).run();
}

/** Delete all agents */
export function deleteAllAgents() {
  const db = getDb();
  db.delete(schema.agents).run();
}

/** Delete all integrations */
export function deleteAllIntegrations() {
  const db = getDb();
  db.delete(schema.integrations).run();
}

/** Get agents by role */
export function getAgentsByRole(role: string) {
  const db = getDb();
  return db.select().from(schema.agents).where(eq(schema.agents.role, role)).all();
}

/** Get integration by ID */
export function getIntegration(id: string) {
  const db = getDb();
  return db.select().from(schema.integrations).where(eq(schema.integrations.id, id)).get();
}

/** List integrations, optionally filtered by agent */
export function listIntegrations(agentId?: string) {
  const db = getDb();
  if (agentId) return db.select().from(schema.integrations).where(eq(schema.integrations.agentId, agentId)).all();
  return db.select().from(schema.integrations).all();
}

/** Update integration fields */
export function updateIntegration(id: string, updates: Partial<{ configEncrypted: string; status: string }>) {
  const db = getDb();
  db.update(schema.integrations).set(updates).where(eq(schema.integrations.id, id)).run();
}

/** Delete an integration by ID */
export function deleteIntegration(id: string) {
  const db = getDb();
  db.delete(schema.integrations).where(eq(schema.integrations.id, id)).run();
}

// ── Approval CRUD ──

/** Create a new approval request */
export function dbCreateApproval(data: { agentId: string; action: string; riskLevel: string; metadata?: string }) {
  const db = getDb();
  const row = {
    id: genId(),
    ...data,
    metadata: data.metadata ?? null,
    status: 'pending',
    requestedAt: new Date(),
    resolvedAt: null,
    resolver: null,
  };
  db.insert(schema.approvals).values(row).run();
  return row;
}

/** Get approval by ID */
export function getApproval(id: string) {
  const db = getDb();
  return db.select().from(schema.approvals).where(eq(schema.approvals.id, id)).get();
}

/** List all pending approvals */
export function listPendingApprovals() {
  const db = getDb();
  return db.select().from(schema.approvals).where(eq(schema.approvals.status, 'pending')).all();
}

/** Resolve an approval (approve or reject) */
export function dbResolveApproval(id: string, status: 'approved' | 'rejected', resolver: string) {
  const db = getDb();
  db.update(schema.approvals).set({ status, resolvedAt: new Date(), resolver }).where(eq(schema.approvals.id, id)).run();
}

// ── Task CRUD ──

/** Create a new task */
export function createTask(data: { agentId: string; description: string }) {
  const db = getDb();
  const row = { id: genId(), ...data, status: 'pending', createdAt: new Date(), completedAt: null };
  db.insert(schema.tasks).values(row).run();
  return row;
}

/** Get task by ID */
export function getTask(id: string) {
  const db = getDb();
  return db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get();
}

/** List tasks, optionally filtered by agent */
export function listTasks(agentId?: string) {
  const db = getDb();
  if (agentId) return db.select().from(schema.tasks).where(eq(schema.tasks.agentId, agentId)).all();
  return db.select().from(schema.tasks).all();
}

/** Update task status */
export function updateTaskStatus(id: string, status: string) {
  const db = getDb();
  const updates: Record<string, unknown> = { status };
  if (status === 'completed' || status === 'failed') updates.completedAt = new Date();
  db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id)).run();
}

// ── Audit Log ──

/** Log an action to the audit trail */
export function logAction(data: { agentId: string; action: string; details?: string }) {
  const db = getDb();
  const row = { id: genId(), ...data, details: data.details ?? null, timestamp: new Date() };
  db.insert(schema.auditLog).values(row).run();
  return row;
}

/** Get recent audit log entries */
export function getAuditLog(limit = 100) {
  const db = getDb();
  return db.select().from(schema.auditLog).limit(limit).all();
}
