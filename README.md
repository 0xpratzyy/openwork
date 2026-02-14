<p align="center">
  <h1 align="center">OpenWork</h1>
  <p align="center"><strong>Open-source multi-agent AI coworker for teams</strong></p>
  <p align="center">Built on <a href="https://openclaw.ai">OpenClaw</a> · Powered by MCP · Made by <a href="https://firstdollar.money">First Dollar</a></p>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="docs/getting-started.md">Docs</a> •
  <a href="docs/architecture.md">Architecture</a> •
  <a href="docs/contributing.md">Contributing</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## What is OpenWork?

OpenWork turns [OpenClaw](https://openclaw.ai) into a **shared AI team** that lives in your Slack workspace. Instead of one AI assistant, you get a team of specialist agents — engineering, marketing, sales, support, ops — each with their own tools, knowledge, and personality.

**Think of it as the open-source [Viktor](https://getviktor.com)**: self-hosted, multi-agent, and powered by the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) for tool integrations.

```
You: @openwork check Sentry for new errors
Engineering Agent: Found 3 unresolved errors in the last 24h...

You: @openwork what's our Google Ads CPA this week?
Marketing Agent: CPA is $12.40, down 8% from last week...

You: @openwork update the deal with Acme to "Closed Won"
Sales Agent: ⚠️ This requires approval (medium risk)
            [Approve] [Reject]
```

## Architecture

```
┌─────────────────── Slack Workspace ───────────────────┐
│                                                        │
│   @openwork do X       Approve?      Status updates    │
│        │                  ▲                ▲            │
└────────┼──────────────────┼────────────────┼────────────┘
         ▼                  │                │
┌─────────────────── OpenClaw Gateway ──────────────────┐
│                                                        │
│   ┌─────────────── Router Agent ─────────────────┐     │
│   │  Classifies intent → delegates to specialist  │     │
│   └──────┬──────┬──────┬──────┬──────────────────┘     │
│          ▼      ▼      ▼      ▼                        │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│   │Engineer│ │Marketng│ │ Sales  │ │Support │  ...     │
│   │  Agent │ │  Agent │ │ Agent  │ │ Agent  │         │
│   └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘         │
└───────┼──────────┼──────────┼──────────┼───────────────┘
        ▼          ▼          ▼          ▼
┌──────────────── MCP Servers (Community) ──────────────┐
│  GitHub · Linear · Sentry · Google Ads · HubSpot ...  │
└───────────────────────────────────────────────────────┘
```

## Features

- 🤖 **Multi-Agent Specialization** — Each role (engineering, marketing, sales, support, ops) gets its own agent with dedicated tools and persona
- 🔌 **50+ Integrations via MCP** — GitHub, Linear, Sentry, Google Ads, HubSpot, Stripe, and more — all through the Model Context Protocol
- ✅ **Approval Workflows** — Low/medium/high risk tiers with Slack-native approve/reject buttons
- 🧙 **Setup Wizard** — Browser-based wizard walks you through role selection and integration setup
- 📊 **Dashboard** — Manage agents, integrations, approvals, tasks, and logs from a local web UI
- 🔒 **Self-Hosted** — Your data stays on your infrastructure. No cloud dependency.
- 🧩 **Role Templates** — Pre-built templates for common roles, or create your own
- 📡 **Proactive Monitoring** — Agents watch your tools and surface issues before you ask

## Quick Start

**Prerequisites:** [Node.js](https://nodejs.org) ≥ 20, [OpenClaw](https://docs.openclaw.ai) installed and running

```bash
# Clone the repo
git clone https://github.com/0xpratzyy/openwork.git
cd openwork

# Install dependencies
npm install

# Build all packages
npm run build

# Launch the setup wizard
npx openwork setup
```

The setup wizard opens at `http://localhost:18800` and walks you through:

1. **Prerequisites check** — Is OpenClaw running?
2. **Select roles** — Pick which specialist agents you need
3. **Configure integrations** — Add API keys for your tools
4. **Generate** — OpenWork creates agent workspaces, configures MCP servers, and wires everything up

Then start your team:

```bash
npx openwork start
```

Invite the bot to your Slack channel and mention `@openwork` to get started.

→ [Full getting started guide](docs/getting-started.md)

## How It Works

1. **You install OpenWork** alongside your existing OpenClaw instance
2. **The setup wizard** lets you pick roles and connect integrations
3. **OpenWork generates** specialist agent workspaces — each with their own `SOUL.md`, skills, and MCP server configs
4. **A router agent** binds to your Slack channel and dispatches messages to the right specialist
5. **Specialist agents** execute tasks using MCP tools, request approvals when needed, and report back in Slack

Each agent is a real OpenClaw agent with its own workspace, memory, and tools. The router uses intent classification to delegate — no single agent tries to do everything.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Monorepo** | Turborepo + npm workspaces |
| **CLI** | Commander.js + TypeScript |
| **Wizard & Dashboard** | React 19 + Tailwind CSS + Vite |
| **Backend API** | Express 5 + TypeScript |
| **Database** | SQLite (better-sqlite3) + Drizzle ORM |
| **Agent System** | OpenClaw multi-agent |
| **Integrations** | Community MCP servers |
| **Deployment** | Docker Compose |

## Package Structure

```
packages/
├── cli/          # `openwork` CLI — entry point for setup, start, status, agents
├── core/         # Core engine — DB schema, workspace generator, approval engine, config management
├── server/       # Express API — serves wizard/dashboard, handles setup, agents, integrations, approvals
├── wizard/       # React SPA — step-by-step setup wizard (localhost:18800)
├── dashboard/    # React SPA — management dashboard (localhost:18800/dashboard)
└── agents/       # Role templates — JSON definitions for engineering, marketing, sales, support, ops
```

## Roadmap

| Phase | Timeline | What |
|-------|----------|------|
| 🟣 **Alpha** | March 2026 | Slack bot, approval engine, setup wizard, 5 core integrations |
| 🔵 **Beta** | April 2026 | Full dashboard, proactive monitoring, 20 integrations, permissions |
| 🟢 **Launch** | May 2026 | Docker deploy, docs site, community templates, bounty program |
| 🟠 **Scale** | Q3 2026 | Multi-agent routing improvements, enterprise features, 50+ integrations |

## Contributing

We'd love your help! See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, or jump straight to:

- [How to add a new role template](docs/role-templates.md#creating-custom-templates)
- [How to add a new integration](docs/integrations.md#adding-a-custom-mcp-server)
- [Architecture overview](docs/architecture.md)

## License

[MIT](LICENSE) — © 2026 [First Dollar](https://firstdollar.money)

---

<p align="center">
  Built with ❤️ by <a href="https://firstdollar.money">First Dollar</a><br>
  Powered by <a href="https://openclaw.ai">OpenClaw</a>
</p>
