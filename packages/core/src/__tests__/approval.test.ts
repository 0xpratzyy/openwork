import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApprovalEngine } from '../approval/index.js';

// Mock the DB functions
vi.mock('../db/index.js', () => {
  const store: Record<string, any> = {};
  let counter = 0;
  return {
    dbCreateApproval: vi.fn((data: any) => {
      const id = `ap-${++counter}`;
      const row = { id, ...data, status: 'pending', requestedAt: new Date(), resolvedAt: null, resolver: null };
      store[id] = row;
      return row;
    }),
    getApproval: vi.fn((id: string) => store[id] || null),
    listPendingApprovals: vi.fn(() => Object.values(store).filter((r: any) => r.status === 'pending')),
    dbResolveApproval: vi.fn((id: string, status: string, resolver: string) => {
      if (store[id]) {
        store[id].status = status;
        store[id].resolver = resolver;
        store[id].resolvedAt = new Date();
      }
    }),
    logAction: vi.fn(),
  };
});

describe('ApprovalEngine', () => {
  let engine: ApprovalEngine;

  beforeEach(() => {
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
