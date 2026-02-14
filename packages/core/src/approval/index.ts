/**
 * Approval Engine
 *
 * High-level approval workflow logic.
 * Risk tiers: low (auto-approve), medium (single approver), high (admin required).
 */

export type RiskLevel = 'low' | 'medium' | 'high';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  agentId: string;
  action: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  metadata?: Record<string, unknown>;
}

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
    case 'low': return 'none';
    case 'medium': return 'member';
    case 'high': return 'admin';
  }
}
