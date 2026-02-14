export interface ConfigField {
  field: string;
  label: string;
  type: 'password' | 'text';
  required: boolean;
  placeholder: string;
}

export interface McpTool {
  name: string;
  description: string;
}

export interface RoleIntegration {
  id: string;
  name: string;
  description?: string;
  npmPackage?: string;
  transport?: string;
  configSchema?: ConfigField[];
  tools?: McpTool[];
  status?: 'verified' | 'community' | 'beta';
  stars?: number;
  envKeys: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  integrations: RoleIntegration[];
  skills: string[];
  tools: string[];
}

export interface WizardState {
  step: number;
  status: { openclawRunning: boolean; agentCount: number; integrationCount: number } | null;
  roles: Role[];
  selectedRoles: Set<string>;
  integrationConfigs: Record<string, Record<string, Record<string, string>>>;
  progressMessages: string[];
  progressDone: boolean;
  createdAgents: Array<{ id: string; name: string; role: string }>;
  error: string | null;
}
