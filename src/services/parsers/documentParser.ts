import { LectureDocument, LectureSegment, DocumentType } from '../../types';
import { parsePptxFile } from './pptxParser';
import { parseDocxFile } from './docxParser';
import { parsePdfFile } from './pdfParser';
import { parseTxtFile } from './txtParser';
import { parseImageOcr } from './ocrParser';
import { ContentSanitizer, SanitizerOptions, DEFAULT_SANITIZER_OPTIONS } from './contentSanitizer';

const WORDS_PER_MINUTE = 140; // Spoken audio reading rate

export interface IngestionInput {
  file?: File;
  rawTextContent?: string;
  sourceType?: 'file' | 'image-ocr' | 'google-doc' | 'onedrive' | 'web-article' | 'paste';
  customTitle?: string;
}

export async function extractDocumentText(
  input: File | IngestionInput,
  options: SanitizerOptions = DEFAULT_SANITIZER_OPTIONS,
  onProgress?: (progress: number, status: string) => void
): Promise<{
  document: Omit<LectureDocument, 'id'>;
  segments: LectureSegment[];
  skippedSectionsCount: number;
}> {
  let file: File | undefined;
  let rawTextContent: string | undefined;
  let sourceType: string = 'file';
  let customTitle: string | undefined;

  if (input instanceof File) {
    file = input;
  } else {
    file = input.file;
    rawTextContent = input.rawTextContent;
    sourceType = input.sourceType || 'file';
    customTitle = input.customTitle;
  }

  const fileName = (file?.name || customTitle || 'Document').toLowerCase();
  let type: DocumentType = 'txt';
  let rawText = '';
  let rawItems: { title?: string; text: string; pageOrSlide?: number }[] = [];
  let totalCount = 1;

  if (file) {
    if (fileName.endsWith('.pptx')) {
      type = 'pptx';
      onProgress?.(25, 'Parsing presentation slides & speaker notes...');
      const parsed = await parsePptxFile(file);
      rawText = parsed.rawText;
      totalCount = parsed.slides.length;
      rawItems = parsed.slides.map((s) => ({
        title: s.title,
        text: s.combinedText,
        pageOrSlide: s.slideNumber,
      }));
    } else if (fileName.endsWith('.docx')) {
      type = 'docx';
      onProgress?.(25, 'Parsing Word document structure...');
      const parsed = await parseDocxFile(file);
      rawText = parsed.text;
      totalCount = Math.max(1, Math.ceil(parsed.paragraphs.length / 4));
      rawItems = splitTextIntoStructuredSections(parsed.text);
    } else if (fileName.endsWith('.pdf')) {
      type = 'pdf';
      onProgress?.(25, 'Extracting text and pages from PDF...');
      const parsed = await parsePdfFile(file);
      rawText = parsed.fullText;
      totalCount = parsed.pages.length;
      rawItems = parsed.pages.map((p) => ({
        title: `Page ${p.pageNumber}`,
        text: p.text,
        pageOrSlide: p.pageNumber,
      }));
    } else if (
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.webp') ||
      fileName.endsWith('.bmp')
    ) {
      type = 'txt';
      onProgress?.(20, 'Running OCR image recognition...');
      const ocrResult = await parseImageOcr(file, onProgress);
      rawText = ocrResult.text;
      totalCount = 1;
      rawItems = splitTextIntoStructuredSections(ocrResult.text);
    } else {
      type = 'txt';
      onProgress?.(25, 'Parsing document sections...');
      const parsed = await parseTxtFile(file);
      rawText = parsed.text;
      totalCount = parsed.sections.length;
      rawItems = parsed.sections.map((s, idx) => ({
        title: s.title,
        text: s.content,
        pageOrSlide: idx + 1,
      }));
    }
  } else if (rawTextContent) {
    rawText = rawTextContent;
    type = 'txt';
    rawItems = splitTextIntoStructuredSections(rawTextContent);
    totalCount = rawItems.length;
  }

  onProgress?.(70, 'Sanitizing text and removing noise...');

  // Ingest all sections completely with zero content restrictions
  const cleanItems: { title?: string; text: string; pageOrSlide?: number }[] = [];
  let skippedSectionsCount = 0;

  for (const item of rawItems) {
    const text = item.text.trim();
    if (!text) continue;

    const sanitizedText = ContentSanitizer.cleanContentForAudio(text, options);
    cleanItems.push({
      title: item.title,
      text: sanitizedText || text,
      pageOrSlide: item.pageOrSlide,
    });
  }

  onProgress?.(85, 'Dividing into structured audio chapters...');

  const fallbackDocTitle = customTitle || (file ? file.name.replace(/\.[^/.]+$/, '') : 'Lecture');
  const segments = chunkIntoAudioChapters(cleanItems, fallbackDocTitle);
  const totalDurationMinutes = Math.max(
    1,
    Math.round(segments.reduce((acc, s) => acc + s.estimatedSeconds, 0) / 60)
  );

  const cleanTitle = formatDocTitle(customTitle || file?.name || 'Lecture Content');

  return {
    document: {
      title: cleanTitle,
      type,
      originalName: file?.name || `${cleanTitle}.txt`,
      fileSize: file?.size || rawText.length,
      totalPagesOrSlides: totalCount,
      uploadedAt: Date.now(),
      durationMinutes: totalDurationMinutes,
      rawText,
      status: 'ready',
      segments,
    },
    segments,
    skippedSectionsCount,
  };
}

