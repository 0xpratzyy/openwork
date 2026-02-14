import { useEffect, useRef } from 'react';
import { Loader2, CheckCircle, Terminal } from 'lucide-react';

interface Props {
  messages: string[];
  done: boolean;
  onNext: () => void;
}

export default function Progress({ messages, done, onNext }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const progress = done ? 100 : Math.min(95, messages.length * 20);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Setting Up</h2>
      <p className="text-gray-400 mb-6">Creating your AI team...</p>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Terminal-style log */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm max-h-64 overflow-y-auto">
        <div className="flex items-center gap-2 text-gray-500 mb-3">
          <Terminal size={14} />
          <span className="text-xs">openwork setup</span>
        </div>
        {messages.map((msg, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            {i === messages.length - 1 && !done ? (
              <Loader2 size={14} className="text-indigo-400 animate-spin mt-0.5 shrink-0" />
            ) : (
              <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
            )}
            <span className="text-gray-300">{msg}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {done && (
        <div className="mt-6 text-center">
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-400 hover:to-purple-500"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
