const BASE = import.meta.env.DEV ? 'http://localhost:18800' : '';

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getStatus: () => request<{ openclawRunning: boolean; agentCount: number; integrationCount: number; agents?: any[] }>('/api/status'),
  getRoles: () => request<{ roles: any[] }>('/api/roles'),
  setup: (body: { roles: string[]; integrations: Record<string, Record<string, Record<string, string>>> }) =>
    request<{ success: boolean; agents: any[] }>('/api/setup', { method: 'POST', body: JSON.stringify(body) }),
  getAgents: () => request<{ agents: any[] }>('/api/agents'),
  reset: () => request<{ success: boolean; removed: number }>('/api/setup/reset', { method: 'POST' }),
  getRegistry: (params?: { category?: string; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.category) sp.set('category', params.category);
    if (params?.q) sp.set('q', params.q);
    const qs = sp.toString();
    return request<{ integrations: any[] }>(`/api/registry${qs ? `?${qs}` : ''}`);
  },
};
