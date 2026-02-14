import { useState } from 'react';
import { Search, Plus, X, Plug, CheckCircle, AlertCircle } from 'lucide-react';
import { useFetch, apiPost } from '../hooks';
import { StatusBadge } from '../components/StatusBadge';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface Integration {
  id: string;
  agentId: string;
  type: string;
  status: string;
  hasConfig: boolean;
}

const categories = ['All', 'Engineering', 'Marketing', 'Sales', 'Support', 'Ops'];

export default function Integrations() {
  const { data, loading, refetch } = useFetch<{ integrations: Integration[] }>('/integrations');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const integrations = (data?.integrations || []).filter((i) =>
    i.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfigure = async () => {
    if (!selected) return;
    setTesting(true);
    await apiPost(`/integrations/${selected.id}/configure`, { config: { apiKey } });
    setTesting(false);
    setSelected(null);
    setApiKey('');
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-full max-w-md rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                category === c
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-dark-card text-gray-500 hover:text-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Custom MCP
        </button>
      </div>

      {integrations.length === 0 ? (
        <EmptyState title="No integrations" description="Configure integrations through the setup wizard." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((int) => (
            <button
              key={int.id}
              onClick={() => { setSelected(int); setApiKey(''); }}
              className="bg-dark-card border border-dark-border rounded-lg p-5 text-left hover:border-indigo-500/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Plug className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-200 capitalize">{int.type}</span>
                <StatusBadge status={int.status} />
              </div>
              <p className="text-xs text-gray-600">Agent: {int.agentId}</p>
              <p className="text-xs text-gray-600 mt-1">
                {int.hasConfig ? '✓ Configured' : '○ Not configured'}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Config Panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-dark-sidebar border border-dark-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-200 capitalize">{selected.type} Configuration</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key / Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key..."
                  className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfigure}
                  disabled={testing || !apiKey}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {testing ? 'Testing...' : (<><CheckCircle className="w-4 h-4" /> Save & Test</>)}
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
