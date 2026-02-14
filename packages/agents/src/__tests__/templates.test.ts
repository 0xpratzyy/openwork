import { describe, it, expect } from 'vitest';
import { loadTemplate, loadAllTemplates, ROLE_IDS } from '../index.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Agent Templates', () => {
  it('ROLE_IDS has exactly 5 roles', () => {
    expect(ROLE_IDS).toEqual(['engineering', 'marketing', 'sales', 'support', 'ops']);
  });

  it('loadAllTemplates returns 5 templates', () => {
    const all = loadAllTemplates();
    expect(all).toHaveLength(5);
  });

  it.each(['engineering', 'marketing', 'sales', 'support', 'ops'] as const)(
    '%s template has all required fields',
    (roleId) => {
      const t = loadTemplate(roleId);
      expect(t.id).toBe(roleId);
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.persona).toBeTruthy();
      expect(t.instructions).toBeTruthy();
      expect(Array.isArray(t.mcpServers)).toBe(true);
      expect(t.mcpServers.length).toBeGreaterThan(0);
      expect(Array.isArray(t.skills)).toBe(true);
      expect(t.skills.length).toBeGreaterThan(0);
      expect(typeof t.approvalRules).toBe('object');
    }
  );

  it('throws for invalid role', () => {
    expect(() => loadTemplate('nonexistent')).toThrow('Unknown role template: "nonexistent"');
    expect(() => loadTemplate('')).toThrow();
  });

  it('each mcpServer has required fields', () => {
    for (const t of loadAllTemplates()) {
      for (const mcp of t.mcpServers) {
        expect(mcp.id).toBeTruthy();
        expect(mcp.name).toBeTruthy();
        expect(mcp.npmPackage).toBeTruthy();
        expect(typeof mcp.env).toBe('object');
      }
    }
  });

  it('router template loads as valid JSON', () => {
    const routerPath = join(__dirname, '..', 'router', 'template.json');
    const raw = readFileSync(routerPath, 'utf-8');
    const router = JSON.parse(raw);
    expect(router.id).toBe('router');
    expect(router.name).toBeTruthy();
    expect(router.description).toBeTruthy();
    expect(router.persona).toBeTruthy();
  });

  it('approval rules values are valid risk levels', () => {
    const validLevels = ['low', 'medium', 'high'];
    for (const t of loadAllTemplates()) {
      for (const [action, level] of Object.entries(t.approvalRules)) {
        expect(validLevels).toContain(level);
      }
    }
  });
});
