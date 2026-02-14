/**
 * Agent Workspace Generator
 *
 * Creates fully configured OpenClaw agent workspaces from role templates.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { RoleTemplate } from '@openwork/agents';

export interface GenerateOptions {
  /** Override the agent name (defaults to template id) */
  name?: string;
  /** Skip the `openclaw agents add` step (useful if agent already exists) */
  skipCreate?: boolean;
}

export interface GeneratedAgent {
  id: string;
  name: string;
  role: string;
  workspacePath: string;
}

/**
 * Generate a complete OpenClaw agent workspace from a role template.
 *
 * 1. Runs `openclaw agents add <name>` to create the agent
 * 2. Writes SOUL.md with the role persona
 * 3. Writes AGENTS.md with role-specific instructions
 * 4. Creates skills/ directory
 * 5. Returns the created agent info
 */
export async function generateAgent(template: RoleTemplate, options: GenerateOptions = {}): Promise<GeneratedAgent> {
  const agentName = options.name || template.id;
  const openclawDir = join(homedir(), '.openclaw');
  const workspacePath = join(openclawDir, `workspace-${agentName}`);

  // Check if OpenClaw is available
  try {
    execSync('openclaw --version', { stdio: 'pipe' });
  } catch {
    throw new Error(
      'OpenClaw CLI not found. Please install OpenClaw first: https://docs.openclaw.dev'
    );
  }

  // Check if agent already exists
  if (existsSync(workspacePath) && !options.skipCreate) {
    throw new Error(
      `Agent workspace already exists at ${workspacePath}. Use a different name or remove it first.`
    );
  }

  // Step 1: Create the agent via OpenClaw CLI
  if (!options.skipCreate) {
    try {
      execSync(`openclaw agents add ${agentName}`, { stdio: 'pipe' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to create OpenClaw agent "${agentName}": ${msg}`);
    }
  }

  // Ensure workspace directory exists
  mkdirSync(workspacePath, { recursive: true });

  // Step 2: Write SOUL.md
  const soulContent = `# ${template.name}\n\n${template.persona}\n`;
  writeFileSync(join(workspacePath, 'SOUL.md'), soulContent, 'utf-8');

  // Step 3: Write AGENTS.md
  const agentsContent = template.instructions
    ? template.instructions
    : `# ${template.name}\n\nRole: ${template.description}\n`;
  writeFileSync(join(workspacePath, 'AGENTS.md'), agentsContent, 'utf-8');

  // Step 4: Create skills/ directory with placeholders
  const skillsDir = join(workspacePath, 'skills');
  mkdirSync(skillsDir, { recursive: true });
  for (const skill of template.skills) {
    const skillDir = join(skillsDir, skill);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `# ${skill}\n\nPlaceholder skill directory for ${skill} integration.\n`,
      'utf-8'
    );
  }

  return {
    id: agentName,
    name: template.name,
    role: template.id,
    workspacePath,
  };
}

/**
 * Remove an agent and clean up its workspace.
 */
export async function removeAgent(agentId: string): Promise<void> {
  const openclawDir = join(homedir(), '.openclaw');
  const workspacePath = join(openclawDir, `workspace-${agentId}`);

  // Try to remove via OpenClaw CLI
  try {
    execSync(`openclaw agents remove ${agentId}`, { stdio: 'pipe' });
  } catch {
    // Agent may not exist in OpenClaw, continue with cleanup
  }

  // Remove workspace directory
  if (existsSync(workspacePath)) {
    rmSync(workspacePath, { recursive: true, force: true });
  }
}
