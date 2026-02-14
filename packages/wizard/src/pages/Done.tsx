import { useEffect, useState } from 'react';
import { CheckCircle, ExternalLink, MessageSquare, Bot } from 'lucide-react';

interface Props {
  agents: Array<{ id: string; name: string; role: string }>;
}

const CONFETTI_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

export default function Done({ agents }: Props) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; color: string; delay: number; size: number }>>([]);

  useEffect(() => {
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 2,
      size: 4 + Math.random() * 8,
    }));
    setConfetti(pieces);
    const timer = setTimeout(() => setConfetti([]), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center relative overflow-hidden">
      {/* Confetti */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none"
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${2 + Math.random() * 2}s linear ${p.delay}s forwards`,
          }}
        />
      ))}

      <div className="animate-check-pop mb-6">
        <CheckCircle size={64} className="text-emerald-400 mx-auto" />
      </div>

      <h2 className="text-3xl font-bold mb-2">You're All Set!</h2>
      <p className="text-gray-400 mb-8">Your AI team is ready to go.</p>

      {agents.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8 max-w-md mx-auto text-left">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Created Agents</h3>
          <div className="space-y-2">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-1.5">
                <Bot size={16} className="text-indigo-400" />
                <div>
                  <span className="text-sm font-medium">{a.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{a.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-400 hover:to-purple-500"
        >
          <ExternalLink size={16} />
          Open Dashboard
        </a>
        <a
          href="https://slack.com/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5"
        >
          <MessageSquare size={16} />
          Add to Slack
        </a>
      </div>
    </div>
  );
}
