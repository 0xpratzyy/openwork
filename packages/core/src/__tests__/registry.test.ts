import { describe, it, expect } from 'vitest';
import { getRegistryIntegration, listRegistryIntegrations, searchRegistryIntegrations } from '../registry/index.js';

describe('Registry', () => {
  it('should get an integration by ID', () => {
    const github = getRegistryIntegration('github');
    expect(github).toBeDefined();
    expect(github!.name).toBe('GitHub');
    expect(github!.transport).toBe('stdio');
    expect(github!.tools.length).toBeGreaterThan(0);
    expect(github!.configSchema.length).toBeGreaterThan(0);
  });

  it('should return undefined for unknown ID', () => {
    expect(getRegistryIntegration('nonexistent')).toBeUndefined();
  });

  it('should list all integrations', () => {
    const all = listRegistryIntegrations();
    expect(all.length).toBeGreaterThanOrEqual(20);
  });

  it('should filter by category', () => {
    const eng = listRegistryIntegrations('engineering');
    expect(eng.length).toBeGreaterThan(0);
    expect(eng.every((i) => i.categories.includes('engineering'))).toBe(true);

    const sales = listRegistryIntegrations('sales');
    expect(sales.length).toBeGreaterThan(0);
    expect(sales.every((i) => i.categories.includes('sales'))).toBe(true);
  });

  it('should search by name', () => {
    const results = searchRegistryIntegrations('github');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('github');
  });

  it('should search by description', () => {
    const results = searchRegistryIntegrations('payment');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.id === 'stripe')).toBe(true);
  });

  it('should search by tool name', () => {
    const results = searchRegistryIntegrations('create_issue');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('every integration has required fields', () => {
    const all = listRegistryIntegrations();
    for (const int of all) {
      expect(int.id).toBeTruthy();
      expect(int.name).toBeTruthy();
      expect(int.description).toBeTruthy();
      expect(int.transport).toMatch(/^(stdio|sse)$/);
      expect(int.status).toMatch(/^(verified|community|beta)$/);
      expect(int.categories.length).toBeGreaterThan(0);
      expect(int.tools.length).toBeGreaterThan(0);
      expect(int.configSchema.length).toBeGreaterThan(0);
      expect(int.npmPackage || int.githubRepo).toBeTruthy();
    }
  });
});
