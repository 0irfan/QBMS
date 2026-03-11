# Question Paper Upload & AI Extraction Feature

## Overview
Allow instructors to upload question papers (PDF/images) and use AI to extract questions automatically, with manual review and approval before adding to the question bank.

## Workflow
1. Instructor uploads question paper file (PDF, PNG, JPG)
2. System extracts text using OCR (if image) or PDF parsing
3. OpenAI GPT analyzes text and extracts structured questions
4. Instructor reviews extracted questions in a UI
5. Instructor can edit, approve, or reject each question
6. Approved questions are bulk-imported into the question bank

## Technical Components

### Backend (API)

#### 1. Upload Endpoint
```
POST /api/questions/upload-paper
- Accept multipart/form-data with file
- Support PDF, PNG, JPG, JPEG formats
- Upload to Azure Blob Storage
- Return upload ID for tracking
```

#### 2. Extract Questions Endpoint
```
POST /api/questions/extract
- Input: file URL, subject ID, topic ID
- Use pdf-parse for PDFs or Tesseract OCR for images
- Send extracted text to OpenAI with structured prompt
- Return array of extracted questions with metadata
```

#### 3. Bulk Import Endpoint
```
POST /api/questions/bulk-import
- Input: array of approved questions
- Validate each question
- Insert into database
- Return success/failure for each
```

### Frontend (Web)

#### 1. Upload Page
- File upload dropzone
- Subject and topic selection
- Progress indicator
- Preview uploaded file

#### 2. Review Interface
- List of extracted questions
- Each question shows:
  - Question text
  - Type (MCQ, short, essay)
  - Difficulty
  - Marks
  - Options (if MCQ)
- Actions per question:
  - Edit inline
  - Approve (checkmark)
  - Reject (X)
- Bulk actions:
  - Approve all
  - Import selected

### AI Prompt Structure

```
You are extracting questions from an exam paper. Parse the following text and return a JSON array of questions.

For each question, extract:
- questionText: the full question text
- type: "mcq", "short", or "essay"
- difficulty: "easy", "medium", or "hard" (estimate based on complexity)
- marks: number of marks allocated
- options: array of options (if MCQ) with optionText and isCorrect

Text to parse:
{extracted_text}

Return only valid JSON array, no additional text.
```

## Dependencies Needed

### Backend
```json
{
  "pdf-parse": "^1.1.1",           // PDF text extraction
  "tesseract.js": "^5.0.0",        // OCR for images
  "multer": "^1.4.5-lts.1",        // File upload handling
  "sharp": "^0.33.0"               // Image processing
}
```

### Frontend
```json
{
  "react-dropzone": "^14.2.3",     // File upload UI
  "react-pdf": "^7.7.0"            // PDF preview
}
```

## Database Schema
No new tables needed - uses existing `questions` and `questionOptions` tables.

## Implementation Steps

1. Add file upload endpoint with Azure Blob Storage
2. Implement PDF/image text extraction
3. Create OpenAI extraction prompt and parser
4. Build review UI component
5. Add bulk import functionality
6. Add error handling and validation
7. Test with sample question papers

## Estimated Effort
- Backend: 4-6 hours
- Frontend: 3-4 hours
- Testing: 2 hours
- Total: ~10 hours

## Future Enhancements
- Support for multiple languages
- Auto-detect question types
- Learn from instructor corrections
- Batch processing multiple files
- Export/import question banks