/**
 * Automatically recognizes chapter/section headers and divides long text into coherent sections.
 */
function splitTextIntoStructuredSections(text: string): { title?: string; text: string }[] {
  const lines = text.split('\n');
  const sections: { title?: string; text: string }[] = [];
  let currentTitle: string | undefined;
  let currentParagraphs: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isHeading =
      /^#{1,4}\s+/.test(line) ||
      /^(Chapter|Section|Module|Part|Lecture)\s+\d+[:.-]?/i.test(line) ||
      (line.length < 60 && /^[A-Z0-9\s:.-]{4,}$/.test(line) && !line.endsWith('.'));

    if (isHeading && currentParagraphs.length > 0) {
      sections.push({
        title: currentTitle,
        text: currentParagraphs.join('\n\n'),
      });
      currentParagraphs = [];
      currentTitle = line.replace(/^#{1,4}\s+/, '');
    } else if (isHeading && !currentTitle) {
      currentTitle = line.replace(/^#{1,4}\s+/, '');
    } else {
      currentParagraphs.push(line);
    }
  }

  if (currentParagraphs.length > 0) {
    sections.push({
      title: currentTitle,
      text: currentParagraphs.join('\n\n'),
    });
  }

  return sections.length > 0 ? sections : [{ title: 'Overview', text }];
}

function chunkIntoAudioChapters(
  items: { title?: string; text: string; pageOrSlide?: number }[],
  fallbackTitle: string
): LectureSegment[] {
  if (items.length === 0) {
    return [
      {
        id: `seg-${Date.now()}-0`,
        chapterIndex: 0,
        title: 'Overview',
        originalContent: 'No readable text was found after filtering non-essential content.',
        synthesizedAudioText: 'This document contained no readable chapter text after filtering.',
        estimatedSeconds: 30,
        keyPoints: ['Document had no substantive chapters'],
      },
    ];
  }

  const segments: LectureSegment[] = [];
  let currentChunkTexts: string[] = [];
  let currentKeyPoints: string[] = [];
  let currentTitle = items[0].title || `${fallbackTitle} - Part 1`;
  let currentSlide = items[0].pageOrSlide;
  let accumulatedWords = 0;
  let chapterIndex = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemWordCount = item.text.split(/\s+/).filter(Boolean).length;

    // Target ~450 words per chapter (~3.5 minutes of spoken audio)
    if (
      accumulatedWords > 320 &&
      (accumulatedWords + itemWordCount > 550 ||
        (item.title && item.title.length > 4 && !item.title.startsWith('Page ')))
    ) {
      const originalContent = currentChunkTexts.join('\n\n');
      const estimatedSec = Math.max(45, Math.round((accumulatedWords / WORDS_PER_MINUTE) * 60));
      const synthesized = createConversationalNarrative(currentTitle, originalContent, chapterIndex + 1);

      segments.push({
        id: `seg-${Date.now()}-${chapterIndex}`,
        chapterIndex,
        title: `${chapterIndex + 1}. ${currentTitle}`,
        originalContent,
        synthesizedAudioText: synthesized,
        estimatedSeconds: estimatedSec,
        slideNumber: currentSlide,
        keyPoints:
          currentKeyPoints.length > 0 ? currentKeyPoints : extractQuickKeyPoints(originalContent),
      });

      chapterIndex++;
      currentChunkTexts = [];
      currentKeyPoints = [];
      accumulatedWords = 0;
      currentTitle = item.title || `Part ${chapterIndex + 1}: ${fallbackTitle}`;
      currentSlide = item.pageOrSlide;
    }

    currentChunkTexts.push(item.text);
    accumulatedWords += itemWordCount;

    // Extract bullet points
    const lines = item.text.split('\n');
    for (const l of lines) {
      const cleanLine = l.trim().replace(/^[-•*–—\d.)]+\s*/, '');
      if (cleanLine.length > 20 && cleanLine.length < 140 && currentKeyPoints.length < 4) {
        currentKeyPoints.push(cleanLine);
      }
    }
  }

  if (currentChunkTexts.length > 0) {
    const originalContent = currentChunkTexts.join('\n\n');
    const estimatedSec = Math.max(45, Math.round((accumulatedWords / WORDS_PER_MINUTE) * 60));
    const synthesized = createConversationalNarrative(currentTitle, originalContent, chapterIndex + 1);

    segments.push({
      id: `seg-${Date.now()}-${chapterIndex}`,
      chapterIndex,
      title: `${chapterIndex + 1}. ${currentTitle}`,
      originalContent,
      synthesizedAudioText: synthesized,
      estimatedSeconds: estimatedSec,
      slideNumber: currentSlide,
      keyPoints:
        currentKeyPoints.length > 0 ? currentKeyPoints : extractQuickKeyPoints(originalContent),
    });
  }

  return segments;
}

function createConversationalNarrative(title: string, content: string, chapterNum: number): string {
  const cleanContent = content
    .replace(/^Slide \d+:\s*/gim, '')
    .replace(/^\[Speaker Notes:\s*/gim, 'Speaker note: ')
    .replace(/^[-•*]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  return `Chapter ${chapterNum}: ${title}. ${cleanContent}`;
}

function extractQuickKeyPoints(text: string): string[] {
  const sentences = text
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 130);

  if (sentences.length === 0) {
    return ['Key concept discussed in this section'];
  }

  return sentences.slice(0, 3);
}

function formatDocTitle(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
