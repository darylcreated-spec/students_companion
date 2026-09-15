import { GoogleGenerativeAI } from '@google/generative-ai';
import { SentenceEvaluationResult, TargetWordDetail } from '../../types';

export class SentenceEvaluator {
  private static getClient(customKey?: string): GoogleGenerativeAI | null {
    const key = customKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '');
    if (!key || key.trim().length < 5) return null;
    return new GoogleGenerativeAI(key.trim());
  }

  /**
   * Evaluates an original student-written sentence using Gemini 2.5 Flash,
   * falling back to local heuristic evaluation if offline or without an API key.
   */
  public static async evaluateSentence(
    sentence: string,
    targetWord: TargetWordDetail,
    apiKey?: string
  ): Promise<SentenceEvaluationResult> {
    const cleanSentence = sentence.trim();
    const word = targetWord.word.toLowerCase();

    // 1. Basic validation: must contain target word
    if (!cleanSentence.toLowerCase().includes(word)) {
      return {
        isValid: false,
        score: 20,
        syntaxFeedback: `Your sentence does not appear to include the target word "${targetWord.word}".`,
        semanticFeedback: `Make sure to use "${targetWord.word}" directly in your sentence.`,
        suggestedImprovement: `Try writing a sentence describing a time you had to ${targetWord.word}.`
      };
    }

    const client = this.getClient(apiKey);
    if (!client) {
      return this.fallbackHeuristicEvaluation(cleanSentence, targetWord);
    }

    try {
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `You are an expert educator and literacy specialist evaluating a student's original sentence.

Target Word: "${targetWord.word}" (${targetWord.partOfSpeech})
Target Meaning: "${targetWord.definition}"
Student's Sentence: "${cleanSentence}"

Evaluate the sentence based on 3 criteria:
1. Syntax & Grammar: Is the word used as its correct part of speech with sound grammar?
2. Semantic Accuracy: Does the sentence demonstrate authentic understanding of the word's definition (rather than merely slotting the word in)?
3. Contextual Richness: Is there enough context to reveal the word's meaning?

Respond ONLY in valid JSON matching this exact schema:
{
  "isValid": boolean (true if score >= 70),
  "score": number (0 to 100),
  "syntaxFeedback": string (1-2 friendly, supportive sentences on grammar and part of speech),
  "semanticFeedback": string (1-2 sentences explaining how well the meaning was demonstrated),
  "suggestedImprovement": string (optional refinement to elevate the student's writing)
}`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();
      
      // Extract JSON if model wrapped in markdown fences
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as SentenceEvaluationResult;
        return {
          isValid: Boolean(parsed.isValid),
          score: Math.max(0, Math.min(100, Number(parsed.score) || 75)),
          syntaxFeedback: parsed.syntaxFeedback || 'Grammar and part of speech look good.',
          semanticFeedback: parsed.semanticFeedback || 'Word is used accurately in context.',
          suggestedImprovement: parsed.suggestedImprovement
        };
      }

      return this.fallbackHeuristicEvaluation(cleanSentence, targetWord);
    } catch (err) {
      console.warn('Gemini sentence evaluation error, using heuristic fallback:', err);
      return this.fallbackHeuristicEvaluation(cleanSentence, targetWord);
    }
  }

  /**
   * Deterministic, zero-dependency educator heuristic evaluation for offline use.
   */
  private static fallbackHeuristicEvaluation(
    sentence: string,
    targetWord: TargetWordDetail
  ): SentenceEvaluationResult {
    const words = sentence.split(/\s+/).filter(Boolean);
    const lower = sentence.toLowerCase();
    const target = targetWord.word.toLowerCase();

    // Check sentence length
    if (words.length < 6) {
      return {
        isValid: false,
        score: 45,
        syntaxFeedback: 'Your sentence is quite short.',
        semanticFeedback: 'Provide more surrounding context so the meaning of the word becomes clear.',
        suggestedImprovement: `Add a reason or specific example explaining why or how "${targetWord.word}" applies.`
      };
    }

    // Check for empty tautologies (e.g., "The definition of empirical is empirical")
    if (lower.includes(`word is ${target}`) || lower.includes(`definition of ${target}`)) {
      return {
        isValid: false,
        score: 40,
        syntaxFeedback: 'Avoid simply stating the word name.',
        semanticFeedback: 'Put the word into an authentic real-world scenario rather than talking about the word itself.',
        suggestedImprovement: `Describe a situation, scientific test, or conversation where someone needs to ${targetWord.word}.`
      };
    }

    // Check terminal punctuation
    const hasPunctuation = /[.!?]$/.test(sentence);
    const syntaxNote = hasPunctuation
      ? 'Sentence structure and terminal punctuation are well formed.'
      : 'Remember to end your sentence with a period or terminal punctuation.';

    return {
      isValid: true,
      score: hasPunctuation ? 88 : 78,
      syntaxFeedback: syntaxNote,
      semanticFeedback: `Great contextual application! You placed "${targetWord.word}" naturally within your thought.`,
      suggestedImprovement: `Consider adding an introductory adverbial clause to make your sentence even more impactful.`
    };
  }
}
