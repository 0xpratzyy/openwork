import { describe, it, expect, beforeEach } from 'vitest';
import { ApprovalEngine, clearApprovals } from '../approval/index.js';

describe('ApprovalEngine', () => {
  let engine: ApprovalEngine;

  beforeEach(() => {
    clearApprovals();
    engine = new ApprovalEngine();
  });

  it('should auto-approve low risk requests', () => {
    const req = engine.createApprovalRequest('agent-1', 'read', 'Read some data', 'low');
    expect(req.status).toBe('approved');
    expect(req.resolver).toBe('system:auto');
  });

  it('should leave medium risk as pending', () => {
    const req = engine.createApprovalRequest('agent-1', 'create', 'Create issue', 'medium');
    expect(req.status).toBe('pending');
  });

  it('should leave high risk as pending', () => {
    const req = engine.createApprovalRequest('agent-1', 'deploy', 'Deploy to prod', 'high');
    expect(req.status).toBe('pending');
  });

  it('should resolve a pending approval', () => {
    const req = engine.createApprovalRequest('agent-1', 'deploy', 'Deploy', 'high');
    const res = engine.resolveApproval(req.id, 'approve', 'admin');
    expect(res.status).toBe('approved');
    expect(res.resolvedBy).toBe('admin');
  });

  it('should reject a pending approval', () => {
    const req = engine.createApprovalRequest('agent-1', 'deploy', 'Deploy', 'high');
    const res = engine.resolveApproval(req.id, 'reject', 'admin');
    expect(res.status).toBe('rejected');
  });

  it('should check risk levels correctly', () => {
    const rules = { deploy: 'high' as const, read: 'low' as const };
    expect(engine.checkRiskLevel(rules, 'deploy')).toBe('high');
    expect(engine.checkRiskLevel(rules, 'read')).toBe('low');
    expect(engine.checkRiskLevel(rules, 'unknown_action')).toBe('medium');
    expect(engine.checkRiskLevel({}, 'search')).toBe('low');
    expect(engine.checkRiskLevel({}, 'delete')).toBe('high');
  });

  it('isAutoApproved should only return true for low', () => {
    expect(engine.isAutoApproved('low')).toBe(true);
    expect(engine.isAutoApproved('medium')).toBe(false);
    expect(engine.isAutoApproved('high')).toBe(false);
  });
});
