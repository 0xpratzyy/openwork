import { useState, useEffect, useRef } from 'react';
import { Activity as ActivityIcon, Bot, Filter } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeleton';

interface LogEntry {
  id: string;
  agentId: string;
  action: string;
  details?: string;
  timestamp: string;
}

const actionIcons: Record<string, string> = {
  approval_created: '🔒',
  approval_approved: '✅',
  approval_rejected: '❌',
  deploy: '🚀',
  create: '➕',
  update: '✏️',
  delete: '🗑️',
  read: '👁️',
};

export default function Activity() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(() => {
        // Activity log endpoint would go here - for now initialize empty
        setLogs([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filtered = logs.filter((l) => !filterAgent || l.agentId.includes(filterAgent));

  if (loading) return <ListSkeleton />;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Filter */}
      <div className="flex gap-3 mb-4 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            placeholder="Filter by agent..."
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-dark-card border border-dark-border rounded-lg p-1 font-mono text-xs"
      >
        {filtered.length === 0 ? (
          <EmptyState title="No activity yet" description="Agent actions will appear here in real-time." />
        ) : (
          <div className="space-y-0.5">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 px-3 py-2 hover:bg-dark-hover rounded"
              >
                <span className="text-gray-600 shrink-0 w-36">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="shrink-0">
                  {actionIcons[log.action.split(':')[0]] || '📋'}
                </span>
                <span className="text-indigo-400 shrink-0 w-28 truncate">{log.agentId}</span>
                <span className="text-gray-400">{log.action}</span>
                {log.details && (
                  <span className="text-gray-600 truncate">{log.details}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
