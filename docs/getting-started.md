# Getting Started

Get OpenWork up and running in under 10 minutes.

## Prerequisites

- **Node.js** ≥ 20 ([download](https://nodejs.org))
- **OpenClaw** installed and running ([docs](https://docs.openclaw.ai))
- **Slack workspace** where you have permission to add apps (or Discord/Telegram)

Verify OpenClaw is running:

```bash
openclaw gateway status
# Should show "running"
```

## Installation

```bash
git clone https://github.com/0xpratzyy/openwork.git
cd openwork
npm install
npm run build
```

## First Run — Setup Wizard

```bash
npx openwork setup
```

This launches a local web server at `http://localhost:18800` with a step-by-step wizard:

### Step 1: Prerequisites Check

The wizard verifies that OpenClaw is installed and the gateway is running. If something's missing, it'll tell you how to fix it.

### Step 2: Select Team Roles

Pick the specialist agents you want on your team:

| Role | What it does | Integrations |
|------|-------------|--------------|
| **Engineering** | Code reviews, issue tracking, error monitoring | GitHub, Linear, Sentry |
| **Marketing** | Ad campaigns, analytics, social scheduling | Google Ads, Analytics, PostHog |
| **Sales** | CRM pipelines, prospecting, deal tracking | HubSpot, Apollo |
| **Support** | Knowledge base, ticket responses, docs | Notion, Gmail |
| **Ops** | Cross-team coordination, reporting, scheduling | Google Sheets, Drive, Calendly |

You can always add or remove roles later.

### Step 3: Configure Integrations

For each role you selected, enter API keys or connect via OAuth for the relevant tools. The wizard shows exactly what's needed for each integration.

Example for Engineering:

```
GitHub Personal Access Token: ghp_xxxxxxxxxxxx
Linear API Key: lin_api_xxxxxxxxxxxx
Sentry Auth Token: sntrys_xxxxxxxxxxxx
```

### Step 4: Review & Generate

Review your choices, then hit **Generate**. OpenWork will:

1. Create agent workspaces in `~/.openclaw/agents/`
2. Write `SOUL.md` and skills for each specialist
3. Configure MCP servers per agent
4. Patch `~/.openclaw/openclaw.json` with bindings
5. Set up the SQLite database at `~/.openclaw-team/team.db`

## Starting OpenWork

```bash
npx openwork start
```

This starts the backend server and all configured agents. The dashboard is available at `http://localhost:18800/dashboard`.

## Connecting to Slack

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Add the **Bot Token Scopes**: `chat:write`, `app_mentions:read`, `channels:history`, `reactions:write`
3. Install the app to your workspace
4. Copy the Bot User OAuth Token
5. Add the token to your OpenClaw Slack skill configuration
6. Invite `@openwork` to your channel

Now mention `@openwork` followed by any task:

```
@openwork check Sentry for new errors in the last 24h
@openwork create a Linear issue for the login bug
@openwork what's our Google Ads spend this week?
```

## Checking Status

```bash
npx openwork status
```

Shows all running agents, their health, and connected integrations.

## Next Steps

- [Architecture overview](architecture.md) — how it all fits together
- [Role templates](role-templates.md) — customize or create new roles
- [Integrations](integrations.md) — add more tools
- [Approval workflows](approval-workflows.md) — configure risk controls
- [Dashboard](dashboard.md) — manage everything from the web UI
