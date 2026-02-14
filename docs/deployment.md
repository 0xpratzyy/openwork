# Deployment

How to run OpenWork in production.

## Docker Compose (Recommended)

The simplest way to deploy OpenWork.

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  openclaw:
    image: openclaw/gateway:latest
    ports:
      - "3000:3000"
    volumes:
      - openclaw-data:/root/.openclaw
    environment:
      - OPENCLAW_MODEL=anthropic/claude-sonnet-4-20250514
    restart: unless-stopped

  openwork:
    image: openwork/server:latest
    ports:
      - "18800:18800"
    volumes:
      - openclaw-data:/root/.openclaw
      - openwork-data:/root/.openclaw-team
    environment:
      - PORT=18800
      - NODE_ENV=production
    depends_on:
      - openclaw
    restart: unless-stopped

volumes:
  openclaw-data:
  openwork-data:
```

### Running

```bash
docker compose up -d
```

Access the dashboard at `http://your-server:18800/dashboard`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `18800` | Server port |
| `NODE_ENV` | `development` | Environment (`development` or `production`) |
| `OPENCLAW_HOME` | `~/.openclaw` | OpenClaw config directory |
| `OPENWORK_DB_PATH` | `~/.openclaw-team/team.db` | SQLite database path |
| `OPENWORK_LOG_LEVEL` | `info` | Log level (`debug`, `info`, `warn`, `error`) |

Integration credentials are stored in the SQLite database (encrypted at rest), not as environment variables.

## Manual Deployment

If you prefer not to use Docker:

```bash
# Clone and build
git clone https://github.com/0xpratzyy/openwork.git
cd openwork
npm install
npm run build

# Run setup
npx openwork setup

# Start in production
NODE_ENV=production npx openwork start
```

### Running as a Service (systemd)

```ini
# /etc/systemd/system/openwork.service
[Unit]
Description=OpenWork AI Team
After=network.target

[Service]
Type=simple
User=openwork
WorkingDirectory=/opt/openwork
ExecStart=/usr/bin/node packages/cli/dist/index.js start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=18800

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable openwork
sudo systemctl start openwork
```

## Reverse Proxy (nginx)

If you want to expose the dashboard behind a domain:

```nginx
server {
    listen 80;
    server_name openwork.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:18800;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Backups

The SQLite database at `~/.openclaw-team/team.db` contains all configuration, approvals, and audit logs. Back it up regularly:

```bash
# Simple file copy (SQLite is safe to copy when idle)
cp ~/.openclaw-team/team.db ~/backups/team-$(date +%Y%m%d).db

# Or use SQLite's backup command
sqlite3 ~/.openclaw-team/team.db ".backup ~/backups/team-$(date +%Y%m%d).db"
```

## Security Considerations

- **Run behind a firewall** — The dashboard has no authentication by default. Don't expose port 18800 to the internet without a reverse proxy + auth.
- **Encrypt at rest** — API keys are stored encrypted in SQLite. Ensure the database file has restricted permissions (`chmod 600`).
- **Rotate credentials** — Regularly rotate API keys for connected integrations.
- **Audit logs** — Review the audit_log table periodically for unexpected actions.
