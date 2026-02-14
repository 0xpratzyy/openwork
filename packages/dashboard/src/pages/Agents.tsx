import { useState } from 'react';
import { Bot, RefreshCw, Settings, Trash2, X } from 'lucide-react';
import { useFetch, apiDelete } from '../hooks';
import { StatusBadge } from '../components/StatusBadge';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  workspacePath?: string;
  createdAt: string;
}

const roleIcons: Record<string, string> = {
  engineering: '⚙️',
  marketing: '📢',
  sales: '💰',
  support: '🎧',
  ops: '📊',
  router: '🔀',
};

export default function Agents() {
  const { data, loading, refetch } = useFetch<{ agents: Agent[] }>('/agents');
  const [selected, setSelected] = useState<Agent | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this agent?')) return;
    await apiDelete(`/agents/${id}`);
    setSelected(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const agents = data?.agents || [];

  if (agents.length === 0) {
    return <EmptyState title="No agents yet" description="Run the setup wizard to create your first AI team." />;
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelected(agent)}
            className="bg-dark-card border border-dark-border rounded-lg p-5 text-left hover:border-indigo-500/30 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{roleIcons[agent.role] || '🤖'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-200 truncate">{agent.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{agent.role}</p>
              </div>
              <StatusBadge status={agent.status} />
            </div>
            <div className="text-xs text-gray-600">
              Created {new Date(agent.createdAt).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md bg-dark-sidebar border-l border-dark-border h-full overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-200">Agent Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{roleIcons[selected.role] || '🤖'}</span>
                <div>
                  <h4 className="font-medium text-gray-200">{selected.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">{selected.role}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-400 mb-1">Workspace</h5>
                <p className="text-xs text-gray-600 font-mono">{selected.workspacePath || 'N/A'}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-400 mb-1">Created</h5>
                <p className="text-sm text-gray-500">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-dark-border">
                <button className="flex items-center gap-2 px-3 py-2 text-sm bg-dark-card border border-dark-border rounded-lg hover:border-gray-500 text-gray-400">
                  <RefreshCw className="w-3.5 h-3.5" /> Restart
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm bg-dark-card border border-dark-border rounded-lg hover:border-gray-500 text-gray-400">
                  <Settings className="w-3.5 h-3.5" /> Reconfigure
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 border border-red-500/20 rounded-lg hover:border-red-500/40 text-red-400 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
