import { useState, useCallback } from 'react';
import type { Role } from '../../types';
import { api } from '../../api';
import Stepper from './Stepper';
import Welcome from './Welcome';
import Roles from './Roles';
import SetupIntegrations from './SetupIntegrations';
import Review from './Review';
import Progress from './Progress';
import Done from './Done';

interface WizardState {
  step: number;
  status: { openclawRunning: boolean; agentCount: number; integrationCount: number; agents?: any[] } | null;
  roles: Role[];
  selectedRoles: Set<string>;
  integrationConfigs: Record<string, Record<string, Record<string, string>>>;
  progressMessages: string[];
  progressDone: boolean;
  createdAgents: Array<{ id: string; name: string; role: string }>;
  error: string | null;
}

const STEP_LABELS = ['Welcome', 'Select Roles', 'Integrations', 'Review', 'Setup', 'Done'];

export default function SetupWizard() {
  const [state, setState] = useState<WizardState>({
    step: 0,
    status: null,
    roles: [],
    selectedRoles: new Set(),
    integrationConfigs: {},
    progressMessages: [],
    progressDone: false,
    createdAgents: [],
    error: null,
  });

  const setStep = (step: number) => setState((s) => ({ ...s, step }));

  const loadStatus = useCallback(async () => {
    try {
      const status = await api.getStatus();
      setState((s) => ({ ...s, status }));
    } catch {
      setState((s) => ({ ...s, status: { openclawRunning: false, agentCount: 0, integrationCount: 0 } }));
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const { roles } = await api.getRoles();
      setState((s) => ({ ...s, roles }));
    } catch (err) {
      setState((s) => ({ ...s, error: String(err) }));
    }
  }, []);

  const toggleRole = (id: string) => {
    setState((s) => {
      const next = new Set(s.selectedRoles);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...s, selectedRoles: next };
    });
  };

  const setIntegrationConfig = (roleId: string, integrationId: string, key: string, value: string) => {
    setState((s) => {
      const configs = { ...s.integrationConfigs };
      if (!configs[roleId]) configs[roleId] = {};
      if (!configs[roleId][integrationId]) configs[roleId][integrationId] = {};
      configs[roleId][integrationId][key] = value;
      return { ...s, integrationConfigs: configs };
    });
  };

  const runSetup = async () => {
    setStep(4);
    const roles = Array.from(state.selectedRoles);
    const messages: string[] = [];
    const push = (msg: string) => {
      messages.push(msg);
      setState((s) => ({ ...s, progressMessages: [...messages] }));
    };

    try {
      for (const roleId of roles) {
        push(`Creating ${roleId} agent...`);
        await new Promise((r) => setTimeout(r, 400));
      }
      push('Configuring integrations...');
      await new Promise((r) => setTimeout(r, 300));

      push('Sending setup request...');
      
      // Timeout after 60s
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      
      let result;
      try {
        result = await api.setup({ roles, integrations: state.integrationConfigs });
      } finally {
        clearTimeout(timeout);
      }

      if (!result.success) {
        throw new Error(result.error || 'Setup failed');
      }

      push('Patching OpenClaw config...');
      await new Promise((r) => setTimeout(r, 300));

      push('Done!');
      setState((s) => ({ ...s, progressDone: true, createdAgents: result.agents, error: null }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      push(`Failed: ${errorMsg}`);
      setState((s) => ({ ...s, error: errorMsg, progressDone: false }));
    }
  };

  const selectedRolesData = state.roles.filter((r) => state.selectedRoles.has(r.id));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Stepper steps={STEP_LABELS} current={state.step} />

        <div className="mt-8 animate-fade-in" key={state.step}>
          {state.step === 0 && (
            <Welcome
              status={state.status}
              onLoad={loadStatus}
              onNext={() => { loadRoles(); setStep(1); }}
              onFreshStart={async () => {
                await api.reset();
                await loadStatus();
              }}
            />
          )}
          {state.step === 1 && (
            <Roles
              roles={state.roles}
              selected={state.selectedRoles}
              onToggle={toggleRole}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {state.step === 2 && (
            <SetupIntegrations
              roles={selectedRolesData}
              configs={state.integrationConfigs}
              onConfigChange={setIntegrationConfig}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {state.step === 3 && (
            <Review
              roles={selectedRolesData}
              configs={state.integrationConfigs}
              onBack={() => setStep(2)}
              onSetup={runSetup}
            />
          )}
          {state.step === 4 && (
            <Progress
              messages={state.progressMessages}
              done={state.progressDone}
              error={state.error}
              onNext={() => setStep(5)}
              onRetry={() => {
                setState((s) => ({
                  ...s,
                  step: 3,
                  progressMessages: [],
                  progressDone: false,
                  error: null,
                }));
              }}
            />
          )}
          {state.step === 5 && (
            <Done agents={state.createdAgents} />
          )}
        </div>
      </div>
    </div>
  );
}
