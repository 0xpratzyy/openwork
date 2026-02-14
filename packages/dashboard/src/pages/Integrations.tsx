import { useState, useEffect } from 'react';
import { Search, Plus, X, CheckCircle, ExternalLink, Package, Star, Zap } from 'lucide-react';
import type { RegistryIntegration, ConfigField } from '../types';
import { api } from '../api';
import { useFetch, apiPost } from '../hooks';

const categories = ['All', 'Engineering', 'Marketing', 'Sales', 'Support', 'Operations'];

const categoryColors: Record<string, string> = {
  A: 'bg-indigo-500', B: 'bg-purple-500', C: 'bg-pink-500', D: 'bg-cyan-500',
  E: 'bg-emerald-500', F: 'bg-amber-500', G: 'bg-rose-500', H: 'bg-teal-500',
  I: 'bg-blue-500', J: 'bg-orange-500', K: 'bg-violet-500', L: 'bg-lime-500',
  M: 'bg-red-500', N: 'bg-sky-500', O: 'bg-fuchsia-500', P: 'bg-yellow-500',
  Q: 'bg-green-500', R: 'bg-indigo-400', S: 'bg-purple-400', T: 'bg-pink-400',
  U: 'bg-cyan-400', V: 'bg-emerald-400', W: 'bg-amber-400', X: 'bg-rose-400',
  Y: 'bg-teal-400', Z: 'bg-blue-400',
};

function getLetterColor(name: string) {
  const letter = name.charAt(0).toUpperCase();
  return categoryColors[letter] || 'bg-gray-500';
}

interface ConnectedIntegration {
  id: string;
  type: string;
  status: string;
  hasConfig: boolean;
}

export default function Integrations() {
  const [registry, setRegistry] = useState<RegistryIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<RegistryIntegration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Fetch connected integrations
  const { data: connectedData, refetch: refetchConnected } = useFetch<{ integrations: ConnectedIntegration[] }>('/integrations');
  const connectedTypes = new Set((connectedData?.integrations || []).filter(i => i.hasConfig).map(i => i.type));

  useEffect(() => {
    loadRegistry();
  }, [category]);

  const loadRegistry = async () => {
    setLoading(true);
    try {
      const cat = category === 'All' ? undefined : category.toLowerCase();
      const data = await api.getRegistry({ category: cat });
      setRegistry(data.integrations);
    } catch {
      setRegistry([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = registry.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openConnect = (integration: RegistryIntegration) => {
    setSelected(integration);
    setConfigValues({});
  };

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const result = await apiPost<{ success: boolean; message?: string; type?: string }>(`/integrations/${selected.id}/configure`, { config: configValues });
      refetchConnected();
      if (result.message) {
        setSaveSuccess(result.message);
      } else {
        setSelected(null);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-gray-500">
            Connect the tools you use and let OpenWork perform tasks across various apps.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Custom MCP
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search integrations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
              category === c
                ? 'bg-indigo-500/20 text-indigo-400 font-medium'
                : 'bg-dark-card text-gray-500 hover:text-gray-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-3">
              <div className="skeleton h-12 w-12 rounded-lg" />
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-9 w-24" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No integrations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((integration) => {
            const isConnected = connectedTypes.has(integration.id);
            return (
              <div
                key={integration.id}
                className={`bg-dark-card border rounded-xl p-5 transition-colors ${
                  isConnected ? 'border-green-500/30' : 'border-dark-border hover:border-indigo-500/30'
                }`}
              >
                {/* Icon + Name + Badge */}
                <div className="flex items-start gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white shrink-0 ${getLetterColor(integration.name)}`}>
                    {integration.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-200">{integration.name}</h3>
                      {isConnected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 font-medium">
                          Connected
                        </span>
                      )}
                      {integration.status === 'verified' && !isConnected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-medium">
                          Popular
                        </span>
                      )}
                      {integration.status === 'beta' && !isConnected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 font-medium">
                          Beta
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{integration.description}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mb-4 text-[11px] text-gray-600">
                  {integration.npmPackage && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {integration.npmPackage}
                    </span>
                  )}
                  {integration.stars && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {integration.stars >= 1000 ? `${(integration.stars / 1000).toFixed(1)}k` : integration.stars}
                    </span>
                  )}
                  {integration.transport && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {integration.transport}
                    </span>
                  )}
                </div>

                {/* Action Button */}
                {isConnected ? (
                  <button
                    onClick={() => openConnect(integration)}
                    className="px-4 py-2 text-sm bg-dark-hover border border-dark-border rounded-lg text-gray-300 hover:border-gray-500 transition-colors"
                  >
                    Manage
                  </button>
                ) : (
                  <button
                    onClick={() => openConnect(integration)}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-dark-sidebar border border-dark-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white ${getLetterColor(selected.name)}`}>
                  {selected.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-gray-200">{selected.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selected.description && (
              <p className="text-sm text-gray-500 mb-5">{selected.description}</p>
            )}

            <div className="space-y-4">
              {(selected.configSchema || []).map((field: ConfigField) => (
                <div key={field.field}>
                  <label className="block text-sm text-gray-400 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={configValues[field.field] || ''}
                    onChange={(e) => setConfigValues({ ...configValues, [field.field]: e.target.value })}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              ))}

              {(selected.configSchema || []).length === 0 && (
                <p className="text-sm text-gray-500">No configuration required for this integration.</p>
              )}

              {saveError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{saveError}</p>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                  <p className="text-green-400 text-sm">✅ {saveSuccess}</p>
                  {saveSuccess.includes('Restart') && (
                    <button
                      onClick={() => {
                        setSelected(null);
                        setSaveSuccess(null);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Done
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : (<><CheckCircle className="w-4 h-4" /> Save & Connect</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom MCP Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-dark-sidebar border border-dark-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-200">Add Custom MCP Server</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Server URL</label>
                <input
                  placeholder="https://mcp.example.com/sse"
                  className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Transport</label>
                <select className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50">
                  <option value="stdio">stdio</option>
                  <option value="sse">SSE</option>
                </select>
              </div>
              <button className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
                Add Integration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
