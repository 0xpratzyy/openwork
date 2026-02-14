/**
 * OpenClaw Config Generator
 *
 * Non-destructive merge with existing ~/.openclaw/openclaw.json.
 * Always creates a backup before patching.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const OPENCLAW_DIR = join(homedir(), '.openclaw');
const CONFIG_PATH = join(OPENCLAW_DIR, 'openclaw.json');

export interface AgentConfig {
  id: string;
  workspace?: string;
  agentDir?: string;
  default?: boolean;
  [key: string]: unknown;
}

export interface BindingConfig {
  agentId: string;
  match: {
    channel?: string;
    peer?: { kind?: string; id?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface OpenClawConfig {
  agents?: { list?: AgentConfig[] };
  bindings?: BindingConfig[];
  [key: string]: unknown;
}

/**
 * Read and return the current OpenClaw config.
 * Returns empty config structure if file doesn't exist.
 */
export function getConfig(): OpenClawConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { agents: { list: [] }, bindings: [] };
  }
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as OpenClawConfig;
  } catch {
    return { agents: { list: [] }, bindings: [] };
  }
}

/**
 * Create a timestamped backup of the current config.
 */
function backupConfig(): void {
  if (!existsSync(CONFIG_PATH)) return;
  const backupDir = join(OPENCLAW_DIR, 'backups');
  mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(CONFIG_PATH, join(backupDir, `openclaw-${ts}.json`));
}

/**
 * Validate config structure before writing.
 */
function validateConfig(config: OpenClawConfig): void {
  if (config.agents && config.agents.list) {
    if (!Array.isArray(config.agents.list)) {
      throw new Error('Invalid config: agents.list must be an array');
    }
    for (const agent of config.agents.list) {
      if (!agent.id || typeof agent.id !== 'string') {
        throw new Error(`Invalid config: agent missing "id" field: ${JSON.stringify(agent)}`);
      }
    }
  }
  if (config.bindings) {
    if (!Array.isArray(config.bindings)) {
      throw new Error('Invalid config: bindings must be an array');
    }
    for (const binding of config.bindings) {
      if (!binding.agentId) {
        throw new Error(`Invalid config: binding missing "agentId": ${JSON.stringify(binding)}`);
      }
      if (!binding.match || typeof binding.match !== 'object') {
        throw new Error(`Invalid config: binding missing "match" object: ${JSON.stringify(binding)}`);
      }
    }
  }
}

/**
 * Write config to disk. Always validates and backs up first.
 */
function writeConfig(config: OpenClawConfig): void {
  validateConfig(config);
  mkdirSync(OPENCLAW_DIR, { recursive: true });
  backupConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Merge new agents and bindings into existing config.
 * Non-destructive — existing entries are preserved.
 */
export function patchConfig(agents: AgentConfig[], bindings: BindingConfig[]): void {
  const config = getConfig();

  if (!config.agents) config.agents = { list: [] };
  if (!config.agents.list) config.agents.list = [];
  if (!config.bindings) config.bindings = [];

  // Merge agents — skip duplicates by id
  const existingIds = new Set(config.agents.list.map((a) => a.id));
  for (const agent of agents) {
    if (!existingIds.has(agent.id)) {
      config.agents.list.push(agent);
    }
  }

  // Merge bindings — skip duplicates by agentId + match.channel
  const existingBindings = new Set(
    config.bindings.map((b) => `${b.agentId}:${b.match?.channel || ''}`)
  );
  for (const binding of bindings) {
    const key = `${binding.agentId}:${binding.match?.channel || ''}`;
    if (!existingBindings.has(key)) {
      config.bindings.push(binding);
    }
  }

  writeConfig(config);
}

/**
 * Add a single agent binding for channel routing.
 */
export function addAgentBinding(agentId: string, channel: string, matchRules?: Record<string, unknown>): void {
  const config = getConfig();
  if (!config.bindings) config.bindings = [];

  const exists = config.bindings.some(
    (b) => b.agentId === agentId && b.match?.channel === channel
  );
  if (exists) return;

  config.bindings.push({
    agentId,
    match: { channel, ...(matchRules || {}) },
  });
  writeConfig(config);
}

/**
 * Remove all bindings for an agent.
 */
export function removeAgentBinding(agentId: string): void {
  const config = getConfig();
  if (!config.bindings) return;
  config.bindings = config.bindings.filter((b) => b.agentId !== agentId);
  writeConfig(config);
}
