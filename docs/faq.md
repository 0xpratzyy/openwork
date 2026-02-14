# FAQ

## General

### What is OpenWork?

OpenWork is an open-source, self-hosted AI team that lives in your Slack workspace. It creates specialist agents (engineering, marketing, sales, support, ops) that connect to your tools and execute real work — with human approval for risky actions.

### How is this different from ChatGPT or Claude?

ChatGPT and Claude are general-purpose chat assistants. OpenWork is a **team of specialized agents** that are connected to your actual tools (GitHub, HubSpot, Sentry, etc.) and can take actions — not just answer questions.

### How is this different from Viktor?

[Viktor](https://getviktor.com) is a closed-source, cloud-hosted SaaS product. OpenWork is:

- **Open-source** (MIT license)
- **Self-hosted** (your data stays on your infrastructure)
- **Multi-agent** (specialist agents per domain, not one agent for everything)
- **MCP-native** (uses the Model Context Protocol for all integrations)
- **Free** (no per-seat pricing)

### What LLMs are supported?

OpenWork uses whatever LLM you've configured in OpenClaw. This includes:

- **Anthropic Claude** (Sonnet, Opus, Haiku)
- **OpenAI GPT-4** and variants
- **Any model** supported by OpenClaw's model configuration

Configure your model in OpenClaw's settings — OpenWork inherits it.

### Is my data sent anywhere?

No. OpenWork runs entirely on your infrastructure. Your data flows between your machine, your configured LLM provider (via OpenClaw), and your tool APIs. There's no OpenWork cloud service, no telemetry by default, and no phone-home.

The only external calls are:
1. LLM API calls (to your configured provider)
2. MCP server calls to your tools (GitHub, Sentry, etc.)

### Is it production-ready?

Not yet. OpenWork is in **alpha** (as of February 2026). It works, but expect rough edges. We're targeting a stable launch in May 2026.

## Setup

### Do I need OpenClaw installed first?

Yes. OpenWork is built on top of [OpenClaw](https://openclaw.ai) and uses its multi-agent system. Install OpenClaw first, make sure the gateway is running, then install OpenWork.

### Can I use it without Slack?

Slack is the primary platform, but OpenWork will support Discord and Telegram as well (planned for the launch phase). The router agent can be bound to any channel that OpenClaw supports.

### How many agents can I run?

As many as your machine can handle. Each agent is a lightweight OpenClaw agent — the main resource consumption is LLM API calls. Most teams run 3-5 specialist agents.

### Can I create custom roles?

Absolutely. See [Role Templates](role-templates.md#creating-custom-templates) for a step-by-step guide. Create a JSON template, register it, and you're done.

## Technical

### What database does it use?

SQLite by default (via `better-sqlite3`). It's stored at `~/.openclaw-team/team.db`. Zero configuration, portable, and fast. Postgres support is planned for larger deployments.

### Can I add integrations that aren't in the list?

Yes. Any MCP server can be added as a custom integration. See [Adding a Custom MCP Server](integrations.md#adding-a-custom-mcp-server).

### What happens if an MCP server is down?

The agent will report the error and can retry with exponential backoff. If the server stays down, the agent falls back to asking the human for help. All errors are logged in the audit trail.

### Can multiple team members use it at once?

Yes. Multiple people can `@mention` the bot in Slack simultaneously. The router handles concurrent requests. Permission levels (admin/member/viewer) control who can do what.

## Contributing

### How do I contribute?

See [Contributing](contributing.md). The easiest ways to start:
- Fix a bug
- Add a new role template
- Improve documentation
- Add a new integration

### Are there bounties?

Yes! Some issues have bounties through the [First Dollar](https://firstdollar.money) platform. Check GitHub issues labeled `bounty`.
