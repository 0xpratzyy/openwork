import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plug, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api';

interface Status {
  openclawRunning: boolean;
  agentCount: number;
  integrationCount: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStatus()
      .then((s) => {
        if (s.agentCount === 0) {
          navigate('/setup', { replace: true });
          return;
        }
        setStatus(s);
      })
      .catch(() => {
        navigate('/setup', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading || !status) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Agents', value: status.agentCount, icon: Bot, color: 'text-indigo-400', link: '/agents' },
    { label: 'Integrations', value: status.integrationCount, icon: Plug, color: 'text-purple-400', link: '/integrations' },
    { label: 'Pending Approvals', value: 0, icon: ShieldCheck, color: 'text-yellow-400', link: '/approvals' },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => navigate(c.link)}
            className="bg-dark-card border border-dark-border rounded-lg p-5 text-left hover:border-indigo-500/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <c.icon className={`w-5 h-5 ${c.color}`} />
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-gray-200">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/integrations')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            Add Integration
          </button>
          <button
            onClick={() => navigate('/agents')}
            className="px-4 py-2.5 bg-dark-card border border-dark-border text-gray-300 text-sm rounded-lg hover:border-gray-500 transition-colors"
          >
            Manage Agents
          </button>
          <button
            onClick={() => navigate('/setup')}
            className="px-4 py-2.5 bg-dark-card border border-dark-border text-gray-300 text-sm rounded-lg hover:border-gray-500 transition-colors"
          >
            Run Setup
          </button>
        </div>
      </div>

      {/* Gateway Status */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${status.openclawRunning ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-200">
            OpenClaw Gateway: {status.openclawRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>
    </div>
  );
}
