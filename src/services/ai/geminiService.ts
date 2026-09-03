import { GoogleGenerativeAI } from '@google/generative-ai';
import { NoteCategory } from '../../types';

export class GeminiService {
  private static getClient(customKey?: string): GoogleGenerativeAI | null {
    const key = customKey || localStorage.getItem('GEMINI_API_KEY') || '';
    if (!key || key.trim().length < 5) return null;
    return new GoogleGenerativeAI(key.trim());
  }

  /**
   * Commute Rewriter: Restructures dry academic text and slides into a conversational,
   * captivating radio-lecture style narrative optimized for commuters wearing headphones.
   */
  public static async rewriteForCommute(
    chapterTitle: string,
    rawContent: string,
    apiKey?: string
  ): Promise<string> {
    const client = this.getClient(apiKey);
    if (!client) {
      // Fallback offline procedural commute rewriter
      return this.fallbackCommuteRewriter(chapterTitle, rawContent);
    }

    try {
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `You are an award-winning science & academic podcast narrator creating an audio study companion for a student listening during their daily commute.

Transform the following raw lecture slides/notes into an engaging, clear, conversational spoken audio lecture.

Guidelines:
1. Speak directly to the commuter ("As you ride today...", "Picture this in your mind...").
2. Explain complex equations, jargon, and bullet points intuitively using relatable analogies.
3. Pronounce abbreviations clearly and emphasize key takeaways.
4. Keep the pace crisp and engaging (about 300-500 words).
5. Do NOT include markdown bolding, asterisks, bullet points, or stage directions (e.g., [Sound Effect] or *laughs*) since this text will be fed directly to a Text-to-Speech voice engine.

Chapter Title: "${chapterTitle}"
Raw Lecture Content:
${rawContent}

Audio Narrative:`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text.trim() || this.fallbackCommuteRewriter(chapterTitle, rawContent);
    } catch (err) {
      console.warn('Gemini commute rewrite error, falling back to local synthesis:', err);
      return this.fallbackCommuteRewriter(chapterTitle, rawContent);
    }
  }

  /**
   * Note Synthesis & Categorization:
   * Takes raw spoken commuter thoughts, transcribes and cleans up filler words ("um", "uh"),
   * structures the main takeaways, and categorizes into 'action', 'concept', or 'exam'.
   */
  public static async synthesizeCommuteNote(
    rawSpokenText: string,
    currentLectureContext?: string,
    apiKey?: string
  ): Promise<{
    synthesizedText: string;
    category: NoteCategory;
  }> {
    const client = this.getClient(apiKey);
    if (!client) {
      return this.fallbackNoteSynthesis(rawSpokenText);
    }

    try {
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `You are an AI study assistant for a student dictating quick voice notes while on their commute.

Spoken voice transcription from student:
"${rawSpokenText}"

Active Lecture Context:
"${currentLectureContext || 'General Lecture Review'}"

Task:
1. Clean up spoken hesitations and format into a crisp, high-impact study note (1-2 sentences).
2. Classify the note into exactly ONE category:
   - "action": Tasks, homework deadlines, assignments, readings to do.
   - "exam": Midterm/Final alerts, questions the professor emphasized, critical test traps.
   - "concept": Definitions, formulas, architectural patterns, explanations.

Respond ONLY with valid JSON in this exact structure:
{
  "synthesizedText": "Cleaned formatted note text here",
  "category": "action" | "concept" | "exam"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      const validCategory: NoteCategory = ['action', 'concept', 'exam'].includes(parsed.category)
        ? parsed.category
        : 'concept';

      return {
        synthesizedText: parsed.synthesizedText || rawSpokenText,
        category: validCategory
      };
    } catch (err) {
      console.warn('Gemini note synthesis error, falling back to heuristic parsing:', err);
      return this.fallbackNoteSynthesis(rawSpokenText);
    }
  }

  private static fallbackCommuteRewriter(title: string, raw: string): string {
    const clean = raw
      .replace(/[•*–—#_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return `Now focusing on ${title}. ${clean}. Pay close attention to how these concepts connect to your overall syllabus.`;
  }

  private static fallbackNoteSynthesis(raw: string): { synthesizedText: string; category: NoteCategory } {
    const lower = raw.toLowerCase();
    let category: NoteCategory = 'concept';

    if (
      lower.includes('exam') ||
      lower.includes('test') ||
      lower.includes('midterm') ||
      lower.includes('final') ||
      lower.includes('quiz') ||
      lower.includes('remember this') ||
      lower.includes('important')
    ) {
      category = 'exam';
    } else if (
      lower.includes('due') ||
      lower.includes('homework') ||
      lower.includes('submit') ||
      lower.includes('assignment') ||
      lower.includes('read') ||
      lower.includes('email') ||
      lower.includes('problem set')
    ) {
      category = 'action';
    }

    // Capitalize first letter and add period
    const formatted = raw.charAt(0).toUpperCase() + raw.slice(1).trim() + (raw.endsWith('.') ? '' : '.');

    return {
      synthesizedText: formatted,
      category
    };
  }

  /**
   * Multimodal Vision OCR: Extracts text from book photos or scanned pages with high accuracy.
   */
  public static async ocrImageWithGemini(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    apiKey?: string
  ): Promise<string> {
    const client = this.getClient(apiKey);
    if (!client) throw new Error('No Gemini API key available');

    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt =
      'Extract and transcribe all written or printed text in this document/photo verbatim. Do not add conversational commentary or preamble. Preserve headings and paragraph structure accurately.';

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ]);

    return result.response.text().trim();
  }
}
