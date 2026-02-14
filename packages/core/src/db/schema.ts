import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  role: text('role').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('inactive'),
  workspacePath: text('workspace_path'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const integrations = sqliteTable('integrations', {
  id: text('id').primaryKey(),
  agentId: text('agent_id'),
  type: text('type').notNull(),
  configEncrypted: text('config_encrypted'),
  status: text('status').notNull().default('disconnected'),
});

export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id),
  action: text('action').notNull(),
  riskLevel: text('risk_level').notNull(),
  status: text('status').notNull().default('pending'),
  metadata: text('metadata'),
  requestedAt: integer('requested_at', { mode: 'timestamp' }).notNull(),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolver: text('resolver'),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id),
  description: text('description').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id),
  action: text('action').notNull(),
  details: text('details'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});
