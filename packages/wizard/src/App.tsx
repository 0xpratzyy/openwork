import { useState, useCallback } from 'react';
import type { WizardState, Role } from './types';
import { api } from './api';
import Stepper from './components/Stepper';
import Welcome from './pages/Welcome';
import Roles from './pages/Roles';
import Integrations from './pages/Integrations';
import Review from './pages/Review';
import Progress from './pages/Progress';
import Done from './pages/Done';

const STEP_LABELS = ['Welcome', 'Select Roles', 'Integrations', 'Review', 'Setup', 'Done'];

export default function App() {
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
      const result = await api.setup({ roles, integrations: state.integrationConfigs });

      push('Patching OpenClaw config...');
      await new Promise((r) => setTimeout(r, 300));

      push('Done!');
      setState((s) => ({ ...s, progressDone: true, createdAgents: result.agents }));
    } catch (err) {
      push(`Error: ${err}`);
      setState((s) => ({ ...s, error: String(err) }));
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
            <Integrations
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
              onNext={() => setStep(5)}
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
