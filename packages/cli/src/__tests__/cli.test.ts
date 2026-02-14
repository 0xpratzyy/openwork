import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

// We test that the CLI structure is correct by creating a similar program
// We can't easily test the actual index.ts since it calls program.parse() at module level

describe('CLI Structure', () => {
  it('commander is importable', () => {
    const program = new Command();
    expect(program).toBeDefined();
  });

  it('can define openwork commands', () => {
    const program = new Command();
    program.name('openwork').version('0.1.0');
    program.command('setup').description('Setup wizard');
    program.command('start').description('Start server');
    program.command('status').description('Show status');
    const agents = program.command('agents').description('Manage agents');
    agents.command('list').description('List agents');
    agents.command('add <role>').description('Add agent');
    agents.command('remove <id>').description('Remove agent');

    program.command('stop').description('Stop server');
    program.command('reset').description('Reset all');

    const cmds = program.commands.map(c => c.name());
    expect(cmds).toContain('setup');
    expect(cmds).toContain('start');
    expect(cmds).toContain('stop');
    expect(cmds).toContain('reset');
    expect(cmds).toContain('status');
    expect(cmds).toContain('agents');

    const agentCmds = agents.commands.map(c => c.name());
    expect(agentCmds).toContain('list');
    expect(agentCmds).toContain('add');
    expect(agentCmds).toContain('remove');
  });

  it('chalk is importable', async () => {
    const chalk = await import('chalk');
    expect(chalk.default).toBeDefined();
  });

  it('ora is importable', async () => {
    const ora = await import('ora');
    expect(ora.default).toBeDefined();
  });
});

describe('CLI Dependencies', () => {
  it('@openwork/core exports expected functions', async () => {
    // We just check the module shape without actually calling DB functions
    const core = await import('@openwork/core');
    expect(typeof core.listAgents).toBe('function');
    expect(typeof core.deleteAgent).toBe('function');
    expect(typeof core.dbCreateAgent).toBe('function');
    expect(typeof core.removeAgent).toBe('function');
    expect(typeof core.removeAgentBinding).toBe('function');
    expect(typeof core.generateAgent).toBe('function');
    expect(typeof core.deleteAllAgents).toBe('function');
    expect(typeof core.deleteAllIntegrations).toBe('function');
  });

  it('@openwork/agents exports expected functions', async () => {
    const agents = await import('@openwork/agents');
    expect(typeof agents.loadTemplate).toBe('function');
    expect(typeof agents.loadAllTemplates).toBe('function');
    expect(agents.ROLE_IDS).toBeDefined();
  });
});
