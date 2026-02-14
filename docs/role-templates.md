# Role Templates

Role templates define specialist agents — their persona, tools, and behavior.

## What's a Role Template?

A role template is a JSON file that tells OpenWork how to create a specialist agent. It includes:

- **Persona** — The agent's personality and expertise (becomes `SOUL.md`)
- **Skills** — Which tool categories the agent uses
- **MCP Servers** — Which MCP servers to configure and what env vars they need
- **Tools** — Specific MCP tools the agent can call
- **Approval Rules** — Risk levels for different actions

## Built-in Templates

OpenWork ships with 5 templates in `packages/agents/templates/`:

### Engineering (`engineering.json`)

**What it does:** Code reviews, issue tracking, error monitoring, deployment coordination.

**Integrations:**
- **GitHub** — PRs, issues, code contents
- **Linear** — Issue creation and tracking
- **Sentry** — Error monitoring and triage

**Approval rules:**
| Action | Risk Level |
|--------|-----------|
| Create issue | 🟢 Low (auto-approve) |
| Close issue | 🟡 Medium |
| Merge PR | 🔴 High |
| Deploy | 🔴 High |

### Marketing (`marketing.json`)

**What it does:** Ad campaign management, analytics monitoring, social media scheduling.

**Integrations:**
- **Google Ads** — Campaign performance and spend
- **Google Analytics** — Traffic and conversion data
- **PostHog** — Product analytics and user behavior

**Approval rules:**
| Action | Risk Level |
|--------|-----------|
| View analytics | 🟢 Low |
| Adjust ad budget | 🔴 High |
| Pause campaign | 🟡 Medium |

### Sales (`sales.json`)

**What it does:** CRM pipeline management, prospect research, deal tracking.

**Integrations:**
- **HubSpot CRM** — Deals, contacts, pipeline
- **Apollo** — Prospect research and enrichment

**Approval rules:**
| Action | Risk Level |
|--------|-----------|
| View pipeline | 🟢 Low |
| Update deal stage | 🟡 Medium |
| Send outreach | 🔴 High |

### Support (`support.json`)

**What it does:** Knowledge base management, support response drafting, documentation.

**Integrations:**
- **Notion** — Knowledge base search and management
- **Gmail** — Email drafts and responses

**Approval rules:**
| Action | Risk Level |
|--------|-----------|
| Search knowledge base | 🟢 Low |
| Update documentation | 🟡 Medium |
| Send email | 🔴 High |

### Operations (`ops.json`)

**What it does:** Cross-team coordination, reporting, scheduling, process management.

**Integrations:**
- **Google Sheets** — Data and reporting
- **Google Drive** — File management
- **Calendly** — Scheduling

**Approval rules:**
| Action | Risk Level |
|--------|-----------|
| Read spreadsheet | 🟢 Low |
| Update spreadsheet | 🟡 Medium |
| Schedule meeting | 🟡 Medium |

## Template Format

```json
{
  "id": "engineering",
  "name": "Engineering Agent",
  "description": "Manages code repositories, tracks issues, monitors errors...",
  "persona": "You are the Engineering specialist on this team...",
  "skills": ["github", "linear", "sentry"],
  "mcpServers": [
    {
      "id": "github",
      "name": "GitHub",
      "npmPackage": "@modelcontextprotocol/server-github",
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "" }
    }
  ],
  "tools": [
    "github_create_issue",
    "github_list_pull_requests",
    "linear_create_issue"
  ],
  "approvalRules": {
    "merge_pull_request": "high",
    "create_issue": "low",
    "deploy": "high"
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (used as agent name) |
| `name` | string | Human-readable name |
| `description` | string | What the agent does |
| `persona` | string | Full SOUL.md content — personality, strengths, communication style |
| `skills` | string[] | Skill categories to configure |
| `mcpServers` | object[] | MCP server definitions with npm packages and required env vars |
| `tools` | string[] | Specific MCP tools the agent can use |
| `approvalRules` | object | Map of action → risk level (`low`, `medium`, `high`) |

## Creating Custom Templates

1. **Create a JSON file** following the format above:

```bash
# Start from an existing template
cp packages/agents/templates/engineering.json packages/agents/templates/devops.json
```

2. **Edit the template** with your role's specifics:

```json
{
  "id": "devops",
  "name": "DevOps Agent",
  "description": "Manages infrastructure, deployments, and monitoring.",
  "persona": "You are the DevOps specialist. You manage infrastructure, CI/CD pipelines, and system reliability...",
  "skills": ["vercel", "docker", "pagerduty"],
  "mcpServers": [
    {
      "id": "vercel",
      "name": "Vercel",
      "npmPackage": "@vercel/mcp-server",
      "env": { "VERCEL_TOKEN": "" }
    }
  ],
  "tools": ["vercel_list_deployments", "vercel_deploy"],
  "approvalRules": {
    "deploy": "high",
    "rollback": "high",
    "view_logs": "low"
  }
}
```

3. **Register the template** in `packages/agents/src/index.ts`:

```typescript
import devops from '../templates/devops.json' assert { type: 'json' };

export const templates = { engineering, marketing, sales, support, ops, devops };
```

4. **Rebuild and use it:**

```bash
npm run build
npx openwork agents add devops
```

## Tips for Good Templates

- **Be specific in the persona** — Tell the agent exactly how to communicate, what to prioritize, and when to escalate
- **Start with fewer tools** — An agent with 3 well-configured tools beats one with 20 half-configured ones
- **Set conservative approval rules** — Start with higher risk levels and relax as you gain trust
- **Include proactive behaviors** — Tell the agent what to watch for and when to alert the team
