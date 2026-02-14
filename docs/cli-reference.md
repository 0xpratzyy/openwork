# CLI Reference

The `openwork` CLI is your main interface for managing OpenWork.

## Installation

After building the project:

```bash
npm run build
```

Run commands with:

```bash
npx openwork <command>
```

Or link globally:

```bash
npm link packages/cli
openwork <command>
```

---

## Commands

### `openwork setup`

Launch the setup wizard.

```bash
openwork setup [--port 18800]
```

Opens a local web server with the setup wizard UI. Walk through role selection, integration configuration, and agent generation.

**Options:**
- `--port <number>` — Port for the local server (default: 18800)

---

### `openwork start`

Start the OpenWork server and all configured agents.

```bash
openwork start [--port 18800]
```

Starts the Express backend, serves the dashboard, and ensures all agents are running.

**Options:**
- `--port <number>` — Port for the server (default: 18800)

---

### `openwork status`

Show status of all agents and integrations.

```bash
openwork status
```

**Output:**

```
OpenWork v0.1.0 — Status

Agents:
  ✅ router        online   last active: 2m ago
  ✅ engineering    online   last active: 5m ago
  ✅ marketing      online   last active: 1h ago
  ⚠️ sales          idle     last active: 3h ago

Integrations:
  ✅ GitHub         connected
  ✅ Linear         connected
  ❌ Sentry         auth error
  ✅ Google Ads     connected

Server: running on http://localhost:18800
```

---

### `openwork agents`

Manage specialist agents.

#### `openwork agents list`

List all configured agents.

```bash
openwork agents list
```

#### `openwork agents add <role>`

Add a new specialist agent from a role template.

```bash
openwork agents add devops
```

This runs the workspace generator: creates the agent directory, writes SOUL.md, configures skills and MCP servers, patches openclaw.json.

**Arguments:**
- `<role>` — Role template ID (e.g., `engineering`, `marketing`, `sales`, `support`, `ops`, or a custom template)

#### `openwork agents remove <name>`

Remove a specialist agent.

```bash
openwork agents remove marketing
```

Removes the agent from openclaw.json, cleans up the workspace directory, and updates the database.

**Arguments:**
- `<name>` — Agent name to remove

---

### `openwork version`

Show version.

```bash
openwork version
# OpenWork v0.1.0
```

---

### `openwork help`

Show help for any command.

```bash
openwork help
openwork help setup
openwork agents help
```
