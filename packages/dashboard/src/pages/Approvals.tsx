import { useState } from 'react';
import { Check, X, Shield } from 'lucide-react';
import { useFetch, apiPost } from '../hooks';
import { StatusBadge } from '../components/StatusBadge';
import { ListSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface Approval {
  id: string;
  agentId: string;
  action: string;
  riskLevel: string;
  status: string;
  metadata?: string;
  requestedAt: string;
  resolvedAt?: string;
  resolver?: string;
}

export default function Approvals() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const { data, loading, refetch } = useFetch<{ approvals: Approval[] }>('/approvals');
  const [filter, setFilter] = useState({ agent: '', risk: '' });

  const approvals = (data?.approvals || []).filter((a) => {
    if (tab === 'pending' && a.status !== 'pending') return false;
    if (tab === 'history' && a.status === 'pending') return false;
    if (filter.agent && !a.agentId.includes(filter.agent)) return false;
    if (filter.risk && a.riskLevel !== filter.risk) return false;
    return true;
  });

  const handleResolve = async (id: string, action: 'approve' | 'reject') => {
    await apiPost(`/approvals/${id}/resolve`, { action, resolvedBy: 'dashboard-user' });
    refetch();
  };

  if (loading) return <ListSkeleton />;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(['pending', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors ${
              tab === t ? 'bg-indigo-500/20 text-indigo-400' : 'bg-dark-card text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Filter by agent..."
          value={filter.agent}
          onChange={(e) => setFilter({ ...filter, agent: e.target.value })}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
        />
        <select
          value={filter.risk}
          onChange={(e) => setFilter({ ...filter, risk: e.target.value })}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {approvals.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'No pending approvals' : 'No approval history'}
          description={tab === 'pending' ? 'All clear! No actions waiting for approval.' : 'No approvals have been processed yet.'}
        />
      ) : (
        <div className="space-y-3">
          {approvals.map((a) => (
            <div key={a.id} className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center gap-4">
              <Shield className="w-5 h-5 text-gray-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-200 text-sm">{a.action}</span>
                  <StatusBadge status={a.riskLevel} />
                  {tab === 'history' && <StatusBadge status={a.status} />}
                </div>
                <p className="text-xs text-gray-500">
                  Agent: {a.agentId} · {new Date(a.requestedAt).toLocaleString()}
                  {a.resolver && ` · Resolved by ${a.resolver}`}
                </p>
              </div>
              {tab === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleResolve(a.id, 'approve')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm hover:border-green-500/40"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleResolve(a.id, 'reject')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm hover:border-red-500/40"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
