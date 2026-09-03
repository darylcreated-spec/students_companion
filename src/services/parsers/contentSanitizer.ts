/**
 * Content Sanitizer & Speech Pronunciation Utility
 * Preserves 100% of user content without restrictions or skipping,
 * while formatting phonetic symbols and formulas cleanly for the narrator.
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
  skipTableOfContents: false,
  skipIndex: false,
  skipCopyright: false,
  skipBlankOrLowValue: false,
  filterFigureCaptions: false,
  cleanMathAndSymbols: true,
};

export class ContentSanitizer {
  /**
   * No content restrictions: Preserves all pages, chapters, and sections.
   */
  public static shouldSkipSection(
    title: string | undefined,
    text: string,
    options: SanitizerOptions = DEFAULT_SANITIZER_OPTIONS
  ): { skip: boolean; reason?: string } {
    const trimmed = text.trim();

    // Only skip if text is truly empty (0 characters)
    if (!trimmed) {
      return { skip: true, reason: 'Empty section' };
    }

    // Optional user-specified overrides (default disabled)
    if (options.skipBlankOrLowValue && trimmed.split(/\s+/).filter(Boolean).length < 3) {
      return { skip: true, reason: 'Blank page' };
    }

    if (options.skipTableOfContents && /^table of contents/i.test(trimmed)) {
      return { skip: true, reason: 'Table of Contents' };
    }

    if (options.skipIndex && /^index\b/i.test(trimmed)) {
      return { skip: true, reason: 'Index' };
    }

    return { skip: false };
  }

  /**
   * Formats mathematical notations and symbols into clear speech without deleting content.
   */
  public static cleanContentForAudio(
    text: string,
    options: SanitizerOptions = DEFAULT_SANITIZER_OPTIONS
  ): string {
    if (!text) return '';
    let cleaned = text;

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
        .replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent')
        // Temperature & Degrees
        .replace(/(\d+(?:\.\d+)?)[º°]\s*C\b/g, '$1 degrees Celsius')
        .replace(/(\d+(?:\.\d+)?)[º°](?!\w)/g, '$1 degrees')
        // Chemical Formulas
        .replace(/\bC2H5OH\b/g, 'C 2 H 5 O H, chemical ethanol')
        .replace(/\bCO2\b/g, 'C O 2')
        .replace(/\bH2O\b/g, 'H 2 O')
        // Medical & Industrial Safety Pronunciations
        .replace(/\bFEV1\b/g, 'F E V 1, Forced Expiratory Volume')
        .replace(/\bFVC\b/g, 'F V C, Forced Vital Capacity')
        .replace(/\bAR-AFFF\b/g, 'Alcohol-Resistant Aqueous Film-Forming Foam')
        .replace(/\bACH\b/g, 'Air Changes per Hour')
        .replace(/\bLEL\b/g, 'Lower Explosive Limit')
        .replace(/\bUEL\b/g, 'Upper Explosive Limit')
        .replace(/\bPTW\b/g, 'Permit To Work')
        .replace(/\bSCBA\b/g, 'Self Contained Breathing Apparatus')
        .replace(/\bChap\.\s*/gi, 'Chapter ')
        .replace(/\be\.g\.,?\s*/gi, 'for example, ')
        .replace(/\bi\.e\.,?\s*/gi, 'that is, ')
        .replace(/\betc\.\b/gi, 'and so on')
        .replace(/\bvs\.\b/gi, 'versus')
        .replace(/&/g, ' and ')
        .replace(/@/g, ' at ');
    }

    return cleaned.trim();
  }
}
