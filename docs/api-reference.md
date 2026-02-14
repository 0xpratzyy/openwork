# API Reference

The OpenWork backend runs on `http://localhost:18800` and exposes the following REST API.

## Base URL

```
http://localhost:18800/api
```

All endpoints accept and return JSON.

---

## Roles

### `GET /api/roles`

List available role templates.

**Response:**

```json
[
  {
    "id": "engineering",
    "name": "Engineering Agent",
    "description": "Manages code repositories, tracks issues...",
    "skills": ["github", "linear", "sentry"],
    "mcpServers": [...]
  }
]
```

### `GET /api/roles/:id`

Get a specific role template.

---

## Setup

### `POST /api/setup`

Run the full setup process — create agents, configure integrations, patch openclaw.json.

**Request:**

```json
{
  "roles": ["engineering", "sales"],
  "integrations": {
    "github": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" },
    "hubspot": { "HUBSPOT_API_KEY": "xxx" }
  }
}
```

**Response:**

```json
{
  "status": "success",
  "agents": [
    { "id": "router", "status": "created" },
    { "id": "engineering", "status": "created" },
    { "id": "sales", "status": "created" }
  ]
}
```

---

## Agents

### `GET /api/agents`

List all configured agents.

**Response:**

```json
[
  {
    "id": "engineering",
    "role": "engineering",
    "status": "online",
    "lastActive": "2026-02-14T12:00:00Z",
    "taskCount": 42
  }
]
```

### `GET /api/agents/:id`

Get details for a specific agent.

### `POST /api/agents`

Create a new agent from a role template.

**Request:**

```json
{
  "role": "devops",
  "integrations": {
    "vercel": { "VERCEL_TOKEN": "xxx" }
  }
}
```

### `DELETE /api/agents/:id`

Remove an agent.

---

## Integrations

### `GET /api/integrations`

List all available and configured integrations.

**Response:**

```json
[
  {
    "id": "github",
    "name": "GitHub",
    "status": "connected",
    "agents": ["engineering"],
    "health": "ok"
  }
]
```

### `GET /api/integrations/:id`

Get details for a specific integration.

### `POST /api/integrations/:id/configure`

Configure an integration with credentials.

**Request:**

```json
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
  }
}
```

**Response:**

```json
{
  "status": "connected",
  "tools": ["github_create_issue", "github_list_pull_requests", "..."]
}
```

### `POST /api/integrations/:id/test`

Test an integration's connection.

---

## Approvals

### `GET /api/approvals`

List approvals. Filterable by status, agent, risk level.

**Query params:**
- `status` — `pending`, `approved`, `rejected`
- `agentId` — Filter by agent
- `risk` — `low`, `medium`, `high`

**Response:**

```json
[
  {
    "id": "abc123",
    "agentId": "engineering",
    "action": "merge_pull_request",
    "description": "Merge PR #47: Auth refactor",
    "riskLevel": "high",
    "status": "pending",
    "requestedAt": "2026-02-14T12:00:00Z"
  }
]
```

### `GET /api/approvals/:id`

Get a specific approval request.

### `POST /api/approvals/:id/approve`

Approve a pending request.

**Request:**

```json
{ "userId": "U12345" }
```

### `POST /api/approvals/:id/reject`

Reject a pending request.

**Request:**

```json
{ "userId": "U12345", "reason": "Not ready to merge yet" }
```

### `GET /api/approvals/rules`

Get approval rules. Filter by `agentId`.

### `PUT /api/approvals/rules`

Update an approval rule.

**Request:**

```json
{
  "agentId": "engineering",
  "action": "close_issue",
  "risk": "low"
}
```

---

## Status

### `GET /api/status`

System health check.

**Response:**

```json
{
  "server": "running",
  "gateway": "connected",
  "agents": {
    "total": 4,
    "online": 3,
    "error": 1
  },
  "integrations": {
    "total": 5,
    "connected": 4,
    "disconnected": 1
  },
  "database": "ok",
  "uptime": 3600
}
```
