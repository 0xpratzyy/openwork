/**
 * Slack Block Kit Message Formatting
 *
 * Generates Slack Block Kit JSON for OpenWork interactions.
 * These are plain JSON objects — OpenClaw handles actual Slack API calls.
 */

import type { ApprovalRequest, RiskLevel } from '../approval/index.js';

// ── Risk Level Badges ──

const RISK_EMOJI: Record<RiskLevel, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: 'Low Risk (Auto-approved)',
  medium: 'Medium Risk',
  high: 'High Risk',
};

// ── Agent Icons ──

const AGENT_EMOJI: Record<string, string> = {
  engineering: '⚙️',
  marketing: '📣',
  sales: '💼',
  support: '🎧',
  ops: '📊',
  router: '🔀',
};

function agentIcon(role: string): string {
  return AGENT_EMOJI[role] || '🤖';
}

// ── Formatters ──

/**
 * Format an approval request as a Slack Block Kit message with Approve/Reject buttons.
 */
export function formatApprovalMessage(approval: ApprovalRequest): object {
  const riskBadge = `${RISK_EMOJI[approval.riskLevel]} ${RISK_LABEL[approval.riskLevel]}`;
  const ts = approval.requestedAt instanceof Date
    ? Math.floor(approval.requestedAt.getTime() / 1000)
    : Math.floor(Date.now() / 1000);

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔐 Approval Required', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Agent:*\n${approval.agentId}` },
          { type: 'mrkdwn', text: `*Risk Level:*\n${riskBadge}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Action:* \`${approval.action}\`\n*Description:* ${approval.description}`,
        },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Requested <!date^${ts}^{date_short_pretty} at {time}|${new Date(ts * 1000).toISOString()}>` },
          { type: 'mrkdwn', text: `ID: \`${approval.id}\`` },
        ],
      },
      { type: 'divider' },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Approve', emoji: true },
            style: 'primary',
            action_id: 'approval_approve',
            value: JSON.stringify({ approvalId: approval.id, action: 'approve' }),
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '❌ Reject', emoji: true },
            style: 'danger',
            action_id: 'approval_reject',
            value: JSON.stringify({ approvalId: approval.id, action: 'reject' }),
          },
        ],
      },
    ],
  };
}

/**
 * Format a specialist agent's response for Slack.
 */
export function formatAgentResponse(
  agentName: string,
  message: string,
  metadata?: { role?: string; duration?: number; taskId?: string }
): object {
  const icon = agentIcon(metadata?.role || agentName);
  const blocks: object[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `${icon} *${agentName}*\n\n${message}` },
    },
  ];

  if (metadata?.taskId || metadata?.duration) {
    const contextParts: object[] = [];
    if (metadata.taskId) {
      contextParts.push({ type: 'mrkdwn', text: `Task: \`${metadata.taskId}\`` });
    }
    if (metadata.duration) {
      contextParts.push({ type: 'mrkdwn', text: `⏱️ ${metadata.duration}ms` });
    }
    blocks.push({ type: 'context', elements: contextParts });
  }

  return { blocks };
}

/**
 * Format a status overview of all agents.
 */
export function formatStatusMessage(
  agents: Array<{ id: string; name: string; role: string; status: string }>
): object {
  const statusEmoji: Record<string, string> = {
    active: '🟢',
    inactive: '⚪',
    error: '🔴',
  };

  const agentLines = agents.map((a) => {
    const emoji = statusEmoji[a.status] || '⚪';
    const icon = agentIcon(a.role);
    return `${emoji} ${icon} *${a.name}* — ${a.status}`;
  });

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📋 Team Agent Status', emoji: true },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: agentLines.join('\n') },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `${agents.length} agents configured` },
        ],
      },
    ],
  };
}

/**
 * Format an error message for Slack.
 */
export function formatErrorMessage(error: string | Error): object {
  const msg = error instanceof Error ? error.message : error;
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⚠️ *Error*\n\`\`\`${msg}\`\`\``,
        },
      },
    ],
  };
}

/**
 * Format task progress updates for Slack.
 */
export function formatTaskProgress(task: {
  id: string;
  description: string;
  status: string;
  agentId: string;
  progress?: number;
}): object {
  const statusEmoji: Record<string, string> = {
    pending: '⏳',
    running: '🔄',
    waiting_approval: '🔐',
    completed: '✅',
    failed: '❌',
  };
  const emoji = statusEmoji[task.status] || '❓';

  const progressBar = task.progress != null
    ? `\n${'█'.repeat(Math.round(task.progress / 10))}${'░'.repeat(10 - Math.round(task.progress / 10))} ${task.progress}%`
    : '';

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *Task Update*\n*${task.description}*\nAgent: \`${task.agentId}\` | Status: *${task.status}*${progressBar}`,
        },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Task ID: \`${task.id}\`` }],
      },
    ],
  };
}

/**
 * Parse Slack button callback data back into action + approvalId.
 */
export function parseCallbackAction(callbackData: string): {
  approvalId: string;
  action: 'approve' | 'reject';
} {
  const parsed = JSON.parse(callbackData);
  if (!parsed.approvalId || !parsed.action) {
    throw new Error('Invalid callback data: missing approvalId or action');
  }
  return { approvalId: parsed.approvalId, action: parsed.action };
}
