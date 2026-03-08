# QBMS – Test credentials

Use these accounts to test different roles. **Password for all:** `Admin@123`

| Role        | Email                    | Password  |
|------------|--------------------------|-----------|
| Super Admin | `superadmin@qbms.local` | `Admin@123` |
| Instructor  | `instructor@qbms.local`  | `Admin@123` |
| Student     | `student@qbms.local`     | `Admin@123` |

## How to get these users

- **Super Admin only** (create or reset password):
  ```bash
  docker exec qbms-api node scripts/seed-superadmin.cjs
  ```
- **All three users** plus demo data (subjects, topics, questions, class):  
  From the project root (with Docker/postgres running):
  ```bash
  # Windows (PowerShell)
  $env:DATABASE_URL="postgresql://qbms:qbms@localhost:5432/qbms"; npm run db:seed

  # Linux / Mac
  DATABASE_URL=postgresql://qbms:qbms@localhost:5432/qbms npm run db:seed
  ```
  Use a **fresh** database or one that has no users yet; the seed inserts Super Admin, Instructor, and Student. If Super Admin already exists, run only the superadmin script above and create Instructor/Student via the **Register** page at http://localhost:8080/register using password `Admin@123`.

After seeding, log in at **http://localhost:8080/login**. You can show or hide the password using the **eye icon** next to the password field on both Login and Register pages.
