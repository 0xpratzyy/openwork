/**
 * Approval Engine
 *
 * In-memory approval workflow. No DB dependency.
 * Risk tiers: low (auto-approve), medium (single approver), high (admin required).
 */

export type RiskLevel = 'low' | 'medium' | 'high';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  agentId: string;
  action: string;
  description: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  metadata?: Record<string, unknown>;
  requestedAt: Date;
  resolvedAt?: Date | null;
  resolver?: string | null;
}

export interface ApprovalResolution {
  id: string;
  status: ApprovalStatus;
  resolvedBy: string;
  resolvedAt: Date;
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_ACTION_RISK: Record<string, RiskLevel> = {
  read: 'low', search: 'low', list: 'low', get: 'low', summarize: 'low',
  create_report: 'low', query: 'low',
  create: 'medium', update: 'medium', create_issue: 'medium', draft_email: 'medium',
  update_record: 'medium', schedule_post: 'medium',
  deploy: 'high', send_email: 'high', delete: 'high', modify_budget: 'high',
  merge_pull_request: 'high',
};

export function needsApproval(riskLevel: RiskLevel): boolean {
  return riskLevel !== 'low';
}

export function getApproverType(riskLevel: RiskLevel): 'none' | 'member' | 'admin' {
  switch (riskLevel) {
    case 'low': return 'none';
    case 'medium': return 'member';
    case 'high': return 'admin';
  }
}

// In-memory store for approvals
const _approvals = new Map<string, ApprovalRequest>();

/** Get an approval by ID */
export function getApproval(id: string): ApprovalRequest | undefined {
  return _approvals.get(id);
}

/** List all pending approvals */
export function listPendingApprovals(agentId?: string): ApprovalRequest[] {
  const all = Array.from(_approvals.values()).filter((a) => a.status === 'pending');
  return agentId ? all.filter((a) => a.agentId === agentId) : all;
}

/** Resolve an approval */
export function dbResolveApproval(id: string, status: 'approved' | 'rejected', resolver: string): void {
  const approval = _approvals.get(id);
  if (approval) {
    approval.status = status;
    approval.resolver = resolver;
    approval.resolvedAt = new Date();
  }
}

/** Clear all approvals (for testing) */
export function clearApprovals(): void {
  _approvals.clear();
}

export class ApprovalEngine {
  createApprovalRequest(
    agentId: string,
    action: string,
    description: string,
    riskLevel: RiskLevel,
    metadata?: Record<string, unknown>
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      id: genId(),
      agentId,
      action,
      description,
      riskLevel,
      status: 'pending',
      metadata: metadata ?? {},
      requestedAt: new Date(),
      resolvedAt: null,
      resolver: null,
    };

    _approvals.set(request.id, request);

    if (this.isAutoApproved(riskLevel)) {
      request.status = 'approved';
      request.resolver = 'system:auto';
      request.resolvedAt = new Date();
    }

    return request;
  }

  resolveApproval(
    approvalId: string,
    action: 'approve' | 'reject',
    resolvedBy: string
  ): ApprovalResolution {
    const existing = _approvals.get(approvalId);
    if (!existing) {
      throw new Error(`Approval ${approvalId} not found`);
    }
    if (existing.status !== 'pending') {
      throw new Error(`Approval ${approvalId} already resolved as ${existing.status}`);
    }

    const status: ApprovalStatus = action === 'approve' ? 'approved' : 'rejected';
    existing.status = status;
    existing.resolver = resolvedBy;
    existing.resolvedAt = new Date();

    return { id: approvalId, status, resolvedBy, resolvedAt: existing.resolvedAt };
  }

  getPendingApprovals(agentId?: string): ApprovalRequest[] {
    return listPendingApprovals(agentId);
  }

  getApprovalById(id: string): ApprovalRequest | undefined {
    return _approvals.get(id);
  }

  checkRiskLevel(approvalRules: Record<string, RiskLevel>, actionType: string): RiskLevel {
    if (approvalRules[actionType]) return approvalRules[actionType];
    if (DEFAULT_ACTION_RISK[actionType]) return DEFAULT_ACTION_RISK[actionType];
    for (const [prefix, level] of Object.entries(DEFAULT_ACTION_RISK)) {
      if (actionType.startsWith(prefix)) return level;
    }
    return 'medium';
  }

  isAutoApproved(riskLevel: RiskLevel): boolean {
    return riskLevel === 'low';
  }
}
