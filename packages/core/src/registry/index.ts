/**
 * MCP Server Registry
 *
 * Curated registry of community MCP servers with metadata, search, and filtering.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ConfigField {
  field: string;
  label: string;
  type: 'text' | 'password' | 'textarea';
  required: boolean;
  placeholder: string;
}

export interface RegistryTool {
  name: string;
  description: string;
}

export interface RegistryIntegration {
  id: string;
  name: string;
  description: string;
  npmPackage?: string;
  githubRepo?: string;
  transport: 'stdio' | 'sse';
  configSchema: ConfigField[];
  tools: RegistryTool[];
  categories: string[];
  status: 'verified' | 'community' | 'beta';
  stars: number;
}

let _cache: RegistryIntegration[] | null = null;

function loadRegistry(): RegistryIntegration[] {
  if (_cache) return _cache;
  const raw = readFileSync(join(__dirname, 'integrations.json'), 'utf-8');
  _cache = JSON.parse(raw) as RegistryIntegration[];
  return _cache;
}

/** Get a single integration by ID */
export function getRegistryIntegration(id: string): RegistryIntegration | undefined {
  return loadRegistry().find((i) => i.id === id);
}

/** List all integrations, optionally filtered by category */
export function listRegistryIntegrations(category?: string): RegistryIntegration[] {
  const all = loadRegistry();
  if (!category) return all;
  return all.filter((i) => i.categories.includes(category));
}

/** Search integrations by query (matches name, description, tool names) */
export function searchRegistryIntegrations(query: string): RegistryIntegration[] {
  const q = query.toLowerCase();
  return loadRegistry().filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.tools.some((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  );
}

/** Reset the cache (useful for testing) */
export function resetRegistryCache(): void {
  _cache = null;
}
