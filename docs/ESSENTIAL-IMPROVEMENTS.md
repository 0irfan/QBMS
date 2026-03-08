# QBMS – Essential Improvements

Prioritized list of improvements for security, quality, features, and maintainability. Use as a roadmap or checklist.

**Single summary:** See **docs/OVERALL-IMPROVEMENTS.md** for one-page status across all areas.

---

## High priority

### 1. Security

| Item | Description | Effort |
|------|-------------|--------|
| **Secrets in production** | Replace default `JWT_SECRET` and `REFRESH_SECRET` with strong, unique values; use env or secret manager, never commit. | Small |
| **Password policy** | Enforce min length (e.g. 8), complexity (optional: upper, lower, number, symbol) and show requirements on Register. | Small |
| **Rate limiting** | Nginx has basic limits; add stricter auth rate limits (e.g. per-IP on `/api/auth/login`) to reduce brute force. | Small |
| **HTTPS** | For any non-local deployment, serve over HTTPS (TLS) and set secure cookie flags for refresh token. | Medium |
| **Input validation** | Ensure all API inputs are validated (Zod) and sanitized; guard against XSS in any user-generated content. | Small–Medium |

### 2. Testing

| Item | Description | Effort |
|------|-------------|--------|
| **API tests in CI** | Run `npm run test:api` in CI (e.g. GitHub Actions) with a test DB; fail build if tests fail. | Small |
| **Unit tests** | Add unit tests for auth, paper generation, and critical API routes (e.g. Jest/Vitest). | Medium |
| **E2E tests** | Add a few E2E tests (e.g. Playwright) for login, dashboard, and one full flow (e.g. create subject → topic → question). | Medium |
| **Frontend smoke tests** | Run `npm run test:frontend` in CI to catch broken login/register/dashboard. | Small |

### 3. Documentation and handover

| Item | Description | Effort |
|------|-------------|--------|
| **README accuracy** | Update README: port 8080 (not 80), link to CREDENTIALS.md, correct seed command and BASE_URL for tests. | Small |
| **API documentation** | Add OpenAPI/Swagger or a simple markdown list of endpoints, auth, and main request/response shapes. | Medium |
| **Deployment guide** | Short doc: env vars, production build, DB backups, and optional hosting (e.g. single server, Docker). | Small |
| **Letter/report** | Use **docs/PLAN-FOR-LETTER.md** to write the submission/transmittal letter and attach CREDENTIALS + README. | Small |

---

## Medium priority

### 4. User experience and accessibility

| Item | Description | Effort |
|------|-------------|--------|
| **Error messages** | Replace generic “Login failed” with clearer messages (e.g. “Invalid email or password”) where safe; avoid leaking account existence. | Small |
| **Loading states** | Consistent skeletons or spinners on dashboard pages while data loads. | Small |
| **Empty states** | Clear messages and one primary action when lists are empty (e.g. “No subjects yet – Add subject”). | Small |
| **Keyboard and screen readers** | Ensure forms and modals are focusable and have labels; use semantic HTML and aria where needed. | Small–Medium |
| **Password reset** | ~~Implement forgot-password flow~~ **Done** – Forgot + reset pages and API wired. | — |

### 5. Data and integrity

| Item | Description | Effort |
|------|-------------|--------|
| **Idempotent seed** | Make DB seed upsert users (e.g. on email conflict) so re-running seed doesn’t fail; document in CREDENTIALS. | Small |
| **Soft delete** | Optional: soft-delete for subjects/topics/questions so deletions are recoverable and history is kept. | Medium |
| **Audit log** | Optional: log who created/updated key entities (already have audit table; wire to UI or export). | Medium |
| **Backups** | Document (or automate) PostgreSQL backup/restore for production. | Small |

### 6. Features (optional)

| Item | Description | Effort |
|------|-------------|--------|
| **Exam attempt flow** | ~~Student: take exam (timer, submit answers), view result and feedback~~ **Done** – Take exam + result pages. | — |
| **AI integration** | Optional: AI-generated questions or auto-grading for short/essay (e.g. OpenAI/Anthropic API). | Large |
| **Export** | Export question paper or results (PDF/Excel). | Medium |
| **Notifications** | In-app or email when exam is published or result is available. | Medium |

