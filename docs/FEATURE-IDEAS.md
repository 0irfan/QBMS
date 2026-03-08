# QBMS – Feature ideas you can add

Ideas grouped by area. **Already in the app** vs **not yet built** are called out so you can pick what to do next.

**Single summary:** See **docs/OVERALL-IMPROVEMENTS.md** for overall improvement status (security, testing, docs, UX, features, polish).

---

## 1. Core product (exams & learning)

| Feature | Status | Description | Effort |
|--------|--------|-------------|--------|
| **Take exam (student)** | **Done** | Student sees active exams, Start/Continue, take-exam page with timer and questions, submit. | — |
| **View result / feedback** | **Done** | Result page: score, percentage, grade, per-question review. | — |
| **Exam scheduling** | Partial | DB has `scheduledAt` and `status`. Add: instructor sets schedule; “Available from … to …”; auto-open/close. | Medium |
| **Publish / unpublish exam** | **Done** | Publish / Unpublish buttons on exams list. | — |
| **Question bank search/filter** | Not built | Filter questions by topic, type, difficulty; search by text; pagination. | Small–Medium |
| **Bulk import questions** | Not built | Upload CSV/Excel to create many questions (and options for MCQ) at once. | Medium |
| **Duplicate exam / question** | Not built | “Duplicate” to clone an exam or question and then edit. | Small |

---

## 2. Engagement & communication

| Feature | Status | Description | Effort |
|--------|--------|-------------|--------|
| **Password reset (frontend)** | **Done** | Forgot password + reset page; API wired. | — |
| **Welcome / verification email** | Not built | Send welcome email on register; optional email verification (link to verify). See **docs/ESSENTIAL-IMPROVEMENTS.md** (Later plan – Email). | Small–Medium |
| **Notify student: exam available** | Not built | When instructor publishes an exam (or it becomes scheduled), email or in-app notification to enrolled students. | Medium |
| **Notify student: result ready** | Not built | When attempt is graded, email or in-app notification with score/link. | Medium |
| **In-app notifications** | Not built | Bell icon with list of “Exam X is available”, “Your result for Y is ready”, etc. (DB table + API + UI). | Medium |
| **Announcements per class** | Not built | Instructor posts short announcements; students see them on class or dashboard. | Medium |

---

## 3. Analytics & reporting

| Feature | Status | Description | Effort |
|--------|--------|-------------|--------|
| **Analytics dashboard** | Basic | Instructor/student stats exist. Extend: charts (attempts over time, score distribution), per-exam breakdown, per-student list with scores. | Medium |
| **Export results** | Not built | Export exam results or question bank to CSV/Excel (and optionally PDF for papers). | Medium |
| **Export question paper (PDF)** | Not built | From “Generate paper” result, download as PDF. | Medium |
| **Audit log viewer** | Backend only | Audit table is filled; add admin UI to view/filter and export logs. | Small |

---

## 4. AI & automation

| Feature | Status | Description | Effort |
|--------|--------|-------------|--------|
| **AI-generated questions** | **Done** | Questions page: “Generate with AI” (topic, type, difficulty, count); OpenAI generates; add to bank. Set OPENAI_API_KEY. | — |
| **Auto-grade short/essay** | Not built | For short/essay answers, use LLM to score or suggest marks; instructor can adjust. | Large |
| **Suggest similar questions** | Not built | When editing a question, “Suggest similar” using embeddings or keyword match. | Medium |

---

## 5. Admin & control

| Feature | Status | Description | Effort |
|--------|--------|-------------|--------|
| **User management (admin)** | Not built | List users, filter by role, deactivate/activate, reset password (admin). | Medium |
| **Role change** | Not built | Super admin can change a user’s role (e.g. student → instructor). | Small |
| **Class: list enrolled students** | Not built | For a class, show list of enrolled students (and optionally remove). | Small |
| **Exam: view all attempts** | Partial | API can list attempts by exam; add UI table with student, started, submitted, score. | Small |
| **Question versioning / history** | Partial | DB has `version` on questions; optional UI to see or revert history. | Medium |
| **Soft delete** | Not built | Soft-delete subjects/topics/questions so they can be restored. | Medium |

---

## 6. UX & polish

| Feature | Status | Description | Effort |
|--------|--------|-------------|--------|
| **Toasts** | Not built | Toast notifications for “Subject created”, “Invite sent”, “Deleted”, etc. | Small |
| **Confirm before delete** | Partial | Replace `confirm()` with a proper modal for delete actions. | Small |
| **Loading skeletons** | Partial | Skeleton loaders on dashboard and list pages. | Small |
| **Empty states** | Partial | Clear “No exams yet” with primary CTA (e.g. “Create exam”). | Small |
| **Dark mode toggle** | Not built | Toggle and persist theme (e.g. localStorage + class on html). | Small |
| **Keyboard shortcuts** | Not built | e.g. Submit exam with Ctrl+Enter, nav with keys. | Small |
| **Mobile-friendly exam taking** | Not built | Ensure take-exam UI works well on small screens. | Small–Medium |

---

## 7. Security & compliance

| Feature | Status | Description | Effort |
|--------|--------|-------------|--------|
| **Stronger password policy** | Partial | Enforce complexity and show rules on register; optional “expire password” for admin. | Small |
| **Rate limit login** | Partial | Stricter per-IP limits on `/api/auth/login`. | Small |
| **HTTPS & secure cookies** | Not built | Use HTTPS in production; set secure + sameSite on cookies. | Medium |
| **Email verification** | Not built | Verify email before full access; optional. | Medium |

---

## Suggested order (high impact next)

1. ~~**Take exam (student)**~~ – Done.
2. ~~**View result / feedback**~~ – Done.
3. ~~**Password reset (frontend)**~~ – Done.
4. ~~**Publish / unpublish exam**~~ – Done.
5. **Export results (CSV/Excel)** – Useful for instructors and admins.
6. **User management (admin)** – List users, deactivate, reset password.
7. **Toasts + confirm dialogs** – Quick UX wins.

For more detail on security, testing, and docs, see **docs/ESSENTIAL-IMPROVEMENTS.md**.
