import { describe, it, expect, vi } from 'vitest';

vi.mock('../registry/index.js', () => ({
  getRegistryIntegration: vi.fn((id: string) => {
    if (id === 'github') return {
      id: 'github', name: 'GitHub', npmPackage: '@modelcontextprotocol/server-github',
      configSchema: [{ field: 'GITHUB_TOKEN', required: true }],
    };
    if (id === 'no-npm') return {
      id: 'no-npm', name: 'Custom', githubRepo: 'foo/bar',
      configSchema: [{ field: 'TOKEN', required: false }],
    };
    return undefined;
  }),
}));

describe('Health Checker', () => {
  it('returns error for unknown integration', async () => {
    const { checkIntegrationHealth } = await import('../health/index.js');
    const result = await checkIntegrationHealth('nonexistent', {});
    expect(result.status).toBe('error');
    expect(result.message).toContain('Unknown integration');
  });

  it('returns error for missing required config', async () => {
    const { checkIntegrationHealth } = await import('../health/index.js');
    const result = await checkIntegrationHealth('github', {});
    expect(result.status).toBe('error');
    expect(result.message).toContain('Missing required config');
    expect(result.message).toContain('GITHUB_TOKEN');
  });

  it('returns degraded for repo-based server with config', async () => {
    const { checkIntegrationHealth } = await import('../health/index.js');
    const result = await checkIntegrationHealth('no-npm', { TOKEN: 'abc' });
    expect(result.status).toBe('degraded');
  });
});
