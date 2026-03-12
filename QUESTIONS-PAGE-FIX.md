# Questions Page Fix - Bulk Import Issue

## Issue
The questions page bulk import is failing because it tries to create subjects without providing the required `classId` parameter (after the database migration).

## Root Cause
In the `handleBulkImport` function, when a subject doesn't exist, the code tries to create it with:
```javascript
matchedSubject = await subjectsApi.create({
  subjectName: extractedSubjectName,
  description: `Auto-created from question paper upload`
});
```

But the API now requires `classId` as a mandatory parameter.

## Solution Applied
Updated the `handleBulkImport` function to:
1. **Remove automatic subject creation** - since subjects now require a classId
2. **Show helpful error message** when subject doesn't exist
3. **Guide users** to create subjects first in the Subjects page
4. **Add informational note** in the upload section

## Changes Made

### 1. Updated handleBulkImport function
```javascript
// If subject doesn't exist, we need to show an error since subjects now require classId
if (!matchedSubject) {
  setError(`Subject "${extractedSubjectName}" not found. Please create the subject first in the Subjects page, then try importing again.`);
  setImporting(false);
  return;
}
```

### 2. Added helpful note in upload section
```javascript
<p className="text-sm text-gray-600 dark:text-gray-400">
  Upload a PDF or image of a question paper. AI will automatically extract the subject name and questions.
  <br />
  <span className="text-amber-600 dark:text-amber-400 font-medium">Note:</span> The extracted subject must already exist in your system. Create subjects first in the Subjects page if needed.
</p>
```

## User Workflow Now
1. **Create subjects first** in the Subjects page (with proper class selection)
2. **Upload question paper** in Questions page
3. **AI extracts questions** and matches to existing subject
4. **Import questions** to the matched subject

## Expected Result
- ✅ No more "classId required" errors during bulk import
- ✅ Clear error message when subject doesn't exist
- ✅ Users guided to create subjects first
- ✅ Bulk import works for existing subjects

## Files Updated
- `apps/web/src/app/dashboard/questions/page.tsx`

## Status
- ✅ Fix applied locally in `/opt/qbms/`
- ❌ Needs to be committed to source and deployed

## Next Steps
1. Copy the fixed file to source directory
2. Commit and push changes
3. Wait for CI/CD to rebuild and deploy
4. Test the bulk import functionality

The fix prevents the error and provides a better user experience by guiding users through the correct workflow.