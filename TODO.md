# Reading App — Plan & TODO

Tick a box with `[x]` when done. Add notes under each task: what you learned, what broke, links.

---

## Stage 0 — Environment setup

- [x] Upgrade Node to 22 LTS (via `nvm` or `fnm`) and add `.nvmrc`
- [x] Get `pnpm` working (`corepack enable`)
- [ ] Decide on the repo name / folder structure
- [ ] `.gitignore`, `README.md`, first commit

**Notes:**

---

## Stage 1 — Week 1 (~1–1.5 h/day)

### Day 1 — Monorepo skeleton
- [ ] Turborepo + pnpm workspaces
- [ ] `apps/api` — NestJS
- [ ] `apps/mobile` — Expo
- [ ] `packages/shared` — shared types / enums
- [ ] Everything starts with one command

### Day 2 — Database
- [ ] `docker-compose.yml` with PostgreSQL
- [ ] Prisma connected to `apps/api`
- [ ] Schema (User, AuthAccount, Book, UserBook, ReadingSession)
- [ ] First migration — tables exist in DB

### Day 3 — Books module
- [ ] Google Books API search
- [ ] Save a book to DB
- [ ] `GET /books/search?q=` works

### Day 4 — User books (shelves)
- [ ] CRUD for shelves
- [ ] DTOs + validation
- [ ] Error handling
- [ ] Add a book to a shelf via Postman

### Day 5 — Docs & seed
- [ ] Swagger
- [ ] Seed script with test data

### Weekend — First frontend ↔ backend connection
- [ ] Search screen in Expo (React Query)
- [ ] Shelves screen
- [ ] Temporary hardcoded user

**Notes:**

---

## Stage 2 — Auth
- [ ] Sign in with Apple
- [ ] Sign in with Google
- [ ] JWT / sessions

## Stage 3 — Reading timer & calendar
- [ ] Timer: choose book + format (paper / ebook / audio)
- [ ] Timer survives app kill (MMKV)
- [ ] Enter progress after stop (pages / % / minutes)
- [ ] Offline queue + sync
- [ ] Idempotency via `clientId`
- [ ] `POST /me/sessions`
- [ ] Calendar: `GET /me/calendar?month=` (SQL grouping by day, user timezone)
- [ ] Stats: `GET /me/stats?period=week`

## Stage 3.5 — Native widgets (1–2 weeks)
- [ ] iOS Live Activity (lock screen + Dynamic Island)
- [ ] iOS home screen widget "Continue reading"
- [ ] Android foreground service notification with timer
- [ ] Android widget
- [ ] Switch to development build (instead of Expo Go)

---

## Questions to figure out

-

## Things I learned

-
