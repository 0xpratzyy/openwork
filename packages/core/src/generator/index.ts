/**
 * Agent Workspace Generator
 *
 * Creates fully configured OpenClaw agent workspaces from role templates.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
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

export interface SlackConfig {
  /** Slack channel ID or name the router is bound to */
  channel?: string;
}

export interface RouterAgentResult extends GeneratedAgent {
  specialistsIncluded: string[];
}

/**
 * Generate the router agent workspace.
 * The router gets a dynamically generated AGENTS.md that lists all available specialists.
 */
export async function generateRouterAgent(
  specialists: GeneratedAgent[],
  slackConfig: SlackConfig = {},
  options: GenerateOptions = {}
): Promise<RouterAgentResult> {
  const agentName = 'router';
  const openclawDir = join(homedir(), '.openclaw');
  const workspacePath = join(openclawDir, `workspace-${agentName}`);

  // Check OpenClaw
  try {
    execSync('openclaw --version', { stdio: 'pipe' });
  } catch {
    throw new Error('OpenClaw CLI not found. Please install OpenClaw first: https://docs.openclaw.dev');
  }

  if (existsSync(workspacePath) && !options.skipCreate) {
    // Overwrite workspace files but don't error — router is re-generated on each setup
    options = { ...options, skipCreate: false };
    try {
      execSync(`openclaw agents add ${agentName}`, { stdio: 'pipe' });
    } catch {
      // Agent may already exist, that's fine
    }
  } else if (!options.skipCreate) {
    try {
      execSync(`openclaw agents add ${agentName}`, { stdio: 'pipe' });
    } catch {
      // Agent may already exist
    }
  }

  mkdirSync(workspacePath, { recursive: true });

  // Write SOUL.md — load from the router template directory
  const routerSoulPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'agents', 'src', 'router', 'SOUL.md');
  let soulContent: string;
  try {
    soulContent = readFileSync(routerSoulPath, 'utf-8');
  } catch {
    soulContent = `# Router Agent\n\nYou are the OpenWork Router — the central coordinator for a team of specialist AI agents.\nYou delegate tasks to specialists. You do not execute tasks yourself.\n`;
  }
  writeFileSync(join(workspacePath, 'SOUL.md'), soulContent, 'utf-8');

  // Generate dynamic AGENTS.md with routing table
  const routerAgentsBase = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'agents', 'src', 'router', 'AGENTS.md');
  let agentsContent: string;
  try {
    agentsContent = readFileSync(routerAgentsBase, 'utf-8');
  } catch {
    agentsContent = '# Router Agent — Routing Instructions\n\n';
  }

  // Replace the routing table placeholder with actual specialist data
  const routingTable = generateRoutingTable(specialists);
  agentsContent = agentsContent.replace(
    /## Routing Table[\s\S]*$/,
    `## Routing Table\n\n${routingTable}`
  );

  writeFileSync(join(workspacePath, 'AGENTS.md'), agentsContent, 'utf-8');

  // Create skills directory (router has no skills but keep the structure)
  mkdirSync(join(workspacePath, 'skills'), { recursive: true });

  return {
    id: agentName,
    name: 'Router Agent',
    role: 'router',
    workspacePath,
    specialistsIncluded: specialists.map((s) => s.id),
  };
}

/**
 * Generate a markdown routing table from specialist agent data.
 */
function generateRoutingTable(specialists: GeneratedAgent[]): string {
  if (specialists.length === 0) {
    return '_No specialists configured yet. Run setup to add agents._\n';
  }

  let table = '| Agent ID | Role | Route When |\n|----------|------|------------|\n';

  const roleDescriptions: Record<string, string> = {
    engineering: 'Code, PRs, issues, errors, deployments, CI/CD',
    marketing: 'Ads, campaigns, social media, analytics, content',
    sales: 'CRM, deals, pipeline, leads, outreach',
    support: 'Docs, knowledge base, tickets, customer responses',
    ops: 'Payments, billing, spreadsheets, reports, files',
  };

  for (const spec of specialists) {
    const desc = roleDescriptions[spec.role] || spec.role;
    table += `| \`${spec.id}\` | ${spec.name} | ${desc} |\n`;
  }

  table += '\n### Available Specialists\n\n';
  for (const spec of specialists) {
    table += `- **${spec.name}** (\`${spec.id}\`): Use \`sessions_spawn\` with agent="${spec.id}" to delegate tasks.\n`;
  }

  return table;
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
