# AI Question Extraction - MCQ Handling

## Overview
The AI question extraction feature properly handles MCQ (Multiple Choice Questions) throughout the entire flow, from extraction to display to editing.

## How MCQs Are Handled

### 1. Backend Extraction (`apps/api/src/lib/question-extractor.ts`)
- AI extracts MCQ questions with their options
- Each option includes:
  - `optionText`: The option text
  - `isCorrect`: Boolean indicating if it's the correct answer
- AI attempts to identify the correct answer from the paper
- If answer key not visible, AI makes an educated guess

### 2. Backend Storage (`apps/api/src/routes/question-extract.ts`)
- Bulk import endpoint saves MCQ options to `questionOptions` table
- Each option is linked to the question via `questionId`
- Correct answer is marked with `isCorrect: true`

### 3. Frontend Display (`apps/web/src/app/dashboard/questions/page.tsx`)

#### Review Interface
When questions are extracted, MCQs are displayed with:
- Question text
- Type badge showing "mcq"
- Number of options badge (e.g., "4 options")
- **Options list with visual indicators:**
  - ✅ Green checkmark for correct answer
  - ⭕ Empty circle for incorrect options
  - Correct answer text is highlighted in green
  - All options are clearly visible

#### Edit Mode
When editing an extracted MCQ:
- Question text is editable in textarea
- Type can be changed (mcq/short/essay)
- Difficulty and marks are editable
- **Options are fully editable:**
  - Radio buttons to select which option is correct
  - Text inputs for each option text
  - "Add option" button to add more options
  - Can modify or remove options before import

### 4. Manual MCQ Creation
The existing manual question creation form also properly handles MCQs:
- Radio buttons to mark correct answer
- Text inputs for each option
- "Add option" button
- Validation ensures at least 2 options and one correct answer

## Visual Design

### Extracted MCQ Display
```
┌─────────────────────────────────────────────────────┐
│ What is the capital of France?                      │
│ [mcq] [medium] [2 marks] [4 options]               │
│                                                      │
│ ├─ ✅ Paris                                         │
│ ├─ ⭕ London                                        │
│ ├─ ⭕ Berlin                                        │
│ └─ ⭕ Madrid                                        │
└─────────────────────────────────────────────────────┘
```

### Edit Mode
```
┌─────────────────────────────────────────────────────┐
│ Question Text: [textarea]                           │
│ Type: [mcq ▼] Difficulty: [medium ▼] Marks: [2]   │
│                                                      │
│ Options:                                            │
│ ⦿ [Paris          ]  ← Selected as correct         │
│ ○ [London         ]                                 │
│ ○ [Berlin         ]                                 │
│ ○ [Madrid         ]                                 │
│ + Add option                                        │
│                                                      │
│ [Save] [Cancel]                                     │
└─────────────────────────────────────────────────────┘
```

## Key Features

1. **Correct Answer Identification**: Green checkmark (✓) clearly marks the correct answer
2. **Visual Distinction**: Correct answers are styled differently (green text, bold)
3. **Full Editability**: All aspects of MCQ can be edited before import
4. **Validation**: Ensures MCQs have at least 2 options and one correct answer
5. **Consistent UI**: Same MCQ display pattern used throughout the app

## Files Involved

### Backend
- `apps/api/src/lib/question-extractor.ts` - AI extraction logic
- `apps/api/src/routes/question-extract.ts` - Upload and import endpoints

### Frontend
- `apps/web/src/app/dashboard/questions/page.tsx` - Upload UI and review interface
- `apps/web/src/lib/api.ts` - API client with questionExtractApi methods

### Database
- `questionOptions` table stores MCQ options
- Linked to questions via `questionId`
- `isCorrect` field marks the correct answer

## Testing MCQ Extraction

1. Upload a question paper with MCQs
2. Verify all options are extracted
3. Check that correct answer is marked with green checkmark
4. Edit an MCQ and change the correct answer
5. Import and verify options are saved correctly
6. Create an exam with the MCQ and verify it displays properly

## Conclusion

The MCQ handling is comprehensive and user-friendly:
- ✅ AI extracts options correctly
- ✅ Options are clearly displayed with correct answer marked
- ✅ Full editing capabilities before import
- ✅ Consistent UI across manual and AI-generated questions
- ✅ Proper database storage and retrieval
