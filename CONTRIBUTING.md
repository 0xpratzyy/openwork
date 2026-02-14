# Contributing to OpenWork

Thanks for your interest in contributing! OpenWork is an open-source project and we welcome contributions.

## Getting Started

1. Fork and clone the repo
2. Run `npm install` at the root
3. Run `npx turbo build` to verify everything compiles
4. Create a branch for your changes

## Development

```bash
npm install          # install all dependencies
npx turbo build      # build all packages
npx turbo dev        # start dev servers
```

## Project Structure

- `packages/cli` — CLI entry point (`openwork` command)
- `packages/core` — Core engine (workspace generator, config, DB, approvals)
- `packages/server` — Express.js backend API
- `packages/wizard` — Setup wizard (React + Vite)
- `packages/dashboard` — Management dashboard (React + Vite)
- `packages/agents` — Role templates

## Pull Requests

- Keep PRs focused and small
- Add tests for new functionality
- Follow existing code style (Prettier + ESLint)
- Update docs if needed

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
