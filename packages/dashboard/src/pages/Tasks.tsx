import { useState } from 'react';
import { ListTodo, ChevronDown, ChevronRight } from 'lucide-react';
import { useFetch } from '../hooks';
import { StatusBadge } from '../components/StatusBadge';
import { ListSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface Task {
  id: string;
  agentId: string;
  description: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export default function Tasks() {
  const { data, loading } = useFetch<{ tasks: Task[] }>('/agents'); // tasks come from agents endpoint for now
  const [filter, setFilter] = useState({ agent: '', status: '' });
  const [expanded, setExpanded] = useState<string | null>(null);

  // We'll fetch tasks separately when the endpoint exists, for now show placeholder
  if (loading) return <ListSkeleton />;

  const tasks: Task[] = []; // TODO: wire to /api/tasks when endpoint added

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Filter by agent..."
          value={filter.agent}
          onChange={(e) => setFilter({ ...filter, agent: e.target.value })}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Tasks will appear here as agents start working." />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="bg-dark-card border border-dark-border rounded-lg">
              <button
                onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                className="w-full p-4 flex items-center gap-4 text-left"
              >
                {expanded === task.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <ListTodo className="w-4 h-4 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{task.description}</p>
                  <p className="text-xs text-gray-600">
                    {task.agentId} · {new Date(task.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </button>
              {expanded === task.id && (
                <div className="px-4 pb-4 pt-0 border-t border-dark-border ml-12 space-y-2">
                  <p className="text-sm text-gray-400">{task.description}</p>
                  <p className="text-xs text-gray-600">
                    Created: {new Date(task.createdAt).toLocaleString()}
                    {task.completedAt && ` · Completed: ${new Date(task.completedAt).toLocaleString()}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
