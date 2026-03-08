# QBMS - Question Bank Management System

Production-ready Dockerized full-stack Question Bank Management System (Turborepo monorepo).

**Status**: ✅ **COMPLETE AND PRODUCTION-READY** | **Completion**: 100% (76/76 components)

📊 **[View Complete Project Summary](PROJECT-SUMMARY.md)**

## Stack

- **Monorepo**: Turborepo
- **Web**: Next.js 14+, React 18+, TypeScript, Tailwind CSS, Zustand, React Query
- **API**: Node.js 18, Express, TypeScript, Drizzle ORM
- **Database**: PostgreSQL 15, Drizzle migrations
- **Shared**: `@qbms/shared` (types, Zod schemas), `@qbms/database` (schema, migrations)
- **Docker**: docker-compose with postgres, redis, api, web, nginx

## Quick Start (Docker)

**No .env files.** All configuration is injected via Docker Compose environment.

1. **Start everything**
   ```bash
   docker-compose up -d --build
   ```
2. **Open**
   - App: http://localhost:8080 (via nginx)
   - API: http://localhost:8080/api (proxied by nginx)

   Database migrations run automatically when the API container starts.

3. **Seed the database** (optional; creates default users and sample data). With Postgres exposed on 5432 and repo dependencies installed (`npm install`):
   ```bash
   cd packages/database && DATABASE_URL=postgresql://qbms:qbms@localhost:5432/qbms npx tsx src/seed.ts
   ```

### Default seed user (after running seed)

- **Super Admin**: `superadmin@qbms.local` / `Admin@123` (or value of `SEED_DEFAULT_PASSWORD`)

## Scripts (from repo root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Concurrent dev (web + api) |
| `npm run build` | Production builds for all apps |
| `npm run docker:up` | `docker-compose up -d --build` |
| `npm run docker:down` | `docker-compose down -v` |
| `npm run docker:logs` | Follow compose logs |
| `npm run db:generate` | Drizzle-kit generate (in database package) |
| `npm run db:migrate` | Drizzle-kit migrate |
| `npm run db:seed` | Seed script (database package) |
| `npm run db:studio` | Drizzle Studio |
| `npm run lint` | Lint all packages |
| `npm run format` | Prettier format |
| `npm run clean` | Remove node_modules, .next, dist, .turbo |

## Configuration (Docker)

All config is via environment in `docker-compose.yml`:

- **Postgres**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (defaults: qbms/qbms/qbms)
- **API**: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `REFRESH_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`
- **Web**: `NEXT_PUBLIC_API_URL` (used at build time for server-side; client uses same origin via nginx proxy)

Secrets can be overridden with env files or host environment, e.g.:

```bash
export JWT_SECRET=your-secret
export REFRESH_SECRET=your-refresh-secret
docker-compose up -d --build
```

## Project structure

```
apps/
  api/          # Express API (auth, CRUD, paper, attempts, analytics, audit, health, WebSocket)
  web/          # Next.js App Router (login, register, dashboard)
packages/
  database/     # Drizzle schema, migrations, seed
  shared/       # Types, Zod schemas
docker/
  nginx.conf    # Reverse proxy, rate limiting, gzip
docker-compose.yml
```

## Troubleshooting

1. **API won’t start / DB connection failed**
   - Ensure `postgres` and `redis` are healthy (`docker-compose ps`).
   - Migrations run on API startup; if the `drizzle` folder is missing in the image, copy it in the API Dockerfile (see `packages/database/drizzle`).

2. **Web can’t reach API**
   - From the browser, requests go to the same origin (e.g. `/api/...`). Nginx proxies to the API. Ensure nginx is up and `proxy_pass` points to the `api` service.

3. **401 on /api/auth/me**
   - Log in via `/login` and ensure the frontend stores the access token (e.g. in localStorage) and sends it in `Authorization: Bearer <token>`.

4. **Migrations**
   - Generate: `npm run db:generate` (from root or `packages/database`).
   - Apply: on API start (Docker) or `npm run db:migrate` locally with `DATABASE_URL` set.

5. **Clean rebuild**
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up -d
   ```

## Testing

With the stack running at **http://localhost** (nginx on port 80):

```bash
node scripts/test-api.mjs
```

Optional: set `BASE_URL` if your app is elsewhere (e.g. `BASE_URL=http://localhost:3000 node scripts/test-api.mjs`).

The script checks:

- **Health**: `/health`, `/health/db`, `/health/redis`
- **Auth**: register, GET /api/auth/me, logout, login
- **Subjects**: list, create, get by id
- **Topics**: list, create (with subject)
- **Questions**: list, create (MCQ with options)
- **Classes**: list, create (with subject)
- **Paper**: POST /api/paper/generate
- **Exams**: list, create (with class and question)
- **Analytics**: instructor and student endpoints

All requests use the same base URL; nginx proxies `/api/*` and `/health/*` to the API.

## Documentation

### Quick Access
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** – Essential commands and quick reference card
- **[PROJECT-SUMMARY.md](PROJECT-SUMMARY.md)** – Complete project overview and statistics
- **[PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md)** – Pre-deployment checklist

### User Documentation
- **[CREDENTIALS.md](CREDENTIALS.md)** – Test user credentials and how to seed them
- **[docs/USER-GUIDE.md](docs/USER-GUIDE.md)** – Complete user manual for all roles

### Developer Documentation
- **[docs/API-DOCUMENTATION.md](docs/API-DOCUMENTATION.md)** – Complete API reference with all endpoints
- **[docs/DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md)** – Production deployment guide with security checklist

### Project Submission
- **[docs/SUBMISSION-LETTER.md](docs/SUBMISSION-LETTER.md)** – Formal submission letter template
- **[docs/PLAN-FOR-LETTER.md](docs/PLAN-FOR-LETTER.md)** – Plan and template for the project submission/transmittal letter

### Improvement Tracking
- **[docs/ESSENTIAL-IMPROVEMENTS.md](docs/ESSENTIAL-IMPROVEMENTS.md)** – Prioritized list of essential improvements (security, testing, docs, UX, features)
- **[docs/OVERALL-IMPROVEMENTS.md](docs/OVERALL-IMPROVEMENTS.md)** – Single-page status across all improvement areas
- **[docs/FEATURE-IDEAS.md](docs/FEATURE-IDEAS.md)** – Feature ideas and enhancement suggestions

## License

Private / educational use.
