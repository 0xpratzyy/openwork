/**
 * Approval Engine
 *
 * Full approval workflow: create requests, resolve them, check risk levels.
 * Risk tiers: low (auto-approve), medium (single approver), high (admin required).
 */

import {
  dbCreateApproval,
  getApproval as dbGetApproval,
  listPendingApprovals as dbListPending,
  dbResolveApproval,
  logAction,
} from '../db/index.js';

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

/** Default action-to-risk mappings used when a template doesn't specify */
const DEFAULT_ACTION_RISK: Record<string, RiskLevel> = {
  // Low — read-only / informational
  read: 'low',
  search: 'low',
  list: 'low',
  get: 'low',
  summarize: 'low',
  create_report: 'low',
  query: 'low',
  // Medium — creates/modifies records
  create: 'medium',
  update: 'medium',
  create_issue: 'medium',
  draft_email: 'medium',
  update_record: 'medium',
  schedule_post: 'medium',
  // High — destructive or external-facing
  deploy: 'high',
  send_email: 'high',
  delete: 'high',
  modify_budget: 'high',
  merge_pull_request: 'high',
};

/**
 * Determine if an action needs manual approval based on risk level.
 */
export function needsApproval(riskLevel: RiskLevel): boolean {
  return riskLevel !== 'low';
}

/**
 * Get the required approver type for a risk level.
 */
export function getApproverType(riskLevel: RiskLevel): 'none' | 'member' | 'admin' {
  switch (riskLevel) {
    case 'low':
      return 'none';
    case 'medium':
      return 'member';
    case 'high':
      return 'admin';
  }
}

/**
 * ApprovalEngine — encapsulates all approval workflow logic.
 */
export class ApprovalEngine {
  /**
   * Create a new approval request. If low risk, auto-approves immediately.
   */
  createApprovalRequest(
    agentId: string,
    action: string,
    description: string,
    riskLevel: RiskLevel,
    metadata?: Record<string, unknown>
  ): ApprovalRequest {
    const autoApproved = this.isAutoApproved(riskLevel);
    const row = dbCreateApproval({
      agentId,
      action,
      riskLevel,
      metadata: metadata ? JSON.stringify({ description, ...metadata }) : JSON.stringify({ description }),
    });

    const request: ApprovalRequest = {
      id: row.id,
      agentId: row.agentId,
      action: row.action,
      description,
      riskLevel: row.riskLevel as RiskLevel,
      status: 'pending',
      metadata: metadata ?? {},
      requestedAt: row.requestedAt as Date,
      resolvedAt: null,
      resolver: null,
    };

    // Auto-approve low risk
    if (autoApproved) {
      const resolution = this.resolveApproval(row.id, 'approve', 'system:auto');
      request.status = resolution.status;
      request.resolvedAt = resolution.resolvedAt;
      request.resolver = resolution.resolvedBy;
    }

    logAction({
      agentId,
      action: `approval_created:${action}`,
      details: JSON.stringify({ approvalId: row.id, riskLevel, autoApproved }),
    });

    return request;
  }

  /**
   * Resolve (approve or reject) a pending approval.
   */
  resolveApproval(
    approvalId: string,
    action: 'approve' | 'reject',
    resolvedBy: string
  ): ApprovalResolution {
    const existing = dbGetApproval(approvalId);
    if (!existing) {
      throw new Error(`Approval ${approvalId} not found`);
    }
    if (existing.status !== 'pending') {
      throw new Error(`Approval ${approvalId} already resolved as ${existing.status}`);
    }

    const status: ApprovalStatus = action === 'approve' ? 'approved' : 'rejected';
    dbResolveApproval(approvalId, status, resolvedBy);

    const resolvedAt = new Date();

    logAction({
      agentId: existing.agentId,
      action: `approval_${status}`,
      details: JSON.stringify({ approvalId, resolvedBy }),
    });

    return { id: approvalId, status, resolvedBy, resolvedAt };
  }

  /**
   * List pending approvals, optionally filtered by agent.
   */
  getPendingApprovals(agentId?: string): ApprovalRequest[] {
    const rows = dbListPending();
    const filtered = agentId ? rows.filter((r: any) => r.agentId === agentId) : rows;
    return filtered.map((r: any) => this._rowToRequest(r));
  }

  /**
   * Get a single approval by ID with full details.
   */
  getApprovalById(id: string): ApprovalRequest | undefined {
    const row = dbGetApproval(id);
    if (!row) return undefined;
    return this._rowToRequest(row);
  }

  /**
   * Determine the risk level for an action based on a role template's approval rules.
   * Falls back to default action-risk mappings, then to 'medium' for unknown actions.
   */
  checkRiskLevel(
    approvalRules: Record<string, RiskLevel>,
    actionType: string
  ): RiskLevel {
    // Direct match in template rules
    if (approvalRules[actionType]) {
      return approvalRules[actionType];
    }
    // Check default mappings
    if (DEFAULT_ACTION_RISK[actionType]) {
      return DEFAULT_ACTION_RISK[actionType];
    }
    // Check prefix match (e.g. "read_issues" matches "read")
    for (const [prefix, level] of Object.entries(DEFAULT_ACTION_RISK)) {
      if (actionType.startsWith(prefix)) {
        return level;
      }
    }
    // Unknown = medium (safe default)
    return 'medium';
  }

  /**
   * Returns true if the given risk level should be auto-approved (no human needed).
   */
  isAutoApproved(riskLevel: RiskLevel): boolean {
    return riskLevel === 'low';
  }

  /** Convert a DB row to an ApprovalRequest */
  private _rowToRequest(row: any): ApprovalRequest {
    let description = '';
    let metadata: Record<string, unknown> = {};
    if (row.metadata) {
      try {
        const parsed = JSON.parse(row.metadata);
        description = parsed.description || '';
        const { description: _d, ...rest } = parsed;
        metadata = rest;
      } catch {
        description = '';
      }
    }
    return {
      id: row.id,
      agentId: row.agentId,
      action: row.action,
      description,
      riskLevel: row.riskLevel as RiskLevel,
      status: row.status as ApprovalStatus,
      metadata,
      requestedAt: row.requestedAt instanceof Date ? row.requestedAt : new Date(row.requestedAt),
      resolvedAt: row.resolvedAt ? (row.resolvedAt instanceof Date ? row.resolvedAt : new Date(row.resolvedAt)) : null,
      resolver: row.resolver ?? null,
    };
  }
}
