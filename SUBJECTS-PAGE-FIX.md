# Subjects Page Fix - Manual Update Required

## Issue
The subjects page is showing "classId and subjectName required" error because:
1. The frontend form doesn't include a class selector
2. The API call doesn't send the required `classId` parameter

## Solution Applied Locally
I've updated the files in `/opt/qbms/` but they need to be applied to the source code and deployed.

## Files That Need Manual Update

### 1. apps/web/src/app/dashboard/subjects/page.tsx
**Changes needed:**
- Import `classesApi` and `ClassItem` type
- Add `classId` to Subject type
- Add state for classes and selectedClassId
- Add `loadClasses()` function
- Update form to include class selector
- Update `handleCreate()` to send classId
- Add class column to table
- Add `getClassName()` helper function

### 2. apps/web/src/lib/api.ts
**Changes needed:**
- Update Subject type to include `classId: string`
- Update `subjectsApi.create()` to require `{ classId: string; subjectName: string; description?: string }`

## Quick Fix Instructions

### Option 1: Copy from Local Files
```bash
# SSH to server
ssh azureuser@20.121.189.81

# Copy the fixed files
cp /opt/qbms/apps/web/src/app/dashboard/subjects/page.tsx ~/QBMS/apps/web/src/app/dashboard/subjects/page.tsx
cp /opt/qbms/apps/web/src/lib/api.ts ~/QBMS/apps/web/src/lib/api.ts

# Commit and push
cd ~/QBMS
git add apps/web/src/app/dashboard/subjects/page.tsx apps/web/src/lib/api.ts
git commit -m "Fix subjects page: Add class selector and update API calls"
git push origin main
```

### Option 2: Manual Code Changes
Apply the changes shown in the updated files I created.

## Expected Result
After applying the fix:
- ✅ Subjects page will show a "Class" dropdown
- ✅ Users can select which class to create the subject in
- ✅ No more "classId and subjectName required" error
- ✅ Subjects table will show which class each subject belongs to

## Current Status
- ✅ Database migration completed (subjects now have class_id column)
- ✅ API endpoints working correctly
- ❌ Frontend needs to be updated to use new API structure
- ❌ New images need to be built and deployed

The backend is ready, just need to update the frontend and redeploy.