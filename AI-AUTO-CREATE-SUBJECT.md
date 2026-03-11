# Auto-Create Subject & Topic from Question Paper Extraction

## Feature Overview

When uploading a question paper for AI extraction, the system now automatically creates the subject and topic if they don't exist in the database.

## How It Works

### 1. Subject Detection
- AI extracts the subject name from the uploaded question paper (PDF/Image)
- System displays the detected subject name in a teal badge

### 2. Subject Matching & Creation
- System searches for existing subject with matching name (case-insensitive)
- **If subject exists**: Uses the existing subject
- **If subject doesn't exist**: 
  - Automatically creates new subject with detected name
  - Adds description: "Auto-created from question paper upload"
  - Updates local state to reflect new subject

### 3. Topic Creation
- System checks if the subject has any topics
- **If topics exist**: Uses the first available topic
- **If no topics exist**:
  - Automatically creates a "General" topic under the subject
  - Updates local state to reflect new topic

### 4. Question Import
- All extracted questions are imported to the target topic
- Success message shows count of imported questions

## User Experience

### Before (Manual)
```
1. Upload question paper
2. AI extracts "Systems" subject
3. Error: "Subject 'Systems' not found. Please create this subject first."
4. User must manually:
   - Go to Subjects page
   - Create "Systems" subject
   - Create a topic under it
   - Return to Questions page
   - Upload paper again
```

### After (Automatic)
```
1. Upload question paper
2. AI extracts "Systems" subject
3. System automatically creates:
   - Subject: "Systems"
   - Topic: "General"
4. Questions imported successfully
5. Success message displayed
```

## Error Handling

### Subject Creation Failure
```
Error: Failed to create subject "Systems": [error message]
```

### Topic Creation Failure
```
Error: Failed to create topic for subject "Systems": [error message]
```

### Import Failure
```
Error: Import failed: [error message]
```

## Code Changes

### File: `apps/web/src/app/dashboard/questions/page.tsx`

**Function**: `handleBulkImport()`

**Key Changes**:
1. Changed `matchedSubject` from `const` to `let` to allow reassignment
2. Added subject creation logic with try-catch
3. Added topic creation logic with try-catch
4. Updated local state after creation (subjects and topics arrays)
5. Improved error messages with context

## Benefits

1. **Seamless UX**: No manual intervention required
2. **Time Saving**: Eliminates multiple page navigations
3. **Error Reduction**: Prevents user confusion about missing subjects
4. **Intelligent**: Reuses existing subjects when available
5. **Consistent**: Always ensures a topic exists for questions

## Technical Details

### API Calls
```typescript
// Create subject
const newSubject = await subjectsApi.create({
  subjectName: extractedSubjectName,
  description: 'Auto-created from question paper upload'
});

// Create topic
const newTopic = await topicsApi.create({
  subjectId: matchedSubject.subjectId,
  topicName: 'General'
});
```

### State Updates
```typescript
// Update subjects list
setSubjects([...subjects, matchedSubject]);

// Update topics list
setTopics([...topics, newTopic]);
```

## Future Enhancements

1. **Custom Topic Names**: Allow AI to suggest topic name from paper content
2. **Bulk Topic Creation**: Create multiple topics if paper has sections
3. **Subject Suggestions**: Show similar existing subjects before creating new
4. **Merge Subjects**: Detect and merge duplicate subjects with similar names
5. **Topic Assignment**: Intelligently assign questions to appropriate topics based on content

## Testing

### Test Case 1: New Subject
1. Upload paper with subject "Operating Systems"
2. Verify subject is created
3. Verify "General" topic is created
4. Verify questions are imported

### Test Case 2: Existing Subject, No Topics
1. Create subject "Database Systems" manually
2. Upload paper with subject "Database Systems"
3. Verify existing subject is used
4. Verify "General" topic is created
5. Verify questions are imported

### Test Case 3: Existing Subject with Topics
1. Create subject "Networks" with topic "TCP/IP"
2. Upload paper with subject "Networks"
3. Verify existing subject is used
4. Verify existing topic "TCP/IP" is used
5. Verify questions are imported

## Deployment

**Status**: ✅ Deployed to Production

**Commit**: `04eb241` - feat: auto-create subject and topic from question paper extraction

**Date**: March 12, 2026

**Live URL**: https://qbms.pro

---

*This feature eliminates the need for manual subject/topic creation when uploading question papers, providing a seamless AI-powered workflow.*
