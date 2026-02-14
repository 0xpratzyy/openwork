#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';

const require = createRequire(import.meta.url);

const program = new Command();

const PID_DIR = join(homedir(), '.openwork');
const PID_FILE = join(PID_DIR, 'server.pid');

function writePid(pid: number) {
  const { mkdirSync } = await_import_fs();
  mkdirSync(PID_DIR, { recursive: true });
  writeFileSync(PID_FILE, String(pid), 'utf-8');
}

function readPid(): number | null {
  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch { return null; }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch { return false; }
}

function clearPid() {
  try { unlinkSync(PID_FILE); } catch { /* ignore */ }
}

function await_import_fs() {
  return { mkdirSync: require('fs').mkdirSync };
}

function askConfirmation(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

function openBrowser(url: string) {
  try {
    const platform = process.platform;
    if (platform === 'darwin') execSync(`open ${url}`);
    else if (platform === 'win32') execSync(`start ${url}`);
    else execSync(`xdg-open ${url}`);
  } catch {
    console.log(chalk.yellow(`Could not open browser. Visit: ${url}`));
  }
}

program
  .name('openwork')
  .description('OpenWork — open-source multi-agent AI coworker for teams')
  .version('0.1.0');

// ── start ──
program
  .command('start')
  .description('Start the OpenWork server and open dashboard')
  .action(async () => {
    const existingPid = readPid();
    if (existingPid && isProcessAlive(existingPid)) {
      console.log(chalk.yellow(`Server already running (PID ${existingPid}). Opening dashboard...`));
      openBrowser('http://localhost:18800');
      return;
    }

    console.log(chalk.cyan('🚀 Starting OpenWork server...\n'));
    try {
      const serverPath = require.resolve('@openwork/server/dist/index.js');
      writePid(process.pid);
      openBrowser('http://localhost:18800');
      await import(serverPath);
    } catch (err) {
      clearPid();
      console.error(chalk.red('Failed to start server:'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ── stop ──
program
  .command('stop')
  .description('Stop the OpenWork server')
  .action(() => {
    const pid = readPid();
    if (!pid) {
      console.log(chalk.yellow('No server PID file found. Server may not be running.'));
      return;
    }

    if (!isProcessAlive(pid)) {
      console.log(chalk.yellow(`Server process ${pid} is not running. Cleaning up PID file.`));
      clearPid();
      return;
    }

    try {
      process.kill(pid, 'SIGTERM');
      clearPid();
      console.log(chalk.green(`Server stopped (PID ${pid}).`));
    } catch (err) {
      console.error(chalk.red(`Failed to stop server (PID ${pid}):`), err instanceof Error ? err.message : String(err));
    }
  });

// ── status ──
program
  .command('status')
  .description('Show status of OpenClaw, agents, and integrations')
  .action(async () => {
    console.log(chalk.bold('\n📊 OpenWork Status\n'));

    const pid = readPid();
    if (pid && isProcessAlive(pid)) {
      console.log(chalk.green(`  ✓ Server: running (PID ${pid})`));
    } else {
      console.log(chalk.yellow('  ⚠ Server: not running'));
      if (pid) clearPid();
    }

    try {
      const version = execSync('openclaw --version', { stdio: 'pipe' }).toString().trim();
      console.log(chalk.green(`  ✓ OpenClaw: ${version}`));
    } catch {
      console.log(chalk.red('  ✗ OpenClaw: not found'));
    }

    try {
      execSync('openclaw gateway status', { stdio: 'pipe' });
      console.log(chalk.green('  ✓ Gateway: running'));
    } catch {
      console.log(chalk.yellow('  ⚠ Gateway: not running'));
    }

    try {
      const { listAgents } = await import('@openwork/core');
      const agents = listAgents();
      console.log(chalk.bold(`\n  Agents: ${agents.length}`));
      for (const agent of agents) {
        const statusIcon = agent.status === 'active' ? chalk.green('●') : chalk.gray('○');
        console.log(`    ${statusIcon} ${agent.name} (${agent.role}) — ${agent.status}`);
      }
      if (agents.length === 0) {
        console.log(chalk.gray('    No agents configured. Run: openwork start'));
      }
    } catch {
      console.log(chalk.gray('    Could not read agent config'));
    }

    console.log();
  });

// ── reset ──
program
  .command('reset')
  .description('Remove all agents and reset OpenWork')
  .action(async () => {
    try {
      const { listAgents, removeAllAgents, removeAgent } = await import('@openwork/core');
      const agents = listAgents();

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents configured. Nothing to reset.'));
        return;
      }

      const confirmed = await askConfirmation(
        chalk.yellow(`This will remove all ${agents.length} agent(s) and their data. Are you sure? (y/N) `)
      );

      if (!confirmed) {
        console.log(chalk.gray('Reset cancelled.'));
        return;
      }

      const spinner = ora('Resetting OpenWork...').start();

      for (const agent of agents) {
        try {
          await removeAgent(agent.id);
        } catch { /* best effort */ }
      }

      removeAllAgents();

      spinner.succeed(`Removed ${agents.length} agent(s). OpenWork has been reset.`);
    } catch (err) {
      console.error(chalk.red('Reset failed:'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ── agents ──
const agentsCmd = program
  .command('agents')
  .description('Manage specialist agents');

agentsCmd
  .command('list')
  .description('List all OpenWork-managed agents')
  .action(async () => {
    try {
      const { listAgents } = await import('@openwork/core');
      const agents = listAgents();

      if (agents.length === 0) {
        console.log(chalk.gray('\nNo agents configured yet.'));
        console.log(chalk.gray('Run: openwork start\n'));
        return;
      }

      console.log(chalk.bold(`\n📋 Agents (${agents.length}):\n`));
      for (const agent of agents) {
        const statusIcon = agent.status === 'active' ? chalk.green('●') : chalk.gray('○');
        const created = agent.createdAt
          ? new Date(agent.createdAt).toLocaleDateString()
          : 'unknown';
        console.log(`  ${statusIcon} ${chalk.bold(agent.name)} — ${agent.role} (${agent.status}) — created ${created}`);
      }
      console.log();
    } catch (err) {
      console.error(chalk.red('Error listing agents:'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

agentsCmd
  .command('add <role>')
  .description('Add a new specialist agent from a role template')
  .option('-n, --name <name>', 'Custom agent name')
  .action(async (role: string, opts: { name?: string }) => {
    const spinner = ora(`Creating ${role} agent...`).start();
    try {
      const { loadTemplate } = await import('@openwork/agents');
      const { generateAgent, dbCreateAgent } = await import('@openwork/core');

      const template = loadTemplate(role);
      spinner.text = `Generating workspace for ${template.name}...`;

      const result = await generateAgent(template, { name: opts.name });

      dbCreateAgent({
        id: result.id,
        role: result.role,
        name: result.name,
        workspacePath: result.workspacePath,
      });

      spinner.succeed(`Created ${chalk.bold(result.name)} agent`);
      console.log(chalk.gray(`  Workspace: ${result.workspacePath}`));
      console.log(chalk.gray(`  Role: ${result.role}`));
      console.log();
    } catch (err) {
      spinner.fail('Failed to create agent');
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

agentsCmd
  .command('remove <id>')
  .description('Remove an agent')
  .action(async (id: string) => {
    const spinner = ora(`Removing agent ${id}...`).start();
    try {
      const { removeAgent, removeAgentFromConfig, removeAgentBindings } = await import('@openwork/core');

      await removeAgent(id);
      removeAgentFromConfig(id);

      spinner.succeed(`Removed agent ${chalk.bold(id)}`);
    } catch (err) {
      spinner.fail('Failed to remove agent');
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

program.parse();
