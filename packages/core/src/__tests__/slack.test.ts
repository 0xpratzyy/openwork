import { describe, it, expect } from 'vitest';
import {
  formatApprovalMessage,
  formatAgentResponse,
  formatStatusMessage,
  formatErrorMessage,
  formatTaskProgress,
  parseCallbackAction,
} from '../slack/index.js';

describe('Slack Formatters', () => {
  describe('formatApprovalMessage', () => {
    it('generates blocks with approve/reject buttons', () => {
      const msg = formatApprovalMessage({
        id: 'ap-1',
        agentId: 'eng-1',
        action: 'deploy',
        description: 'Deploy to prod',
        riskLevel: 'high',
        status: 'pending',
        requestedAt: new Date(),
        resolvedAt: null,
        resolver: null,
      }) as any;

      expect(msg.blocks).toBeDefined();
      expect(msg.blocks.length).toBeGreaterThan(0);
      const actions = msg.blocks.find((b: any) => b.type === 'actions');
      expect(actions).toBeDefined();
      expect(actions.elements).toHaveLength(2);
    });
  });

  describe('formatAgentResponse', () => {
    it('generates blocks with agent message', () => {
      const msg = formatAgentResponse('Engineering', 'PR merged', { role: 'engineering' }) as any;
      expect(msg.blocks).toBeDefined();
      expect(msg.blocks[0].text.text).toContain('Engineering');
    });
  });

  describe('formatStatusMessage', () => {
    it('shows all agents', () => {
      const msg = formatStatusMessage([
        { id: 'eng-1', name: 'Engineering', role: 'engineering', status: 'active' },
        { id: 'mkt-1', name: 'Marketing', role: 'marketing', status: 'inactive' },
      ]) as any;
      expect(msg.blocks).toBeDefined();
      const section = msg.blocks.find((b: any) => b.type === 'section');
      expect(section.text.text).toContain('Engineering');
      expect(section.text.text).toContain('Marketing');
    });
  });

  describe('formatErrorMessage', () => {
    it('formats string error', () => {
      const msg = formatErrorMessage('something broke') as any;
      expect(msg.blocks[0].text.text).toContain('something broke');
    });

    it('formats Error object', () => {
      const msg = formatErrorMessage(new Error('bad')) as any;
      expect(msg.blocks[0].text.text).toContain('bad');
    });
  });

  describe('formatTaskProgress', () => {
    it('shows task info', () => {
      const msg = formatTaskProgress({
        id: 't1',
        description: 'Fix bug',
        status: 'running',
        agentId: 'eng-1',
        progress: 50,
      }) as any;
      expect(msg.blocks[0].text.text).toContain('Fix bug');
      expect(msg.blocks[0].text.text).toContain('50%');
    });
  });

  describe('parseCallbackAction', () => {
    it('parses valid callback', () => {
      const data = JSON.stringify({ approvalId: 'ap-1', action: 'approve' });
      const result = parseCallbackAction(data);
      expect(result.approvalId).toBe('ap-1');
      expect(result.action).toBe('approve');
    });

    it('throws on invalid callback', () => {
      expect(() => parseCallbackAction('{}')).toThrow('Invalid callback data');
    });

    it('throws on bad JSON', () => {
      expect(() => parseCallbackAction('not json')).toThrow();
    });
  });
});
