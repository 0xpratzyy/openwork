# Approval Workflows

OpenWork's approval system ensures agents don't do risky things without human sign-off.

## Risk Tiers

Every agent action has a risk level defined in its [role template](role-templates.md):

| Tier | Behavior | Example Actions |
|------|----------|----------------|
| 🟢 **Low** | Auto-approved, executes immediately | View data, search, read files, list items |
| 🟡 **Medium** | Requires one approver | Update records, close issues, modify configs |
| 🔴 **High** | Requires admin approval | Merge PRs, deploy, send emails, delete data, adjust budgets |

## How Approvals Work

### 1. Agent Requests Approval

When an agent needs to perform a medium or high-risk action, it creates an `ApprovalRequest`:

```
Agent: "I need to merge PR #47: Auth refactor" (risk: high)
```

### 2. Slack Notification

The approval engine posts an interactive message to your Slack channel:

> **Engineering Agent** wants to:
>
> **Merge PR #47: Auth refactor**
>
> Risk: 🔴 High · Requested just now
>
> `[✅ Approve]` `[❌ Reject]`

### 3. Human Decides

Click **Approve** or **Reject** directly in Slack. The decision is recorded with:
- Who approved/rejected
- Timestamp
- The full action context

### 4. Agent Resumes (or Stops)

- **Approved**: Agent executes the action and reports the result
- **Rejected**: Agent acknowledges and stops. You can provide a reason.

## Approval States

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Pending  │────▶│ Approved │────▶│ Executed │
└─────────┘     └──────────┘     └──────────┘
     │
     │          ┌──────────┐
     └─────────▶│ Rejected │
                └──────────┘
```

Pending approvals expire after 24 hours by default (configurable).

## Configuring Approval Rules

### Per Role Template

In your role template JSON:

```json
{
  "approvalRules": {
    "create_issue": "low",
    "close_issue": "medium",
    "merge_pull_request": "high",
    "deploy": "high"
  }
}
```

### Via Dashboard

Go to **Dashboard → Settings → Approval Rules**. You can override template defaults per agent.

### Via API

```bash
# Get current rules for an agent
curl http://localhost:18800/api/approvals/rules?agentId=engineering

# Update a rule
curl -X PUT http://localhost:18800/api/approvals/rules \
  -H "Content-Type: application/json" \
  -d '{"agentId": "engineering", "action": "close_issue", "risk": "low"}'
```

## Permission Levels

Who can approve depends on the risk tier and user permissions:

| User Role | Can Approve |
|-----------|-------------|
| **Admin** | All tiers (low, medium, high) |
| **Member** | Low and medium only |
| **Viewer** | Cannot approve |

Permissions are based on Slack user IDs mapped in the database.

## Viewing Approval History

### Dashboard

**Dashboard → Approvals** shows:
- Pending approvals queue
- History of past decisions
- Filter by agent, risk level, date

### API

```bash
# Pending approvals
curl http://localhost:18800/api/approvals?status=pending

# All approvals for engineering agent
curl http://localhost:18800/api/approvals?agentId=engineering

# Approve a request
curl -X POST http://localhost:18800/api/approvals/abc123/approve \
  -H "Content-Type: application/json" \
  -d '{"userId": "U12345"}'
```

## Best Practices

- **Start conservative** — Set more things to `high` risk initially, then relax as you build trust
- **Review the audit log** — Check what agents are doing regularly via the dashboard
- **Use medium tier generously** — Most "write" operations should require at least one approval
- **Keep low tier for reads** — Agents should be able to query data freely without friction
