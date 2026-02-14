import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

// Track calls
let execSyncMock = vi.fn(() => Buffer.from('0.1.0'));

vi.mock('node:child_process', () => ({
  execSync: (...args: any[]) => execSyncMock(...args),
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => { throw new Error('ENOENT'); }),
  rmSync: vi.fn(),
  copyFileSync: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: () => '/tmp/test-home',
}));

describe('Generator', () => {
  const template = {
    id: 'engineering',
    name: 'Engineering Agent',
    description: 'Handles eng tasks',
    persona: 'You are an engineering agent.',
    instructions: '# Engineering\n\nDo engineering things.',
    skills: ['github', 'linear'],
    mcpServers: [],
    tools: [],
    approvalRules: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    execSyncMock = vi.fn(() => Buffer.from('0.1.0'));
  });

  it('generateAgent creates workspace files', async () => {
    const { generateAgent } = await import('../generator/index.js');

    const result = await generateAgent(template);

    expect(result.id).toBe('engineering');
    expect(result.name).toBe('Engineering Agent');
    expect(result.role).toBe('engineering');
    expect(result.workspacePath).toContain('workspace-engineering');

    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('SOUL.md'),
      expect.stringContaining('Engineering Agent'),
      'utf-8'
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('AGENTS.md'),
      expect.stringContaining('Engineering'),
      'utf-8'
    );
    expect(mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('skills/github'),
      expect.any(Object)
    );
  });

  it('generateAgent throws if openclaw not found', async () => {
    execSyncMock = vi.fn(() => { throw new Error('not found'); });

    const { generateAgent } = await import('../generator/index.js');
    await expect(generateAgent(template)).rejects.toThrow('OpenClaw CLI not found');
  });

  it('generateAgent throws if workspace exists', async () => {
    const { existsSync } = await import('node:fs');
    vi.mocked(existsSync).mockReturnValue(true);

    const { generateAgent } = await import('../generator/index.js');
    await expect(generateAgent(template)).rejects.toThrow('already exists');
  });

  it('generateAgent with skipCreate skips openclaw agents add', async () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const { generateAgent } = await import('../generator/index.js');
    await generateAgent(template, { skipCreate: true });

    // execSync should only be called for version check, not for agents add
    const calls = execSyncMock.mock.calls;
    const addCalls = calls.filter((c: any) => String(c[0]).includes('agents add'));
    expect(addCalls).toHaveLength(0);
  });

  it('generateAgent uses custom name', async () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const { generateAgent } = await import('../generator/index.js');
    const result = await generateAgent(template, { name: 'my-eng' });
    expect(result.id).toBe('my-eng');
    expect(result.workspacePath).toContain('workspace-my-eng');
  });
});
