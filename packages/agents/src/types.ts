/** MCP server configuration within a role template */
export interface McpServerConfig {
  id: string;
  name: string;
  npmPackage: string;
  env: Record<string, string>;
}

/** Approval risk levels */
export type RiskLevel = 'low' | 'medium' | 'high';

/** Complete role template definition */
export interface RoleTemplate {
  /** Unique role identifier (e.g. "engineering") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description of the role */
  description: string;
  /** SOUL.md persona text — the agent's personality */
  persona: string;
  /** AGENTS.md instructions — how the agent should behave */
  instructions: string;
  /** Skill IDs this role uses */
  skills: string[];
  /** MCP servers required by this role */
  mcpServers: McpServerConfig[];
  /** Tool names the agent can use */
  tools: string[];
  /** Action → risk level mapping */
  approvalRules: Record<string, RiskLevel>;
}
