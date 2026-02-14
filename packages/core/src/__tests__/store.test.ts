import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TEST_DIR = join(tmpdir(), `openwork-store-test-${Date.now()}`);

// Mock homedir so store writes to our test dir
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => TEST_DIR };
});

describe('Store', () => {
  beforeEach(() => {
    mkdirSync(join(TEST_DIR, '.openclaw'), { recursive: true });
  });

  afterEach(() => {
    try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch {}
    vi.resetModules();
  });

  it('getAgents returns empty array when no config', async () => {
    const { getAgents } = await import('../store/index.js');
    expect(getAgents()).toEqual([]);
  });

  it('addAgent and getAgent work', async () => {
    const { addAgent, getAgent, getAgents } = await import('../store/index.js');
    addAgent({ id: 'eng-1', role: 'engineering', name: 'Eng Agent', status: 'active' });
    expect(getAgents()).toHaveLength(1);
    expect(getAgent('eng-1')?.name).toBe('Eng Agent');
  });

  it('addAgent upserts by id', async () => {
    const { addAgent, getAgent } = await import('../store/index.js');
    addAgent({ id: 'eng-1', role: 'engineering', name: 'V1', status: 'active' });
    addAgent({ id: 'eng-1', role: 'engineering', name: 'V2', status: 'active' });
    expect(getAgent('eng-1')?.name).toBe('V2');
  });

  it('removeAgentFromConfig removes agent and bindings', async () => {
    const { addAgent, addBinding, removeAgentFromConfig, getAgents, getBindings } = await import('../store/index.js');
    addAgent({ id: 'a1', role: 'eng', name: 'A1', status: 'active' });
    addBinding({ agentId: 'a1', match: { channel: 'slack' } });
    removeAgentFromConfig('a1');
    expect(getAgents()).toHaveLength(0);
    expect(getBindings()).toHaveLength(0);
  });

  it('patchConfig merges without duplicates', async () => {
    const { addAgent, patchConfig, getAgents, getBindings } = await import('../store/index.js');
    addAgent({ id: 'a1', role: 'eng', name: 'A1', status: 'active' });
    patchConfig(
      [{ id: 'a1' }, { id: 'a2' }],
      [{ agentId: 'a1', match: { channel: 'slack' } }, { agentId: 'a2', match: { channel: 'slack' } }]
    );
    expect(getAgents()).toHaveLength(2);
    expect(getBindings()).toHaveLength(2);
  });

  it('channels CRUD works', async () => {
    const { setChannel, getChannels, removeChannel } = await import('../store/index.js');
    setChannel('slack', { botToken: 'xoxb-123' });
    expect(getChannels().slack).toEqual({ botToken: 'xoxb-123' });
    removeChannel('slack');
    expect(getChannels().slack).toBeUndefined();
  });

  it('dbCreateAgent alias works', async () => {
    const { dbCreateAgent, listAgents } = await import('../store/index.js');
    const agent = dbCreateAgent({ role: 'eng', name: 'Eng', workspacePath: '/tmp/eng' });
    expect(agent.id).toBeTruthy();
    expect(agent.status).toBe('active');
    expect(listAgents()).toHaveLength(1);
  });

  it('removeAllAgents clears everything', async () => {
    const { addAgent, addBinding, removeAllAgents, getAgents, getBindings } = await import('../store/index.js');
    addAgent({ id: 'a1', role: 'eng', name: 'A1', status: 'active' });
    addBinding({ agentId: 'a1', match: { channel: 'slack' } });
    removeAllAgents();
    expect(getAgents()).toHaveLength(0);
    expect(getBindings()).toHaveLength(0);
  });
});
