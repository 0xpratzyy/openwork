import { useState } from 'react';
import { Folder, Database, Bot, Plug, AlertTriangle } from 'lucide-react';
import { useFetch } from '../hooks';
import { CardSkeleton } from '../components/Skeleton';

interface Status {
  openclawRunning: boolean;
  agentCount: number;
  integrationCount: number;
}

export default function Settings() {
  const { data, loading } = useFetch<Status>('/status');
  const [confirming, setConfirming] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const status = data || { openclawRunning: false, agentCount: 0, integrationCount: 0 };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Folder className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Config Path</span>
          </div>
          <p className="text-sm text-gray-200 font-mono">~/.openclaw/openclaw.json</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Database</span>
          </div>
          <p className="text-sm text-gray-200 font-mono">~/.openwork/openwork.db</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Agents</span>
          </div>
          <p className="text-2xl font-bold text-gray-200">{status.agentCount}</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Plug className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Integrations</span>
          </div>
          <p className="text-2xl font-bold text-gray-200">{status.integrationCount}</p>
        </div>
      </div>

      {/* OpenClaw Status */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${status.openclawRunning ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-200">
            OpenClaw Gateway: {status.openclawRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-medium text-red-400">Danger Zone</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Reset All Agents</p>
              <p className="text-xs text-gray-600">Remove all agents and their workspaces.</p>
            </div>
            {confirming === 'agents' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(null)}
                  className="px-3 py-1.5 text-xs bg-dark-card border border-dark-border rounded text-gray-400"
                >
                  Cancel
                </button>
                <button className="px-3 py-1.5 text-xs bg-red-600 rounded text-white">
                  Confirm
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming('agents')}
                className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:border-red-500/40"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Clear Database</p>
              <p className="text-xs text-gray-600">Delete all data from the local database.</p>
            </div>
            {confirming === 'db' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(null)}
                  className="px-3 py-1.5 text-xs bg-dark-card border border-dark-border rounded text-gray-400"
                >
                  Cancel
                </button>
                <button className="px-3 py-1.5 text-xs bg-red-600 rounded text-white">
                  Confirm
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming('db')}
                className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/20 rounded text-red-400 hover:border-red-500/40"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
