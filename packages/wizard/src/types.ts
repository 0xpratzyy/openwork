export interface RoleIntegration {
  id: string;
  name: string;
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
