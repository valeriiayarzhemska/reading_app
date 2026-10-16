# Reading App

A mobile app for tracking your reading: book shelves, a reading timer that works offline, and a calendar of what you read each day.

> 🚧 Work in progress — learning project.

## Planned stack

| Part | Tech |
|---|---|
| Mobile | Expo (React Native), TypeScript, React Query |
| API | NestJS, Prisma |
| Database | PostgreSQL (Docker) |
| Monorepo | Turborepo, pnpm workspaces |
| Book data | Google Books API / Open Library |

## Requirements

- Node 24 (see `.nvmrc` — run `nvm use`)
- pnpm (`corepack enable`)
- Docker

## Getting started

```bash
nvm use                                    # Node 24
pnpm install
cp apps/api/.env.example apps/api/.env     # local config (never committed)
pnpm db:up                                 # start PostgreSQL in Docker (port 5433)
pnpm db:migrate                            # create the tables
pnpm dev                                   # start API + Expo
```

- API: http://localhost:3001 (health check: `/health`)
- Mobile: in the Expo panel, press `i` for the iOS Simulator or scan the QR code with Expo Go

## Project structure

```
apps/
  api/        NestJS + Prisma
  mobile/     Expo (React Native)
packages/
  shared/     types and enums shared by both apps
docs/
  FEATURES.md requirements and user stories
```

## Useful scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start all apps (Turborepo TUI) |
| `pnpm build` | Build all packages |
| `pnpm db:up` / `pnpm db:down` | Start / stop the database container |
| `pnpm db:migrate --name <name>` | Create and apply a migration after changing `schema.prisma` |
| `pnpm db:studio` | Browse the database in the browser |

## License

© 2026 Valeriia Yarzhemska. All rights reserved. This code is published for viewing only; no permission is granted to use, copy, modify, or distribute it.
