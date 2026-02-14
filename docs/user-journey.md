# User Journey

A detailed walkthrough of what happens when you set up and use OpenWork.

## Phase 1: Installation

You start by cloning the repo and installing dependencies:

```bash
git clone https://github.com/0xpratzyy/openwork.git
cd openwork && npm install && npm run build
```

At this point, you have the `openwork` CLI available and all packages built. Nothing has been configured yet.

## Phase 2: Setup Wizard

```bash
npx openwork setup
```

This does two things:

1. **Starts the Express backend** on port 18800
2. **Opens the setup wizard** in your browser at `http://localhost:18800`

### Step 1: Prerequisites Check

The wizard calls `GET /api/status` which checks:

- Is Node.js ≥ 20 installed?
- Is OpenClaw installed? (`which openclaw`)
- Is the OpenClaw gateway running? (`openclaw gateway status`)
- Does `~/.openclaw/openclaw.json` exist?

If anything fails, you get a clear error with instructions. No proceeding until prerequisites are met.

### Step 2: Role Selection

The wizard calls `GET /api/roles` which returns the 5 built-in templates. You see a card for each role:

- **Engineering Agent** — GitHub, Linear, Sentry
- **Marketing Agent** — Google Ads, Analytics, PostHog
- **Sales Agent** — HubSpot, Apollo
- **Support Agent** — Notion, Gmail
- **Operations Agent** — Google Sheets, Drive, Calendly

Check the ones you want. Most teams start with 2-3 roles.

### Step 3: Integration Configuration

For each selected role, the wizard shows the required integrations. Each integration needs either:

- **API key** — You paste it into a text field
- **OAuth flow** — Click "Connect" and authorize in a popup

The wizard stores credentials encrypted in the SQLite database (`~/.openclaw-team/team.db`).

### Step 4: Review & Generate

You see a summary of everything that will be created. Click **Generate** and watch the progress bar as OpenWork:

1. **Creates agent directories** — `openclaw agents add router`, `openclaw agents add engineering`, etc.
2. **Writes SOUL.md** — Each agent gets a persona from its role template
3. **Writes AGENTS.md** — Workspace conventions and tool instructions
4. **Configures skills** — Copies skill definitions into each agent's `skills/` directory
5. **Sets up MCP servers** — Configures the appropriate MCP servers per agent
6. **Patches openclaw.json** — Adds agents to `agents.list[]` and creates Slack bindings
7. **Initializes database** — Creates tables for agents, integrations, approvals, tasks, audit_log

This takes about 30 seconds.

### Step 5: Done!

You see a success screen with:

- List of created agents and their status
- Link to invite the Slack bot
- Link to the dashboard
- Next steps

## Phase 3: Daily Usage

### Asking Your Team

In Slack, mention `@openwork` with a request:

```
@openwork create a Linear issue: "Fix login redirect bug" with priority high
```

**What happens behind the scenes:**

1. Slack sends the message to OpenClaw via the configured channel
2. The **router agent** picks it up (bound via `openclaw.json`)
3. Router classifies: domain = engineering, tool = Linear, risk = low
4. Router delegates to the **engineering agent**
5. Engineering agent calls the Linear MCP server: `linear_create_issue(...)`
6. Engineering agent returns the result
7. Router posts in the Slack thread: "Created issue ENG-142: Fix login redirect bug (High priority)"

### Approvals

When an agent wants to do something risky:

```
@openwork merge the PR for the auth refactor
```

1. Router → Engineering Agent → action is `merge_pull_request` → risk = **high**
2. Engineering agent creates an `ApprovalRequest` in the database
3. Approval engine posts to Slack:

   > **Engineering Agent** wants to merge PR #47: "Auth refactor"
   >
   > Risk: 🔴 High
   >
   > `[Approve]` `[Reject]`

4. You click **Approve**
5. The agent proceeds with the merge

### Proactive Monitoring

Agents don't just wait for commands. With proactive monitoring enabled:

- Engineering agent checks Sentry every 15 minutes for new errors
- Marketing agent monitors Google Ads for campaigns with declining ROAS
- Sales agent flags deals that haven't been updated in 7+ days

When something comes up, the agent posts to Slack proactively:

> 🚨 **Engineering Agent**: 2 new P1 errors in Sentry (last 15min):
> - `TypeError: Cannot read property 'id' of null` in `auth.ts:142`
> - `TimeoutError: Database connection pool exhausted` in `db.ts:89`
>
> Want me to create Linear issues for these?

## Phase 4: Management

### Dashboard

Visit `http://localhost:18800/dashboard` to:

- View all agents and their health
- Add/remove integrations
- Review pending and past approvals
- Track tasks and activity
- Check audit logs
- Update settings

### CLI

```bash
openwork status          # Health check for all agents
openwork agents list     # List active agents
openwork agents add ops  # Add a new specialist
openwork agents remove marketing  # Remove a specialist
```

See [CLI Reference](cli-reference.md) for all commands.
