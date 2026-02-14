import { Layers, Plug } from 'lucide-react';
import type { Role } from '../../types';

interface Props {
  roles: Role[];
  configs: Record<string, Record<string, Record<string, string>>>;
  onBack: () => void;
  onSetup: () => void;
}

export default function Review({ roles, configs, onBack, onSetup }: Props) {
  const totalIntegrations = roles.reduce((sum, r) => sum + r.integrations.length, 0);
  const configuredCount = roles.reduce((sum, r) => {
    return sum + r.integrations.filter((i) => {
      const c = configs[r.id]?.[i.id];
      return c && Object.values(c).some((v) => v.length > 0);
    }).length;
  }, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Review Setup</h2>
      <p className="text-gray-400 mb-6">Confirm what will be created.</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
          <Layers size={24} className="text-indigo-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{roles.length}</div>
          <div className="text-xs text-gray-500">Agent{roles.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
          <Plug size={24} className="text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{configuredCount}/{totalIntegrations}</div>
          <div className="text-xs text-gray-500">Integrations configured</div>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {roles.map((role) => (
          <div key={role.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">{role.name}</h4>
            <div className="flex flex-wrap gap-1.5">
              {role.integrations.map((i) => {
                const hasConfig = configs[role.id]?.[i.id] && Object.values(configs[role.id][i.id]).some((v) => v.length > 0);
                return (
                  <span
                    key={i.id}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      hasConfig
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-gray-500'
                    }`}
                  >
                    {i.name} {hasConfig ? '✓' : '—'}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5">
          Back
        </button>
        <button
          onClick={onSetup}
          className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-400 hover:to-purple-500 animate-pulse-glow"
        >
          Set Up Team
        </button>
      </div>
    </div>
  );
}
