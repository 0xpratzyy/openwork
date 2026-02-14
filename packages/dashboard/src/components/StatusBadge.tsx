const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  online: 'bg-green-500/20 text-green-400',
  healthy: 'bg-green-500/20 text-green-400',
  connected: 'bg-green-500/20 text-green-400',
  completed: 'bg-green-500/20 text-green-400',
  approved: 'bg-green-500/20 text-green-400',
  low: 'bg-green-500/20 text-green-400',

  degraded: 'bg-yellow-500/20 text-yellow-400',
  configured: 'bg-yellow-500/20 text-yellow-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  running: 'bg-blue-500/20 text-blue-400',
  medium: 'bg-yellow-500/20 text-yellow-400',

  offline: 'bg-gray-500/20 text-gray-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  disconnected: 'bg-gray-500/20 text-gray-400',

  error: 'bg-red-500/20 text-red-400',
  failed: 'bg-red-500/20 text-red-400',
  rejected: 'bg-red-500/20 text-red-400',
  high: 'bg-red-500/20 text-red-400',
};

export function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || 'bg-gray-500/20 text-gray-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
