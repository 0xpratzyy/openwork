import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, CheckCircle, Package, Zap, Shield, Star, ExternalLink } from 'lucide-react';
import type { Role, RoleIntegration } from '../types';

interface Props {
  roles: Role[];
  configs: Record<string, Record<string, Record<string, string>>>;
  onConfigChange: (roleId: string, integrationId: string, key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const roleIcons: Record<string, string> = {
  engineering: '🛠️',
  marketing: '🚀',
  sales: '🤝',
  support: '💬',
  ops: '📊',
};

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

  const getConfiguredCount = (roleId: string, integrations: RoleIntegration[]) => {
    return integrations.filter((i) => {
      const fields = i.configSchema || i.envKeys.map(k => ({ field: k, required: true }));
      const roleConfig = configs[roleId]?.[i.id] ?? {};
      return fields.some((f) => {
        const key = typeof f === 'string' ? f : f.field;
        return roleConfig[key]?.trim();
      });
    }).length;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Connect Your Tools</h2>
      <p className="text-gray-400 mb-6">
        Each integration connects via an <span className="text-indigo-400 font-medium">MCP server</span> — the standard protocol for AI tool use. 
        Add your API keys to enable each connection.
      </p>

      <div className="space-y-4">
        {roles.map((role) => {
          const configured = getConfiguredCount(role.id, role.integrations);
          return (
            <div key={role.id} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleExpand(role.id)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{roleIcons[role.id] || '🔧'}</span>
                  <div className="text-left">
                    <span className="font-semibold text-sm block">{role.name}</span>
                    <span className="text-xs text-gray-500">
                      {configured}/{role.integrations.length} connected
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {configured === role.integrations.length && configured > 0 && (
                    <CheckCircle size={14} className="text-green-400" />
                  )}
                  {expanded.has(role.id) ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </div>
              </button>

              {expanded.has(role.id) && (
                <div className="p-4 grid gap-4 md:grid-cols-2">
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
          );
        })}
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

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    verified: 'bg-green-500/10 text-green-400 border-green-500/20',
    community: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    beta: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${colors[status] || colors.community}`}>
      {status === 'verified' ? '✓ Verified' : status === 'beta' ? 'Beta' : 'Community'}
    </span>
  );
}

function IntegrationCard({
  roleId,
  integration,
  config,
  onChange,
}: {
  roleId: string;
  integration: RoleIntegration;
  config: Record<string, string>;
  onChange: (roleId: string, integrationId: string, key: string, value: string) => void;
}) {
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [expandedTools, setExpandedTools] = useState(false);

  const toggleShow = (key: string) => {
    setShowKeys((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fields = integration.configSchema || integration.envKeys.map((k) => ({
    field: k,
    label: k.replace(/_/g, ' ').toLowerCase(),
    type: 'password' as const,
    required: true,
    placeholder: `Enter ${k.toLowerCase().replace(/_/g, ' ')}`,
  }));

  const isConnected = fields.filter(f => f.required).every((f) => config[f.field]?.trim());
  const tools = integration.tools || [];

  return (
    <div className={`bg-white/5 border rounded-xl p-4 transition-all ${isConnected ? 'border-green-500/30' : 'border-white/10'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isConnected ? 'bg-green-500/10 text-green-400' : 'bg-white/10 text-gray-400'}`}>
            {integration.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{integration.name}</span>
              <StatusBadge status={integration.status} />
            </div>
          </div>
        </div>
        {isConnected && <CheckCircle size={16} className="text-green-400 mt-1" />}
      </div>

      {/* Description */}
      {integration.description && (
        <p className="text-xs text-gray-500 mt-1 mb-3">{integration.description}</p>
      )}

      {/* MCP Server Info */}
      {integration.npmPackage && (
        <div className="flex items-center gap-3 mb-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Package size={10} />
            {integration.npmPackage}
          </span>
          {integration.transport && (
            <span className="flex items-center gap-1">
              <Zap size={10} />
              {integration.transport}
            </span>
          )}
          {integration.stars && (
            <span className="flex items-center gap-1">
              <Star size={10} />
              {integration.stars >= 1000 ? `${(integration.stars / 1000).toFixed(1)}k` : integration.stars}
            </span>
          )}
        </div>
      )}

      {/* Tools preview */}
      {tools.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setExpandedTools(!expandedTools)}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Shield size={10} />
            {tools.length} tools available
            {expandedTools ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
          {expandedTools && (
            <div className="mt-2 space-y-1 pl-3 border-l border-white/5">
              {tools.map((t) => (
                <div key={t.name} className="text-[11px]">
                  <span className="text-gray-300 font-mono">{t.name}</span>
                  <span className="text-gray-600 ml-1">— {t.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Config fields */}
      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.field}>
            <label className="text-[11px] text-gray-500 block mb-1 flex items-center gap-1">
              {f.label}
              {f.required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
              <input
                type={showKeys.has(f.field) ? 'text' : 'password'}
                value={config[f.field] ?? ''}
                onChange={(e) => onChange(roleId, integration.id, f.field, e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShow(f.field)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showKeys.has(f.field) ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Test connection */}
      <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
        <ExternalLink size={10} />
        Test Connection
      </button>
    </div>
  );
}
