# OpenWork

**An Open-Source AI Coworker for Every Team**

Built on [OpenClaw](https://github.com/openclaw/openclaw) · Powered by MCP · Made for [First Dollar](https://firstdollar.money)

---

OpenWork transforms OpenClaw from a personal AI assistant into a shared, persistent team agent. It lives in your Slack workspace, connects to 50+ tools via MCP, and delegates tasks to specialized AI agents — each an expert in their domain.

## How It Works

1. **Clone & Setup** — Run the setup wizard to pick your team roles and connect your tools
2. **Specialist Agents** — Each role (engineering, marketing, sales, etc.) gets its own AI agent with domain-specific skills
3. **Router Agent** — One Slack bot receives all @mentions and intelligently delegates to the right specialist
4. **Approval Workflows** — High-risk actions require human approval before execution

## Architecture

```
Slack @mention → Router Agent → Specialist Agent → MCP Server → Your Tools
```

Each specialist is a fully isolated OpenClaw agent with its own persona, skills, and tool connections.

## Features

- 🤖 **Multi-agent routing** — domain experts, not a generalist
- 🔌 **50+ integrations** via MCP (GitHub, Linear, Sentry, Figma, Stripe, etc.)
- ✅ **Approval workflows** — Low/Medium/High risk tiers
- 📊 **Dashboard** — manage agents, integrations, and permissions
- 🔒 **Self-hosted** — your data stays on your infra
- 🧠 **Shared knowledge base** — agents learn and share context
- ⏰ **Proactive monitoring** — agents watch your tools and alert you
- 🆓 **Free & open-source** (MIT)

## Quick Start

```bash
npx openwork setup
```

## Tech Stack

- **Runtime:** OpenClaw Gateway (Node.js)
- **CLI:** Commander.js + TypeScript
- **Dashboard:** React + Tailwind + Vite
- **Database:** SQLite (better-sqlite3 + Drizzle ORM)
- **Integrations:** Community MCP servers (JSON-RPC 2.0)
- **Deployment:** Docker Compose

## Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| 🟣 Alpha | March 2026 | Router + 5 integrations + approval engine |
| 🔵 Beta | April 2026 | Full dashboard + 20 integrations + monitoring |
| 🟢 Launch | May 2026 | Public release + docs + community bounties |

## Contributing

We welcome contributions! Check out our [Contributing Guide](CONTRIBUTING.md).

## License

MIT © [First Dollar](https://firstdollar.money)
