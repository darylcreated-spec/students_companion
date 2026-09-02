/**
 * Content Sanitizer & Smart Filtering for Academic Books, Articles & Lectures
 * Automatically filters out Table of Contents, Index pages, Copyright/Publisher junk,
 * Blank pages, Standalone figure captions, and Repeated Header/Footer artifacts.
 */

export interface SanitizerOptions {
  skipTableOfContents?: boolean;
  skipIndex?: boolean;
  skipCopyright?: boolean;
  skipBlankOrLowValue?: boolean;
  filterFigureCaptions?: boolean;
  cleanMathAndSymbols?: boolean;
}

export const DEFAULT_SANITIZER_OPTIONS: SanitizerOptions = {
  skipTableOfContents: true,
  skipIndex: true,
  skipCopyright: true,
  skipBlankOrLowValue: true,
  filterFigureCaptions: true,
  cleanMathAndSymbols: true,
};

export class ContentSanitizer {
  /**
   * Evaluates whether a page/section should be skipped during audio conversion.
   */
  public static shouldSkipSection(
    title: string | undefined,
    text: string,
    options: SanitizerOptions = DEFAULT_SANITIZER_OPTIONS
  ): { skip: boolean; reason?: string } {
    const trimmed = text.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const lower = (trimmed + ' ' + (title || '')).toLowerCase();

    // 1. Blank or Low-Value Noise Page (< 15 words)
    if (options.skipBlankOrLowValue && wordCount < 15) {
      return { skip: true, reason: 'Blank or low-value page' };
    }

    // 2. Table of Contents & Outline Detection
    if (options.skipTableOfContents) {
      if (
        lower.startsWith('table of contents') ||
        lower.startsWith('contents') ||
        lower.startsWith('brief contents') ||
        lower.startsWith('list of figures') ||
        lower.startsWith('list of tables')
      ) {
        return { skip: true, reason: 'Table of Contents' };
      }

      // Check for dot leaders (e.g. "Chapter 1 . . . . . . 15")
      const dotLeaderMatches = trimmed.match(/\.{3,}|\.\s\.\s\.\s\./g);
      if (dotLeaderMatches && dotLeaderMatches.length >= 3) {
        return { skip: true, reason: 'Table of Contents (dot leaders detected)' };
      }

      // High ratio of lines ending with page numbers
      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      const linesEndingInNumbers = lines.filter((l) => /\b\d{1,4}$/.test(l));
      if (lines.length >= 5 && linesEndingInNumbers.length / lines.length > 0.55) {
        return { skip: true, reason: 'Table of Contents page listing' };
      }
    }

    // 3. Index Section Detection
    if (options.skipIndex) {
      if (
        lower.startsWith('index') ||
        lower.startsWith('subject index') ||
        lower.startsWith('author index')
      ) {
        return { skip: true, reason: 'Index section' };
      }

      // Comma-separated page number references (e.g. "Quantum routing, 14, 22-25, 89")
      const indexPatternMatches = trimmed.match(/[a-zA-Z\s]+,\s*\d+(-\d+)?(,\s*\d+(-\d+)?)+/g);
      if (indexPatternMatches && indexPatternMatches.length >= 4) {
        return { skip: true, reason: 'Index page listing' };
      }
    }

    // 4. Copyright, Publisher, ISBN & Cataloging Data
    if (options.skipCopyright) {
      if (
        lower.includes('all rights reserved') ||
        lower.includes('copyright ©') ||
        lower.includes('library of congress cataloging') ||
        lower.includes('published by') ||
        lower.includes('isbn 978-') ||
        lower.includes('printed in the united states') ||
        lower.includes('no part of this publication may be reproduced')
      ) {
        return { skip: true, reason: 'Copyright / Publisher Notice' };
      }
    }

    return { skip: false };
  }

  /**
   * Cleans inline noise, repeated page numbers, figure descriptions, and converts math into spoken audio.
   */
  public static cleanContentForAudio(
    text: string,
    options: SanitizerOptions = DEFAULT_SANITIZER_OPTIONS
  ): string {
    let cleaned = text;

    // 1. Remove standalone page headers/footers (e.g. "Page 42", "Chapter 3 | Physics", "42 of 150")
    cleaned = cleaned.replace(/^\s*(page\s+\d+(\s+of\s+\d+)?|\d+\s+of\s+\d+|\d+)\s*$/gim, '');
    cleaned = cleaned.replace(/^\[Page \d+\]\s*$/gim, '');

    // 2. Remove figure / picture captions (e.g. "Figure 1.2: Diagram...", "[Image: ...]")
    if (options.filterFigureCaptions) {
      cleaned = cleaned.replace(/\b(Figure|Fig\.|Illustration|Photo|Image)\s+\d+(\.\d+)*[:.-]\s*[^.]*(\.|$)/gi, '');
      cleaned = cleaned.replace(/\[(Image|Illustration|Figure|Photo)[^\]]*\]/gi, '');
    }

    // 3. Convert Math, Complex Symbols & Abbreviations into Natural Speech
    if (options.cleanMathAndSymbols) {
      cleaned = cleaned
        .replace(/\bO\(n!\)/gi, 'Big O of N factorial')
        .replace(/\bO\(n\^2\)/gi, 'Big O of N squared')
        .replace(/\bO\(n\s*log\s*n\)/gi, 'Big O of N log N')
        .replace(/\bO\(log\s*n\)/gi, 'Big O of log N')
        .replace(/\bO\(1\)/gi, 'Big O of 1')
        .replace(/\bO\(n\)/gi, 'Big O of N')
        .replace(/(\w+)\^2\b/g, '$1 squared')
        .replace(/(\w+)\^3\b/g, '$1 cubed')
        .replace(/(\d+)%/g, '$1 percent')
        .replace(/\be\.g\.,?\s*/gi, 'for example, ')
        .replace(/\bi\.e\.,?\s*/gi, 'that is, ')
        .replace(/\betc\.\b/gi, 'and so on')
        .replace(/\bvs\.\b/gi, 'versus')
        .replace(/&/g, ' and ')
        .replace(/@/g, ' at ');
    }

    // 4. Remove excessive dot leaders and divider characters
    cleaned = cleaned.replace(/\.{3,}|\.\s\.\s\.\s\./g, ' ');
    cleaned = cleaned.replace(/[-=_*~]{3,}/g, ' ');

    // 5. Normalize whitespace and paragraph line breaks
    cleaned = cleaned
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();

    return cleaned;
  }
}
