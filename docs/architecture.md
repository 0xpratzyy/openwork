# Architecture

How OpenWork works under the hood.

## System Overview

OpenWork is a layer on top of [OpenClaw](https://openclaw.ai) that adds multi-agent team capabilities. It doesn't replace OpenClaw — it uses OpenClaw's multi-agent system to create and manage specialist agents.

```
┌─────────────── Slack / Discord / Telegram ───────────────┐
│   @openwork do X        Approve?       Status updates     │
│        │                   ▲                 ▲             │
└────────┼───────────────────┼─────────────────┼─────────────┘
         ▼                   │                 │
┌─────────────────── OpenClaw Gateway ─────────────────────┐
│                                                           │
│   ┌──────────────── Router Agent ───────────────────┐     │
│   │  • Bound to Slack channel via openclaw.json      │     │
│   │  • Classifies intent (domain + risk)             │     │
│   │  • Delegates to specialist via sub-agents        │     │
│   │  • Handles approval callbacks                    │     │
│   └──────┬──────┬──────┬──────┬─────────────────────┘     │
│          ▼      ▼      ▼      ▼                           │
│   ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐     │
│   │Engineer││Marketng││ Sales  ││Support ││  Ops   │     │
│   │        ││        ││        ││        ││        │     │
│   │SOUL.md ││SOUL.md ││SOUL.md ││SOUL.md ││SOUL.md │     │
│   │skills/ ││skills/ ││skills/ ││skills/ ││skills/ │     │
│   │MCP cfg ││MCP cfg ││MCP cfg ││MCP cfg ││MCP cfg │     │
│   └───┬────┘└───┬────┘└───┬────┘└───┬────┘└───┬────┘     │
└───────┼─────────┼─────────┼─────────┼─────────┼──────────┘
        ▼         ▼         ▼         ▼         ▼
┌──────────────── MCP Servers (Community) ─────────────────┐
│  GitHub · Linear · Sentry · Google Ads · HubSpot · ...   │
│  Each runs as stdio/SSE process, configured per-agent     │
└──────────────────────────────────────────────────────────┘
```

## Key Concepts

### Router Agent

The router is the "front desk" of your AI team. It:

1. Receives all `@openwork` mentions from Slack
2. Classifies intent — which domain (engineering, sales, etc.) and what kind of action
3. Delegates to the right specialist agent
4. Relays results back to Slack
5. Handles approval button callbacks

The router uses keyword matching with an LLM fallback for ambiguous requests.

### Specialist Agents

Each specialist is a full OpenClaw agent with:

- **`SOUL.md`** — Persona and behavior instructions (generated from role templates)
- **`AGENTS.md`** — Workspace conventions and tool usage guides
- **`skills/`** — Skills for each connected integration
- **MCP servers** — Configured tool servers (GitHub, Linear, etc.)

Specialists don't talk to Slack directly — they do work and return results to the router.

### Bindings & Routing

OpenClaw uses **bindings** in `openclaw.json` to route messages to agents. The router agent is bound to the Slack channel. When a message matches, it hits the router, which then delegates internally.

```json
{
  "agents": {
    "list": ["router", "engineering", "marketing", "sales", "support", "ops"]
  },
  "bindings": [
    { "channel": "slack", "agentId": "router" }
  ]
}
```

### MCP (Model Context Protocol)

Integrations use the [Model Context Protocol](https://modelcontextprotocol.io) — a standard for connecting AI agents to tools. Each integration is a community MCP server that runs as a subprocess (stdio) or remote service (SSE).

OpenWork doesn't build MCP servers — it curates and configures existing community ones.

## Message Flow

```
1. User: "@openwork check Sentry for new errors"
2. Slack → OpenClaw Gateway → Router Agent (via binding)
3. Router classifies: domain=engineering, action=query, risk=low
4. Router delegates to Engineering Agent
5. Engineering Agent calls Sentry MCP: sentry.list_issues(status=unresolved)
6. Engineering Agent formats response
7. Router posts result to Slack thread
```

## Approval Flow

```
1. Sales Agent wants to update a HubSpot deal (medium risk)
2. Sales Agent → Approval Engine: creates ApprovalRequest
3. Approval Engine → Slack: posts Block Kit message with [Approve] [Reject]
4. User clicks [Approve]
5. Slack callback → Router → Approval Engine → updates SQLite
6. Sales Agent resumes and executes the action
```

See [Approval Workflows](approval-workflows.md) for configuration details.

## Local Management Layer

```
┌──────────────── Your Machine ────────────────┐
│                                               │
│  $ openwork setup → Setup Wizard (:18800)     │
│                     │                         │
│                     ▼                         │
│  ┌─────── Backend API (Express) ────────┐     │
│  │  /api/roles · /api/setup             │     │
│  │  /api/integrations · /api/agents     │     │
│  │  /api/approvals · /api/status        │     │
│  └──────────────┬───────────────────────┘     │
│                 │                              │
│  ┌─────── Agent Workspace Generator ────┐     │
│  │  Reads template JSON                 │     │
│  │  Calls `openclaw agents add`         │     │
│  │  Writes SOUL.md, skills, MCP config  │     │
│  │  Patches openclaw.json bindings      │     │
│  └──────────────────────────────────────┘     │
│                                               │
│  ┌─────── Dashboard (:18800/dashboard) ─┐     │
│  │  Agents · Integrations · Approvals   │     │
│  │  Tasks  · Logs         · Settings    │     │
│  └──────────────────────────────────────┘     │
│                                               │
│  ┌─────── SQLite (team.db) ─────────────┐     │
│  │  agents · integrations · approvals   │     │
│  │  tasks  · audit_log    · users       │     │
│  └──────────────────────────────────────┘     │
└───────────────────────────────────────────────┘
```

## File System Layout

```
~/.openclaw/
├── openclaw.json                  # Patched with team agents + bindings
├── workspace/                     # Your main agent (unchanged)
├── agents/
│   ├── router/                    # Router agent
│   ├── engineering/               # Engineering specialist
│   ├── marketing/                 # Marketing specialist
│   ├── sales/                     # Sales specialist
│   └── support/                   # Support specialist
├── workspace-router/
│   ├── SOUL.md
│   └── skills/slack-router/
├── workspace-engineering/
│   ├── SOUL.md
│   └── skills/
│       ├── github/
│       ├── linear/
│       └── sentry/
└── ...

~/.openclaw-team/
├── team.db                        # SQLite database
├── templates/                     # Role templates
├── registry/integrations.json     # MCP server registry
└── config.json                    # Team config
```

## Technology Choices

| Component | Technology | Why |
|-----------|-----------|-----|
| CLI | Commander.js | Standard Node CLI tooling |
| Wizard/Dashboard | React 19 + Tailwind + Vite | Fast dev, ships as static assets |
| Backend | Express 5 | Lightweight, familiar |
| Database | SQLite + Drizzle ORM | Zero-config, portable, fast |
| Agents | OpenClaw multi-agent | Native routing, bindings, isolation |
| Integrations | Community MCP servers | Don't reinvent — curate & configure |
| Task Queue | SQLite state machine | No Redis or external deps needed |
| Deployment | Docker Compose | Single command to run everything |
