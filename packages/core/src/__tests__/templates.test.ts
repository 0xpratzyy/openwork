import { describe, it, expect } from 'vitest';
import { loadTemplate, loadAllTemplates, ROLE_IDS } from '@openwork/agents';

describe('Role Templates', () => {
  it('should load all 5 templates', () => {
    const all = loadAllTemplates();
    expect(all).toHaveLength(5);
  });

  it.each(['engineering', 'marketing', 'sales', 'support', 'ops'])('template %s has required fields', (roleId) => {
    const t = loadTemplate(roleId);
    expect(t.id).toBe(roleId);
    expect(t.name).toBeTruthy();
    expect(t.description).toBeTruthy();
    expect(t.persona).toBeTruthy();
    expect(t.instructions).toBeTruthy();
    expect(t.skills.length).toBeGreaterThan(0);
    expect(t.mcpServers.length).toBeGreaterThan(0);
    expect(t.tools.length).toBeGreaterThan(0);
    expect(t.approvalRules).toBeDefined();
    expect(typeof t.approvalRules).toBe('object');
  });

  it('should throw for unknown role', () => {
    expect(() => loadTemplate('nonexistent')).toThrow();
  });

  it('ROLE_IDS contains all 5 roles', () => {
    expect(ROLE_IDS).toEqual(['engineering', 'marketing', 'sales', 'support', 'ops']);
  });

  it('each mcp server has required fields', () => {
    const all = loadAllTemplates();
    for (const t of all) {
      for (const mcp of t.mcpServers) {
        expect(mcp.id).toBeTruthy();
        expect(mcp.name).toBeTruthy();
        expect(mcp.npmPackage).toBeTruthy();
        expect(mcp.env).toBeDefined();
      }
    }
  });
});
