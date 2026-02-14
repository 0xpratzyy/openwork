import { Router } from 'express';
import { listPendingApprovals, getApproval, dbResolveApproval } from '@openwork/core';

export const approvalsRouter = Router();

approvalsRouter.get('/', (_req, res) => {
  try {
    const approvals = listPendingApprovals();
    res.json({ approvals });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

approvalsRouter.post('/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { action, resolvedBy } = req.body as { action: 'approve' | 'reject'; resolvedBy: string };

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: 'action must be "approve" or "reject"' });
      return;
    }

    const existing = getApproval(id);
    if (!existing) {
      res.status(404).json({ error: 'Approval not found' });
      return;
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    dbResolveApproval(id, status, resolvedBy || 'unknown');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
