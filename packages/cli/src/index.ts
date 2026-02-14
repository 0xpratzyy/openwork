#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync, spawn } from 'node:child_process';

const program = new Command();

program
  .name('openwork')
  .description('OpenWork — open-source multi-agent AI coworker for teams')
  .version('0.1.0');

// ── setup ──
program
  .command('setup')
  .description('Launch the setup wizard to configure your AI team')
  .action(async () => {
    const spinner = ora('Starting OpenWork server...').start();
    try {
      // Start Express server in background
      const server = spawn('node', [require.resolve('@openwork/server/dist/index.js')], {
        stdio: 'ignore',
        detached: true,
      });
      server.unref();

      // Wait a moment for server to start
      await new Promise((r) => setTimeout(r, 1500));
      spinner.succeed('Server started on http://localhost:18800');

      console.log(chalk.cyan('\n🚀 Opening setup wizard in your browser...\n'));

      // Open browser
      const url = 'http://localhost:18800';
      try {
        const platform = process.platform;
        if (platform === 'darwin') execSync(`open ${url}`);
        else if (platform === 'win32') execSync(`start ${url}`);
        else execSync(`xdg-open ${url}`);
      } catch {
        console.log(chalk.yellow(`Could not open browser. Visit: ${url}`));
      }
    } catch (err) {
      spinner.fail('Failed to start server');
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

// ── start ──
program
  .command('start')
  .description('Start the OpenWork server (dashboard mode)')
  .action(async () => {
    console.log(chalk.cyan('🚀 Starting OpenWork server...\n'));
    try {
      // Import and run server inline
      const serverPath = require.resolve('@openwork/server/dist/index.js');
      await import(serverPath);
    } catch (err) {
      console.error(chalk.red('Failed to start server:'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ── status ──
program
  .command('status')
  .description('Show status of OpenClaw, agents, and integrations')
  .action(async () => {
    console.log(chalk.bold('\n📊 OpenWork Status\n'));

    // Check OpenClaw
    try {
      const version = execSync('openclaw --version', { stdio: 'pipe' }).toString().trim();
      console.log(chalk.green(`  ✓ OpenClaw: ${version}`));
    } catch {
      console.log(chalk.red('  ✗ OpenClaw: not found'));
    }

    // Check gateway
    try {
      execSync('openclaw gateway status', { stdio: 'pipe' });
      console.log(chalk.green('  ✓ Gateway: running'));
    } catch {
      console.log(chalk.yellow('  ⚠ Gateway: not running'));
    }

    // List agents from DB
    try {
      const { listAgents } = await import('@openwork/core');
      const agents = listAgents();
      console.log(chalk.bold(`\n  Agents: ${agents.length}`));
      for (const agent of agents) {
        const statusIcon = agent.status === 'active' ? chalk.green('●') : chalk.gray('○');
        console.log(`    ${statusIcon} ${agent.name} (${agent.role}) — ${agent.status}`);
      }
      if (agents.length === 0) {
        console.log(chalk.gray('    No agents configured. Run: openwork agents add <role>'));
      }
    } catch (err) {
      console.log(chalk.gray('    Could not read agent database'));
    }

    console.log();
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
        console.log(chalk.gray('Add one with: openwork agents add <role>\n'));
        console.log(chalk.gray('Available roles: engineering, marketing, sales, support, ops'));
        return;
      }

      console.log(chalk.bold(`\n📋 Agents (${agents.length}):\n`));
      for (const agent of agents) {
        const statusIcon = agent.status === 'active' ? chalk.green('●') : chalk.gray('○');
        const created = agent.createdAt instanceof Date
          ? agent.createdAt.toLocaleDateString()
          : new Date(agent.createdAt as number).toLocaleDateString();
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

      // Record in DB
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
      const { removeAgent, deleteAgent, removeAgentBinding } = await import('@openwork/core');

      await removeAgent(id);
      deleteAgent(id);
      removeAgentBinding(id);

      spinner.succeed(`Removed agent ${chalk.bold(id)}`);
    } catch (err) {
      spinner.fail('Failed to remove agent');
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });

program.parse();
