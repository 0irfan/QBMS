# QBMS – Overall improvements

Single view of all improvements: **security**, **testing**, **docs**, **UX**, **data**, **features**, and **polish**. Use as a roadmap or checklist.

---

## Quick status

| Area | Priority | Done / in progress | Next |
|------|----------|---------------------|------|
| **Security** | High | Secrets, validation partial | Strong secrets, rate limit login, HTTPS |
| **Testing** | High | — | API tests in CI, then unit/E2E |
| **Docs** | High | CREDENTIALS, PLAN-FOR-LETTER, ESSENTIAL-IMPROVEMENTS | README, API doc, deployment guide |
| **UX** | Medium | Password reset UI, take exam, result, publish | Toasts, confirm modals, empty states |
| **Data** | Medium | — | Idempotent seed, backups |
| **Features** | Mixed | Take exam, result, publish, invites | Export, scheduling, notifications |
| **Polish** | Lower | — | Lint in CI, toasts, dark mode |

---

## 1. Security

| Item | Status | Effort | Notes |
|------|--------|--------|--------|
| **Secrets in production** | Todo | Small | Replace default JWT/REFRESH secrets; use env or secret manager. |
| **Password policy** | Partial | Small | Enforce min length (e.g. 8), show on Register; optional complexity. |
| **Rate limiting** | Partial | Small | Stricter per-IP on `/api/auth/login` to reduce brute force. |
| **HTTPS & secure cookies** | Todo | Medium | TLS in production; secure + sameSite on refresh cookie. |
| **Input validation** | Partial | Small–Medium | All API inputs via Zod; guard XSS in user content. |

---

## 2. Testing

| Item | Status | Effort | Notes |
|------|--------|--------|--------|
| **API tests in CI** | Todo | Small | Run `npm run test:api` in CI with test DB. |
| **Unit tests** | Todo | Medium | Auth, paper generation, critical routes (Jest/Vitest). |
| **E2E tests** | Todo | Medium | Login, dashboard, one full flow (e.g. Playwright). |
| **Frontend smoke in CI** | Todo | Small | Run frontend tests in pipeline. |

---

## 3. Documentation and handover

| Item | Status | Effort | Notes |
|------|--------|--------|--------|
| **README** | Partial | Small | Port 8080, link CREDENTIALS, correct seed and BASE_URL. |
| **API documentation** | Todo | Medium | OpenAPI/Swagger or markdown list of endpoints. |
| **Deployment guide** | Todo | Small | Env vars, build, DB backups, optional hosting. |
| **Letter/report** | Planned | Small | Use **docs/PLAN-FOR-LETTER.md**; attach CREDENTIALS + README. |

---

## 4. User experience and accessibility

| Item | Status | Effort | Notes |
|------|--------|--------|--------|
| **Error messages** | Partial | Small | Clearer messages where safe (e.g. “Invalid email or password”). |
| **Loading states** | Partial | Small | Consistent skeletons/spinners on lists. |
| **Empty states** | Partial | Small | “No X yet” + one primary action. |
| **Toasts** | Todo | Small | Success/error toasts instead of only inline text. |
| **Confirm dialogs** | Partial | Small | Replace `confirm()` with modal for delete/destructive actions. |
| **Keyboard / a11y** | Todo | Small–Medium | Focus, labels, semantic HTML, aria where needed. |
| **Responsive** | Partial | Small | Sidebar has mobile menu; verify take-exam on small screens. |
| **Dark mode** | Optional | Small | Toggle + persist (e.g. localStorage). |

---

## 5. Data and integrity

| Item | Status | Effort | Notes |
|------|--------|--------|--------|
| **Idempotent seed** | Todo | Small | Upsert users on email conflict; document in CREDENTIALS. |
| **Soft delete** | Todo | Medium | Optional soft-delete for subjects/topics/questions. |
| **Audit log** | Backend only | Medium | Table exists; add UI or export. |
| **Backups** | Todo | Small | Document or automate PostgreSQL backup/restore. |

---

## 6. Features (beyond current scope)

| Item | Status | Effort | Notes |
|------|--------|--------|--------|
| **Take exam (student)** | Done | — | Start/Continue, timer, submit, result. |
| **View result** | Done | — | Score, percentage, per-question feedback. |
| **Password reset (frontend)** | Done | — | Forgot + reset pages. |
| **Publish / unpublish exam** | Done | — | Buttons on exams list. |
| **Invites (instructor + student)** | Done | — | Invite instructor; invite student; join class. |
| **Exam scheduling** | Partial | Medium | Use scheduledAt; auto-open/close or UI “Available from…to…”. |
| **Question bank search/filter** | Todo | Small–Medium | By topic, type, difficulty; text search; pagination. |
| **Export results** | Todo | Medium | CSV/Excel for exam results. |
| **Export paper (PDF)** | Todo | Medium | Download generated paper as PDF. |
| **Welcome / verification email** | Todo | Small–Medium | SendGrid; see ESSENTIAL-IMPROVEMENTS “Later plan – Email”. |
| **Notify: exam available / result ready** | Todo | Medium | Email or in-app when exam published or result ready. |
| **User management (admin)** | Todo | Medium | List users, filter by role, deactivate, admin reset password. |
| **Class: list enrolled students** | Todo | Small | Per-class student list; optional remove. |
| **Exam: view all attempts (UI)** | Partial | Small | API exists; add table (student, started, submitted, score). |
| **AI (questions / auto-grade)** | **Questions done** | — | OpenAI: Generate with AI on Questions page (set OPENAI_API_KEY). Auto-grade short/essay still optional. |

---

## 7. Code and ops

| Item | Status | Effort | Notes |
|------|--------|--------|--------|
| **Linting in CI** | Todo | Small | Run `npm run lint`; fix or exclude only where needed. |
| **Dependency updates** | Todo | Small | `npm audit`; upgrade Next and deps (security first). |
| **Logging** | Partial | Small | Structured logs (request id, user id); rotate in production. |
| **Health dashboard** | Optional | Small | Simple admin page: DB/Redis, last migration. |

---

## Suggested order (if time is limited)

1. **Secrets** – Real JWT/REFRESH in production; document in deployment guide.  
2. **README + CREDENTIALS** – Correct ports (8080), links, seed instructions.  
3. **Letter** – Submission/transmittal letter (PLAN-FOR-LETTER.md).  
4. **API tests in CI** – Run test:api in pipeline.  
5. **Error messages + empty states** – Quick UX wins.  
6. **Idempotent seed** – Safer for evaluators and re-runs.  
7. **Toasts + confirm modals** – Replace inline errors and `confirm()`.  
8. **Export results (CSV)** – High value for instructors.  
9. **SendGrid** – Add `@sendgrid/mail`, env vars; welcome/verification (see ESSENTIAL-IMPROVEMENTS).

---

## Related docs

- **CREDENTIALS.md** – Test users and seed.  
- **docs/PLAN-FOR-LETTER.md** – Submission/transmittal letter.  
- **docs/ESSENTIAL-IMPROVEMENTS.md** – Detailed priorities + SendGrid plan.  
- **docs/FEATURE-IDEAS.md** – Feature list with status and effort.

*Update this list as you complete items or requirements change.*
