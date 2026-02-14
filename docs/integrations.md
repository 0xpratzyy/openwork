# Integrations

OpenWork connects to your tools through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io).

## How Integrations Work

Each integration is a **community MCP server** — a process that exposes tools via a standard protocol. OpenWork doesn't build its own servers. It curates, configures, and manages existing ones.

When you add an integration:

1. The MCP server's npm package is installed
2. It's configured with your API key/OAuth token
3. It's assigned to the appropriate specialist agent
4. The agent can now call the server's tools

### MCP vs Direct API

| Approach | How it works | Used for |
|----------|-------------|----------|
| **MCP (primary)** | Community MCP server runs as subprocess, agent calls tools via JSON-RPC | Most integrations |
| **Direct API** | Agent calls REST APIs directly via skills | Custom or unsupported tools |

MCP is preferred because it's standardized, community-maintained, and the agent doesn't need to know API details.

## Supported Integrations

### P0 — Launch (15)

Available at launch. Well-tested, documented.

| Integration | MCP Package | Used by | What it does |
|------------|-------------|---------|-------------|
| GitHub | `@modelcontextprotocol/server-github` | Engineering | PRs, issues, code, repos |
| Linear | `@linear/mcp-server` | Engineering | Issue tracking, projects |
| Sentry | `@sentry/mcp-server` | Engineering | Error monitoring, alerts |
| Figma | `@figma/mcp-server` | Engineering | Design files, comments |
| Google Ads | `@google/ads-mcp-server` | Marketing | Campaigns, spend, ROAS |
| Google Analytics | `@google/analytics-mcp-server` | Marketing | Traffic, conversions |
| PostHog | `@posthog/mcp-server` | Marketing | Product analytics |
| Notion | `@notionhq/mcp-server` | Support | Pages, databases, search |
| HubSpot CRM | `@hubspot/mcp-server` | Sales | Deals, contacts, pipeline |
| Stripe | `@stripe/mcp-server` | Sales, Ops | Payments, subscriptions |
| Slack | Built-in skill | Router | Messages, threads, buttons |
| Discord | Built-in skill | Router | Messages, threads |
| Gmail/GWS | `@google/gmail-mcp-server` | Support | Email read/write |
| Google Drive | `@google/drive-mcp-server` | Ops | Files, folders |
| Google Sheets | `@google/sheets-mcp-server` | Ops | Spreadsheet data |

### P1 — Fast Follow (14)

Added shortly after launch.

| Integration | Used by |
|------------|---------|
| GitLab | Engineering |
| Jira | Engineering |
| Vercel | Engineering |
| Supabase | Engineering |
| Loom | Marketing |
| HubSpot Marketing | Marketing |
| Buffer | Marketing |
| Meta Ads | Marketing |
| Mailchimp | Marketing |
| Salesforce | Sales |
| Apollo | Sales |
| Calendly | Ops |
| LinkedIn | Sales |
| Zapier/n8n | Ops |

### P2 — Community Bounties (20+)

Available via community contributions.

PagerDuty · Docker · AWS · GCP · Canva · Adobe CC · Miro · Ahrefs · SEMrush · Confluence · Coda · Typeform · Dovetail · ProductBoard · PandaDoc · Lemlist · QuickBooks · 1Password · Zoom · Dropbox

## Configuring an Integration

### Via Setup Wizard

The easiest way. During setup, the wizard shows integrations per role and walks you through entering API keys or connecting via OAuth.

### Via Dashboard

Go to `http://localhost:18800/dashboard` → **Integrations** tab. Click any integration card to configure it.

### Via API

```bash
curl -X POST http://localhost:18800/api/integrations/github/configure \
  -H "Content-Type: application/json" \
  -d '{"env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"}}'
```

## Adding a Custom MCP Server

You can add any MCP server — even ones not in the registry.

### 1. Find or build an MCP server

Browse community MCP servers at [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) or build your own.

### 2. Add it to the registry

Edit `~/.openclaw-team/registry/integrations.json`:

```json
{
  "id": "my-tool",
  "name": "My Custom Tool",
  "npmPackage": "my-mcp-server",
  "configSchema": {
    "MY_API_KEY": { "type": "string", "required": true, "description": "API key for My Tool" }
  },
  "tools": ["my_tool_action_1", "my_tool_action_2"]
}
```

### 3. Assign it to a role template

Add the MCP server definition to your role template's `mcpServers` array, or configure it via the dashboard.

### 4. Configure credentials

```bash
curl -X POST http://localhost:18800/api/integrations/my-tool/configure \
  -H "Content-Type: application/json" \
  -d '{"env": {"MY_API_KEY": "xxx"}}'
```

The agent will now have access to `my_tool_action_1` and `my_tool_action_2`.

## Integration Health

OpenWork periodically checks each integration's health:

- ✅ **Connected** — API key is valid, server responds
- ⚠️ **Degraded** — Slow responses or intermittent errors
- ❌ **Disconnected** — Can't reach the server or auth failed

Check health via the dashboard or:

```bash
curl http://localhost:18800/api/status
```
