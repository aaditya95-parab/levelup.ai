# LevelUp – Gamified Self-Improvement Dashboard

A gamified RPG-style productivity app where users complete real-life tasks to gain XP, level up, and improve character stats.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/levelup run dev` — run the frontend (served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Optional env: `JWT_SECRET` — defaults to a dev key if not set

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Recharts, Wouter
- API: Express 5 with JWT auth (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle DB schema (users.ts, quests.ts)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — Generated Zod validation schemas
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, quests, stats)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/levelup/src/` — React frontend (pages/, components/)

## Architecture decisions

- JWT tokens stored in localStorage under key `levelup_token`; attached to all API requests via `setAuthTokenGetter` in `custom-fetch.ts`
- XP formula: `xpToNextLevel = 100 * level` (resets each level)
- Stat gains: completing a quest in a category increments that stat by 1
- Streak logic: tracks `lastActiveDate` — increments streak if quest completed on consecutive days, resets to 1 if gap > 1 day
- Orval `zod` output uses `target` path (not `workspace`) to avoid generating a conflicting barrel `src/index.ts`; post-codegen step echoes the correct single export into `lib/api-zod/src/index.ts`

## Product

- User registration and login with JWT authentication
- RPG character profile: level, XP bar, streak, and 4 stats (Strength, Intelligence, Discipline, Health)
- Quest system: create tasks with difficulty (easy/medium/hard) and category; complete them for XP
- Level-up system: full-screen Framer Motion animation on level-up
- Streak tracking: daily streak rewards with reset on miss
- Dashboard: character stats, animated XP bar, weekly XP chart (Recharts), summary cards
- Leaderboard: top players ranked by level and XP

## User preferences

- Dark RPG aesthetic: near-black background, electric blue + violet neon accents
- No emojis anywhere in the UI
- Framer Motion for all significant animations

## Gotchas

- After changing `openapi.yaml`, always re-run codegen: `pnpm --filter @workspace/api-spec run codegen`
- The codegen script post-processes `lib/api-zod/src/index.ts` to avoid duplicate export conflicts
- Seed users (for demo): shadow@levelup.gg, mind@levelup.gg, iron@levelup.gg — all password: `password123`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
