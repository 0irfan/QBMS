import { getOpenAIClient } from './openai.js';
import pdf from 'pdf-parse';

interface ExtractedQuestion {
  questionText: string;
  type: 'mcq' | 'short' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: Array<{
    optionText: string;
    isCorrect: boolean;
  }>;
}

interface ExtractionResult {
  subjectName: string;
  questions: ExtractedQuestion[];
}

/**
 * Extract text from PDF or image file
 */
async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === 'application/pdf') {
    // Extract text from PDF
    const data = await pdf(file.buffer);
    return data.text;
  } else {
    // For images, we'll use OpenAI Vision API
    // Convert buffer to base64
    const base64Image = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64Image}`;
  }
}

/**
 * Use OpenAI to extract structured questions from text
 */
async function parseQuestionsWithAI(content: string, isImage: boolean): Promise<ExtractionResult> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    let response;

    if (isImage) {
      // Use Vision API for images
      response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the subject name and all questions from this exam paper image. Return a JSON object with:
- subjectName: the subject/course name from the paper (e.g., "Computer Networks", "Data Structures")
- questions: array of questions, each with:
  - questionText: the complete question text
  - type: "mcq" (multiple choice), "short" (short answer), or "essay" (long answer)
  - difficulty: "easy", "medium", or "hard" (estimate based on complexity)
  - marks: number of marks (if visible, otherwise estimate: mcq=1-2, short=2-5, essay=5-10)
  - options: if MCQ, extract all options with optionText and mark one as isCorrect (guess if answer not shown)

Return ONLY a valid JSON object, no additional text or markdown.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: content,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });
    } else {
      // Use regular API for text
      response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting questions from exam papers. Extract questions and return them as a JSON object.`,
          },
          {
            role: 'user',
            content: `Extract the subject name and all questions from this exam paper text. Return a JSON object with:
- subjectName: the subject/course name from the paper (e.g., "Computer Networks", "Data Structures")
- questions: array of questions, each with:
  - questionText: the complete question text
  - type: "mcq" (multiple choice), "short" (short answer), or "essay" (long answer)
  - difficulty: "easy", "medium", or "hard" (estimate based on complexity)
  - marks: number of marks (if visible, otherwise estimate: mcq=1-2, short=2-5, essay=5-10)
  - options: if MCQ, extract all options with optionText and mark one as isCorrect (guess if answer not shown)

Text to parse:
${content}

Return ONLY a valid JSON object, no additional text or markdown.`,
          },
        ],
        max_tokens: 4000,
      });
    }

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from AI');
    }

    // Clean up response - remove markdown code blocks if present
    let jsonText = result.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);
    
    if (!parsed.subjectName || !Array.isArray(parsed.questions)) {
      throw new Error('AI response missing subjectName or questions array');
    }

    return {
      subjectName: parsed.subjectName,
      questions: parsed.questions.map((q: any) => ({
        questionText: q.questionText || '',
        type: ['mcq', 'short', 'essay'].includes(q.type) ? q.type : 'short',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        marks: typeof q.marks === 'number' && q.marks > 0 ? q.marks : 2,
        ...(q.type === 'mcq' && q.options ? { options: q.options } : {}),
      })),
    };
  } catch (error) {
    console.error('AI parsing error:', error);
    throw new Error('Failed to parse questions with AI: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Main function to extract questions from uploaded file
 */
export async function extractQuestionsFromFile(file: Express.Multer.File): Promise<ExtractionResult> {
  try {
    // Extract text/image from file
    const content = await extractText(file);
    const isImage = file.mimetype.startsWith('image/');

    // Use AI to parse questions
    const result = await parseQuestionsWithAI(content, isImage);

    return result;
  } catch (error) {
    console.error('Question extraction error:', error);
    throw error;
  }
}
