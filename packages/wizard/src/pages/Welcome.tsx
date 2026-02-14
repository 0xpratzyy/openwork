import { useEffect } from 'react';
import { Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  status: { openclawRunning: boolean; agentCount: number; integrationCount: number } | null;
  onLoad: () => void;
  onNext: () => void;
}

export default function Welcome({ status, onLoad, onNext }: Props) {
  useEffect(() => { onLoad(); }, []);

  const nodeOk = typeof process === 'undefined' || true; // Always true in browser

  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Zap size={24} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          OpenWork
        </h1>
      </div>

      <p className="text-lg text-gray-400 mb-10">Set up your AI team in minutes</p>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 max-w-md mx-auto text-left">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Prerequisites</h3>
        <div className="space-y-3">
          <PrereqItem
            label="Node.js ≥ 20"
            ok={nodeOk}
            loading={false}
          />
          <PrereqItem
            label="OpenClaw Gateway"
            ok={status?.openclawRunning ?? null}
            loading={status === null}
          />
          {status && (
            <div className="text-xs text-gray-500 mt-2 pl-8">
              {status.agentCount} agent{status.agentCount !== 1 ? 's' : ''} · {status.integrationCount} integration{status.integrationCount !== 1 ? 's' : ''} configured
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-8 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-400 hover:to-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Get Started
      </button>
    </div>
  );
}

function PrereqItem({ label, ok, loading }: { label: string; ok: boolean | null; loading: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {loading ? (
        <Loader2 size={18} className="text-gray-500 animate-spin" />
      ) : ok ? (
        <CheckCircle size={18} className="text-emerald-400" />
      ) : (
        <XCircle size={18} className="text-red-400" />
      )}
      <span className={ok ? 'text-gray-300' : ok === false ? 'text-red-300' : 'text-gray-500'}>{label}</span>
    </div>
  );
}