---

## Lower priority / polish

### 7. Code and ops

| Item | Description | Effort |
|------|-------------|--------|
| **Linting in CI** | Run `npm run lint` and fix or exclude only where necessary. | Small |
| **Dependency updates** | Schedule `npm audit` and upgrade Next.js and other deps (security advisories first). | Small |
| **Logging** | Structured logs (e.g. request id, user id) for API; rotate logs in production. | Small |
| **Health dashboard** | Optional: simple admin page showing DB/Redis and last migration. | Small |

### 8. UI polish

| Item | Description | Effort |
|------|-------------|--------|
| **Toasts** | Use toast notifications for success/error (e.g. “Subject created”, “Delete failed”) instead of only inline text. | Small |
| **Confirm dialogs** | Replace `confirm()` with a proper modal for destructive actions (e.g. delete subject). | Small |
| **Responsive** | Verify all dashboard pages and forms on small screens; sidebar already has mobile menu. | Small |
| **Dark mode** | Optional: persist theme (e.g. localStorage) and respect system preference. | Small |

---

## Later plan – Email / SendGrid

Use this section when you implement or extend email (SendGrid) integration.

### Current state

| Flow | SendGrid used? | Notes |
|------|----------------|--------|
| **Login** | No | No email is sent on login. |
| **Create account (register)** | No | User is created and logged in immediately; no verification or welcome email. |
| **Forgot password** | Yes (optional) | API sends reset link via SendGrid only when `SENDGRID_API_KEY` is set. Code: `apps/api/src/routes/auth.ts` (POST `/forgot-password`). |

- The API uses a **dynamic import** of `@sendgrid/mail` for forgot-password. The package is **not** listed in `apps/api/package.json` — add it before using SendGrid in production.
- Type declaration exists: `apps/api/src/sendgrid.d.ts`.

### Environment variables (for SendGrid)

| Variable | Purpose |
|----------|--------|
| `SENDGRID_API_KEY` | Required for sending. Get from SendGrid dashboard. |
| `FROM_EMAIL` | Sender address (e.g. verified in SendGrid). Default in code: `noreply@qbms.local`. |
| `APP_URL` | Base URL for links in emails (e.g. reset link). Default in code: `http://localhost:3000`. |

### Steps for later (when adding full email support)

1. **Add dependency** – In `apps/api`: `npm install @sendgrid/mail`. Remove or update `sendgrid.d.ts` if the package brings its own types.
2. **Wire env in Docker** – Add `SENDGRID_API_KEY`, `FROM_EMAIL`, and `APP_URL` to the API service in `docker-compose.yml` (or `.env` / secret manager for production).
3. **Forgot-password** – Already implemented; ensure frontend has a “Forgot password?” page that calls `POST /api/auth/forgot-password` and a reset page that calls `POST /api/auth/reset-password`.
4. **Create account – welcome email** – After successful registration in `apps/api/src/routes/auth.ts`, if `SENDGRID_API_KEY` is set, send a welcome email (to the new user’s email) with app name and login URL.
5. **Create account – email verification (optional)** – Add a “verified” flag (or status) to users; on register, create a verification token, send link via SendGrid, and only allow full access (or set verified) when the user clicks the link. Requires new endpoint (e.g. `GET/POST /api/auth/verify-email?token=...`) and optional guard in auth middleware.

---

## Suggested order (if time is limited)

1. **Secrets** – Set real JWT/REFRESH secrets and document in deployment guide.  
2. **README + CREDENTIALS** – Correct ports, links, and seed instructions.  
3. **Letter** – Complete submission/transmittal letter using PLAN-FOR-LETTER.md.  
4. **API tests in CI** – Run test:api in pipeline.  
5. **Error messages and empty states** – Quick UX wins.  
6. ~~**Password reset (frontend)**~~ – Done.  
7. **Idempotent seed** – Safer and clearer for evaluators.  
8. **SendGrid (later)** – Add `@sendgrid/mail`, set env vars, then welcome/verification on create account; see **Later plan – Email / SendGrid** above.

---

*Update this list as you complete items or as requirements change.*
