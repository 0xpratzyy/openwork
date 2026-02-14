/**
 * OpenClaw Config Patcher
 *
 * Reads and patches ~/.openclaw/openclaw.json to add:
 * - New agents to agents.list[]
 * - Bindings for Slack routing
 * - MCP server configs per agent
 *
 * Non-destructive: merges with existing config.
 */

export interface OpenClawConfig {
  agents?: { list?: Record<string, unknown>[] };
  bindings?: Record<string, unknown>[];
  [key: string]: unknown;
}

export async function patchConfig(_updates: Partial<OpenClawConfig>): Promise<void> {
  // TODO: implement config patching
  throw new Error('Not implemented yet');
}

export async function readConfig(): Promise<OpenClawConfig> {
  // TODO: read and parse openclaw.json
  throw new Error('Not implemented yet');
}
