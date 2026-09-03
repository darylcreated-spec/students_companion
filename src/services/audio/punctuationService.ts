import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Punctuation & Speech Formatting Engine
 * Converts spoken punctuation commands in real-time,
 * auto-capitalizes sentences and pronouns,
 * and provides one-tap intelligent AI/offline punctuation formatting.
 */
export class PunctuationService {
  /**
   * Spoken commands dictionary mapping verbal phrases to punctuation marks.
   */
  public static formatSpokenPunctuation(text: string): string {
    if (!text) return '';

    let formatted = text;

    // 1. Spoken punctuation commands replacement
    formatted = formatted
      .replace(/\b(?:new paragraph|next paragraph)\b/gi, '\n\n')
      .replace(/\b(?:new line|next line)\b/gi, '\n')
      .replace(/\b(?:bullet point|bullet)\b/gi, '\n• ')
      .replace(/\b(?:period|full stop|dot)\b/gi, '.')
      .replace(/\bcomma\b/gi, ',')
      .replace(/\b(?:question mark)\b/gi, '?')
      .replace(/\b(?:exclamation mark|exclamation point)\b/gi, '!')
      .replace(/\b(?:semi colon|semicolon)\b/gi, ';')
      .replace(/\bcolon\b/gi, ':')
      .replace(/\b(?:dash|hyphen)\b/gi, ' - ')
      .replace(/\b(?:open quote|open quotation|start quote)\b/gi, ' "')
      .replace(/\b(?:close quote|close quotation|end quote)\b/gi, '" ')
      .replace(/\b(?:open parenthesis|open paren)\b/gi, ' (')
      .replace(/\b(?:close parenthesis|close paren)\b/gi, ') ');

    // 2. Fix spacing around punctuation marks
    formatted = formatted
      .replace(/\s+([.,!?:;])/g, '$1') // remove space before punctuation
      .replace(/([.,!?:;])(?=[A-Za-z0-9])/g, '$1 ') // ensure space after punctuation if followed by text
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/"\s+/g, '"')
      .replace(/\s+"/g, '"')
      .replace(/\n\s+/g, '\n')
      .replace(/\s+\n/g, '\n')
      .replace(/[ \t]+/g, ' ');

    // 3. Capitalize the start of sentences
    formatted = this.capitalizeSentences(formatted);

    // 4. Capitalize standalone 'I' and common contractions
    formatted = formatted
      .replace(/\bi\b/g, 'I')
      .replace(/\bi'm\b/g, "I'm")
      .replace(/\bi've\b/g, "I've")
      .replace(/\bi'll\b/g, "I'll")
      .replace(/\bi'd\b/g, "I'd");

    return formatted.trim();
  }

  /**
   * Capitalizes the first letter of each sentence following ., !, ?, or newlines.
   */
  public static capitalizeSentences(text: string): string {
    if (!text) return '';

    // Capitalize first character
    let res = text.charAt(0).toUpperCase() + text.slice(1);

    // Capitalize after sentence-ending punctuation followed by space or newline
    res = res.replace(/([.!?\n]\s*)([a-z])/g, (_match, prefix, char) => {
      return prefix + char.toUpperCase();
    });

    return res;
  }

  /**
   * Smart Offline Auto-Punctuate:
   * Heuristically detects questions, pauses, and sentence boundaries for raw unpunctuated voice streams.
   */
  public static autoPunctuateOffline(text: string): string {
    if (!text || text.trim().length === 0) return '';

    // First format any spoken punctuation words
    let cleaned = this.formatSpokenPunctuation(text);

    // Question word patterns at start of clauses
    const questionStarters = [
      'what', 'why', 'how', 'who', 'where', 'when', 'which',
      'is', 'are', 'was', 'were', 'can', 'could', 'should',
      'would', 'do', 'does', 'did', 'will', 'have', 'has'
    ];

    // If text has very few punctuation marks, intelligently punctuate sentences
    const existingPunctCount = (cleaned.match(/[.!?]/g) || []).length;
    const words = cleaned.split(/\s+/);

    if (words.length >= 6 && existingPunctCount === 0) {
      // Chunk every ~8-15 words into sentences if unpunctuated
      const chunks: string[] = [];
      let currentChunk: string[] = [];

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        currentChunk.push(word);

        const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');
        const nextWord = (words[i + 1] || '').toLowerCase().replace(/[^a-z]/g, '');

        const isLongEnough = currentChunk.length >= 8;
        const isVeryLong = currentChunk.length >= 14;
        const nextIsQuestion = questionStarters.includes(nextWord);

        if ((isLongEnough && nextIsQuestion) || isVeryLong || i === words.length - 1) {
          const firstWordOfChunk = currentChunk[0].toLowerCase().replace(/[^a-z]/g, '');
          const isQuestion = questionStarters.includes(firstWordOfChunk);
          const endPunct = isQuestion ? '?' : '.';

          let sentence = currentChunk.join(' ');
          if (!/[.!?]$/.test(sentence)) {
            sentence += endPunct;
          }
          chunks.push(sentence);
          currentChunk = [];
        }
      }

      cleaned = chunks.join(' ');
    } else {
      // Ensure ending punctuation exists
      if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
        const firstWord = cleaned.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
        const isQuestion = questionStarters.includes(firstWord);
        cleaned += isQuestion ? '?' : '.';
      }
    }

    return this.capitalizeSentences(cleaned);
  }

  /**
   * AI-Powered Auto-Punctuate:
   * Uses Gemini AI to restore full punctuation, capitalization, paragraphs, and formatting.
   * Seamlessly falls back to smart offline punctuation if offline or if no API key is provided.
   */
  public static async autoPunctuateWithAI(
    rawText: string,
    apiKey?: string
  ): Promise<string> {
    if (!rawText || !rawText.trim()) return '';

    const key = apiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '');
    if (!key || key.trim().length < 5) {
      return this.autoPunctuateOffline(rawText);
    }

    try {
      const client = new GoogleGenerativeAI(key.trim());
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are an expert transcription punctuation & formatting editor.
Add proper punctuation (periods, commas, question marks, exclamation marks, colons, quotation marks), capitalization, and natural paragraph breaks to the following spoken audio transcription.

CRITICAL RULES:
1. Preserve 100% of the original words. Do NOT omit, rephrase, or hallucinate content.
2. Return ONLY the punctuated transcription without any conversational intro, explanation, or markdown formatting blocks.

Raw Transcription:
"""
${rawText}
"""

Punctuated Transcription:`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text.trim() || this.autoPunctuateOffline(rawText);
    } catch (err) {
      console.warn('AI punctuation failed, falling back to smart offline punctuation:', err);
      return this.autoPunctuateOffline(rawText);
    }
  }
}
