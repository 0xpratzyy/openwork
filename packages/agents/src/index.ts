import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { RoleTemplate } from './types.js';

export type { RoleTemplate, McpServerConfig, RiskLevel } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatesDir = join(__dirname, '..', 'templates');

/** All available role IDs */
export const ROLE_IDS = ['engineering', 'marketing', 'sales', 'support', 'ops'] as const;
export type RoleId = (typeof ROLE_IDS)[number];

/**
 * Load a role template by ID.
 * @throws if the role ID is not found
 */
export function loadTemplate(roleId: string): RoleTemplate {
  if (!ROLE_IDS.includes(roleId as RoleId)) {
    throw new Error(`Unknown role template: "${roleId}". Available: ${ROLE_IDS.join(', ')}`);
  }
  const filePath = join(templatesDir, `${roleId}.json`);
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as RoleTemplate;
}

/**
 * Load all available role templates.
 */
export function loadAllTemplates(): RoleTemplate[] {
  return ROLE_IDS.map(loadTemplate);
}
