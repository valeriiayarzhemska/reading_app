# @reading/api

The NestJS backend for the reading app: a REST API, a WebSocket chat gateway and nightly jobs, with Prisma on PostgreSQL.

Setup (env, database, running everything together) is in the [root README](../../README.md).

## Scripts

```bash
pnpm dev            # watch mode on http://localhost:3001 (PORT in .env)
pnpm build          # compile to dist/
pnpm start:prod     # run the compiled build
pnpm db:generate    # regenerate the Prisma client (Prisma 7 doesn't do it after migrate)
pnpm test           # unit tests (Vitest)
pnpm test:e2e       # end-to-end tests
pnpm lint           # oxlint (type-aware)
```

- Swagger UI: http://localhost:3001/docs (off when `NODE_ENV=production`)
- Health check: `GET /health`

## Modules

| Module | What it does |
|---|---|
| `auth` | Google token check, our own access + refresh JWTs, a global guard (`@Public()` opts out) |
| `users` | Profile, onboarding, nickname check, user search, public profiles, four favorites |
| `books` | Search via Google Books with an Open Library fallback, ISBN lookup, hand-added books |
| `user-books` | Shelves (Want / Reading / Read), progress, ratings |
| `reading-sessions` | Timer sessions, idempotent by `clientId`, manual logs, edit / delete |
| `stats` | Totals, monthly calendar and year heatmap in the user's timezone (raw SQL), yearly goal |
| `achievements` | Rule-based badges, recalculated by a nightly cron job |
| `reviews`, `quotes`, `notes` | Reviews with a spoiler flag, quotes, private notes |
| `follows` | Follow / unfollow, followers and following lists |
| `collections` | Collections of books, likes |
| `clubs` | Clubs, members, message history, read marks; the Socket.IO gateway on the `/chat` namespace (join, send, react, delete) |
| `posts` | Feed posts, likes, comments, comment likes |
| `notifications` | In-app notifications (new follower, post like, comment, comment like) |
| `reports` | Reports on any user content |
| `uploads` | Presigned upload URLs for Cloudflare R2 |
| `health` | `GET /health` |
| `prisma` | `PrismaService` shared by every module |
