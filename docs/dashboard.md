# Dashboard

The OpenWork dashboard is a local web UI for managing your AI team.

**URL:** `http://localhost:18800/dashboard` (available after running `openwork start`)

## Overview

The dashboard has a left sidebar with six sections:

```
┌─────────────────────────────────────────────┐
│  🏠 OpenWork Dashboard                      │
├──────────┬──────────────────────────────────┤
│          │                                   │
│ Agents   │   [Main content area]             │
│ Integr.  │                                   │
│ Approvals│                                   │
│ Tasks    │                                   │
│ Logs     │                                   │
│ Settings │                                   │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

## Agents

View and manage your specialist agents.

**List view:**
- Agent name and role
- Status: 🟢 Online / 🟡 Idle / 🔴 Error
- Last active timestamp
- Task count

**Detail view** (click an agent):
- SOUL.md preview
- Connected integrations
- Recent tasks
- Approval history
- Actions: restart, reconfigure, remove

## Integrations

Manage tool connections.

**Grid view:**
- Integration cards with status badges (✅ Connected / ❌ Disconnected / ⚠️ Error)
- Search and filter by category
- **"+ Add Custom MCP"** button for custom servers

**Detail view** (click an integration):
- Configuration (API key / OAuth status)
- Test connection button
- Which agents use this integration
- Health history
- Logs

## Approvals

Review and act on agent requests.

**Pending tab:**
- Real-time list of pending approvals
- Agent name, action, risk badge, timestamp
- Approve / Reject buttons

**History tab:**
- Past decisions with full context
- Filter by agent, risk level, date range
- Who approved/rejected and when

## Tasks

Track what your agents are doing.

**Active tasks:**
- Currently running tasks with progress
- Agent assignment
- Status: pending → running → waiting_approval → completed/failed

**Completed tasks:**
- History of all finished tasks
- Duration, outcome, linked approvals

## Logs

Chronological activity feed.

- All agent actions, approvals, errors, integration events
- Filter by agent, event type, date
- Click to expand details
- Export as JSON

## Settings

Configure your OpenWork installation.

- **General** — Team name, default timezone
- **Approval Rules** — Override per-agent risk levels
- **Permissions** — Map Slack users to admin/member/viewer roles
- **Integrations** — Global integration settings
- **Database** — SQLite path, backup/export
- **Advanced** — Port, CORS, log level
