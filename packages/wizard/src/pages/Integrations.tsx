import { useState } from 'react';
import { ChevronDown, ChevronRight, Plug, Eye, EyeOff } from 'lucide-react';
import type { Role } from '../types';

interface Props {
  roles: Role[];
  configs: Record<string, Record<string, Record<string, string>>>;
  onConfigChange: (roleId: string, integrationId: string, key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Integrations({ roles, configs, onConfigChange, onBack, onNext }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(roles.map((r) => r.id)));

  const toggleExpand = (id: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Configure Integrations</h2>
      <p className="text-gray-400 mb-6">Add API keys for each integration. You can skip optional ones.</p>

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleExpand(role.id)}
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.07] transition-colors"
            >
              <span className="font-semibold text-sm">{role.name}</span>
              {expanded.has(role.id) ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
            </button>

            {expanded.has(role.id) && (
              <div className="p-4 space-y-4">
                {role.integrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    roleId={role.id}
                    integration={integration}
                    config={configs[role.id]?.[integration.id] ?? {}}
                    onChange={onConfigChange}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5">
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-400 hover:to-purple-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function IntegrationCard({
  roleId,
  integration,
  config,
  onChange,
}: {
  roleId: string;
  integration: { id: string; name: string; envKeys: string[] };
  config: Record<string, string>;
  onChange: (roleId: string, integrationId: string, key: string, value: string) => void;
}) {
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());

  const toggleShow = (key: string) => {
    setShowKeys((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Plug size={14} className="text-indigo-400" />
        <span className="text-sm font-medium">{integration.name}</span>
      </div>
      <div className="space-y-2">
        {integration.envKeys.map((key) => (
          <div key={key}>
            <label className="text-xs text-gray-500 block mb-1">{key}</label>
            <div className="relative">
              <input
                type={showKeys.has(key) ? 'text' : 'password'}
                value={config[key] ?? ''}
                onChange={(e) => onChange(roleId, integration.id, key, e.target.value)}
                placeholder={`Enter ${key.toLowerCase().replace(/_/g, ' ')}`}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShow(key)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showKeys.has(key) ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
        Test Connection
      </button>
    </div>
  );
}
