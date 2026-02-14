# Contributing

We welcome contributions of all kinds — bug fixes, new features, role templates, integrations, and docs.

## Getting Set Up

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/openwork.git
cd openwork
npm install
npm run build
```

### Development Mode

```bash
npm run dev   # Watches all packages for changes
```

### Project Structure

```
packages/
├── cli/          # Commander.js CLI
├── core/         # DB schema, workspace generator, approval engine
├── server/       # Express API backend
├── wizard/       # React setup wizard (Vite)
├── dashboard/    # React dashboard (Vite)
└── agents/       # Role template JSON files
```

## PR Workflow

1. **Fork** the repo
2. **Branch** from `main`: `git checkout -b feat/your-feature`
3. **Make changes** and test them
4. **Lint**: `npm run lint`
5. **Build**: `npm run build` (must pass)
6. **Commit** with [conventional commits](https://www.conventionalcommits.org/):
   - `feat: add devops role template`
   - `fix: approval timeout not resetting`
   - `docs: update integration guide`
7. **Push** and open a PR against `main`

## Code Style

- **TypeScript** everywhere (strict mode)
- **Prettier** for formatting (config in `.prettierrc`)
- **ESLint** for linting (config in `eslint.config.js`)
- Run `npm run format` before committing

## Adding a New Role Template

1. Create `packages/agents/templates/your-role.json`:

```json
{
  "id": "your-role",
  "name": "Your Role Agent",
  "description": "What this agent does",
  "persona": "You are the ... specialist on this team...",
  "skills": ["tool1", "tool2"],
  "mcpServers": [
    {
      "id": "tool1",
      "name": "Tool One",
      "npmPackage": "@example/mcp-server",
      "env": { "API_KEY": "" }
    }
  ],
  "tools": ["tool1_action", "tool1_query"],
  "approvalRules": {
    "tool1_action": "medium",
    "tool1_query": "low"
  }
}
```

2. Register it in `packages/agents/src/index.ts`
3. Add docs in `docs/role-templates.md`
4. Submit a PR

## Adding a New Integration

1. Find the community MCP server (check [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers))
2. Add it to the MCP registry in `packages/agents/templates/` (include it in a role template)
3. Document the required env vars
4. Test the connection
5. Submit a PR

## Reporting Issues

- Use [GitHub Issues](https://github.com/0xpratzyy/openwork/issues)
- Include: what you expected, what happened, steps to reproduce
- Label with `bug`, `feature`, `docs`, or `integration`

## Community

- **Bounties** — Some issues have bounties via the [First Dollar](https://firstdollar.money) platform
- **Templates marketplace** — Community role templates can be submitted via PR and installed with `openwork templates install`

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
