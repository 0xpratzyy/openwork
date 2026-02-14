/**
 * OpenWork Store
 *
 * All state reads/writes go through openclaw.json.
 * No SQLite, no Drizzle — just JSON.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const OPENCLAW_DIR = join(homedir(), '.openclaw');
const CONFIG_PATH = join(OPENCLAW_DIR, 'openclaw.json');

// ── Types ──

export interface AgentEntry {
  id: string;
  role: string;
  name: string;
  status: string;
  workspace?: string;
  workspacePath?: string;
  agentDir?: string;
  default?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export interface BindingEntry {
  agentId: string;
  match: {
    channel?: string;
    peer?: { kind?: string; id?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ChannelConfig {
  [channelName: string]: Record<string, unknown>;
}

export interface OpenClawConfig {
  agents?: { list?: AgentEntry[] };
  bindings?: BindingEntry[];
  channels?: ChannelConfig;
  [key: string]: unknown;
}

// ── Internal helpers ──

function readConfig(): OpenClawConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { agents: { list: [] }, bindings: [], channels: {} };
  }
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as OpenClawConfig;
  } catch {
    return { agents: { list: [] }, bindings: [], channels: {} };
  }
}

function backupConfig(): void {
  if (!existsSync(CONFIG_PATH)) return;
  const backupDir = join(OPENCLAW_DIR, 'backups');
  mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(CONFIG_PATH, join(backupDir, `openclaw-${ts}.json`));
}

function writeConfig(config: OpenClawConfig): void {
  mkdirSync(OPENCLAW_DIR, { recursive: true });
  backupConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function ensureStructure(config: OpenClawConfig): void {
  if (!config.agents) config.agents = { list: [] };
  if (!config.agents.list) config.agents.list = [];
  if (!config.bindings) config.bindings = [];
  if (!config.channels) config.channels = {};
}

// ── Public API ──

/** Read the raw config */
export function getConfig(): OpenClawConfig {
  return readConfig();
}

/** Get all agents */
export function getAgents(): AgentEntry[] {
  const config = readConfig();
  return config.agents?.list ?? [];
}

/** Get a single agent by ID */
export function getAgent(id: string): AgentEntry | undefined {
  return getAgents().find((a) => a.id === id);
}

/** Get agents filtered by role */
export function getAgentsByRole(role: string): AgentEntry[] {
  return getAgents().filter((a) => a.role === role);
}

/** Add or upsert an agent */
export function addAgent(agent: AgentEntry): AgentEntry {
  const config = readConfig();
  ensureStructure(config);
  const idx = config.agents!.list!.findIndex((a) => a.id === agent.id);
  if (idx >= 0) {
    config.agents!.list![idx] = { ...config.agents!.list![idx], ...agent };
  } else {
    config.agents!.list!.push(agent);
  }
  writeConfig(config);
  return agent;
}

/** Remove an agent and its bindings */
export function removeAgentFromConfig(id: string): void {
  const config = readConfig();
  ensureStructure(config);
  config.agents!.list = config.agents!.list!.filter((a) => a.id !== id);
  config.bindings = config.bindings!.filter((b) => b.agentId !== id);
  writeConfig(config);
}

/** Remove all agents and bindings */
export function removeAllAgents(): void {
  const config = readConfig();
  ensureStructure(config);
  config.agents!.list = [];
  config.bindings = [];
  writeConfig(config);
}

/** Get all bindings */
export function getBindings(): BindingEntry[] {
  const config = readConfig();
  return config.bindings ?? [];
}

/** Add a binding (skip duplicates by agentId+channel) */
export function addBinding(binding: BindingEntry): void {
  const config = readConfig();
  ensureStructure(config);
  const key = `${binding.agentId}:${binding.match?.channel || ''}`;
  const exists = config.bindings!.some(
    (b) => `${b.agentId}:${b.match?.channel || ''}` === key
  );
  if (!exists) {
    config.bindings!.push(binding);
    writeConfig(config);
  }
}

/** Remove all bindings for an agent */
export function removeAgentBindings(agentId: string): void {
  const config = readConfig();
  ensureStructure(config);
  config.bindings = config.bindings!.filter((b) => b.agentId !== agentId);
  writeConfig(config);
}

/** Get all channels config */
export function getChannels(): ChannelConfig {
  const config = readConfig();
  return config.channels ?? {};
}

/** Set a channel config */
export function setChannel(name: string, channelConfig: Record<string, unknown>): void {
  const config = readConfig();
  ensureStructure(config);
  config.channels![name] = channelConfig;
  writeConfig(config);
}

/** Remove a channel */
export function removeChannel(name: string): void {
  const config = readConfig();
  ensureStructure(config);
  delete config.channels![name];
  writeConfig(config);
}

/**
 * Merge new agents and bindings into existing config (non-destructive).
 */
export function patchConfig(
  agents: Array<{ id: string; workspace?: string; [key: string]: unknown }>,
  bindings: BindingEntry[]
): void {
  const config = readConfig();
  ensureStructure(config);

  const existingIds = new Set(config.agents!.list!.map((a) => a.id));
  for (const agent of agents) {
    if (!existingIds.has(agent.id)) {
      config.agents!.list!.push(agent as AgentEntry);
    }
  }

  const existingBindings = new Set(
    config.bindings!.map((b) => `${b.agentId}:${b.match?.channel || ''}`)
  );
  for (const binding of bindings) {
    const key = `${binding.agentId}:${binding.match?.channel || ''}`;
    if (!existingBindings.has(key)) {
      config.bindings!.push(binding);
    }
  }

  writeConfig(config);
}

// ── Compatibility aliases (used by existing code that imported from db) ──

/** Alias: create/upsert agent (compatible with old dbCreateAgent signature) */
export function dbCreateAgent(data: { id?: string; role: string; name: string; workspacePath?: string }): AgentEntry {
  const agent: AgentEntry = {
    id: data.id || `${data.role}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    role: data.role,
    name: data.name,
    status: 'active',
    workspace: data.workspacePath ?? undefined,
    createdAt: new Date().toISOString(),
  };
  return addAgent(agent);
}

/** Alias: list all agents */
export function listAgents(): AgentEntry[] {
  return getAgents();
}

/** Alias: delete agent by ID */
export function deleteAgent(id: string): void {
  removeAgentFromConfig(id);
}

/** Alias: delete all agents */
export function deleteAllAgents(): void {
  removeAllAgents();
}

/** Alias: remove agent binding */
export function removeAgentBinding(agentId: string): void {
  removeAgentBindings(agentId);
}

/** Alias: add agent binding */
export function addAgentBinding(agentId: string, channel: string, matchRules?: Record<string, unknown>): void {
  addBinding({ agentId, match: { channel, ...(matchRules || {}) } });
}
