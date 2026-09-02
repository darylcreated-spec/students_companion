import { LectureDocument, LectureSegment, DocumentType } from '../../types';
import { parsePptxFile } from './pptxParser';
import { parseDocxFile } from './docxParser';
import { parsePdfFile } from './pdfParser';
import { parseTxtFile } from './txtParser';
import { ContentSanitizer, SanitizerOptions, DEFAULT_SANITIZER_OPTIONS } from './contentSanitizer';

const WORDS_PER_MINUTE = 140; // Spoken audio reading rate

export async function extractDocumentText(
  file: File,
  options: SanitizerOptions = DEFAULT_SANITIZER_OPTIONS
): Promise<{
  document: Omit<LectureDocument, 'id'>;
  segments: LectureSegment[];
  skippedSectionsCount: number;
}> {
  const fileName = file.name.toLowerCase();
  let type: DocumentType = 'txt';
  let rawText = '';
  let rawItems: { title?: string; text: string; pageOrSlide?: number }[] = [];
  let totalCount = 1;

  if (fileName.endsWith('.pptx')) {
    type = 'pptx';
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
    const parsed = await parseDocxFile(file);
    rawText = parsed.text;
    totalCount = Math.max(1, Math.ceil(parsed.paragraphs.length / 4));
    rawItems = parsed.paragraphs.map((p, idx) => ({
      title: p.length < 60 ? p : undefined,
      text: p,
      pageOrSlide: idx + 1,
    }));
  } else if (fileName.endsWith('.pdf')) {
    type = 'pdf';
    const parsed = await parsePdfFile(file);
    rawText = parsed.fullText;
    totalCount = parsed.pages.length;
    rawItems = parsed.pages.map((p) => ({
      title: `Page ${p.pageNumber}`,
      text: p.text,
      pageOrSlide: p.pageNumber,
    }));
  } else {
    type = 'txt';
    const parsed = await parseTxtFile(file);
    rawText = parsed.text;
    totalCount = parsed.sections.length;
    rawItems = parsed.sections.map((s, idx) => ({
      title: s.title,
      text: s.content,
      pageOrSlide: idx + 1,
    }));
  }

  // 1. Filter out TOC, Index, Copyright, Blank pages, and Picture legends
  const cleanItems: { title?: string; text: string; pageOrSlide?: number }[] = [];
  let skippedSectionsCount = 0;

  for (const item of rawItems) {
    const { skip, reason } = ContentSanitizer.shouldSkipSection(item.title, item.text, options);
    if (skip) {
      skippedSectionsCount++;
      continue;
    }

    const sanitizedText = ContentSanitizer.cleanContentForAudio(item.text, options);
    if (sanitizedText.split(/\s+/).filter(Boolean).length >= 8) {
      cleanItems.push({
        title: item.title,
        text: sanitizedText,
        pageOrSlide: item.pageOrSlide,
      });
    } else {
      skippedSectionsCount++;
    }
  }

  // 2. Divide remaining sanitized content into 3-5 minute audio chapters
  const segments = chunkIntoAudioChapters(cleanItems, file.name.replace(/\.[^/.]+$/, ''));
  const totalDurationMinutes = Math.max(
    1,
    Math.round(segments.reduce((acc, s) => acc + s.estimatedSeconds, 0) / 60)
  );

  const cleanTitle = formatDocTitle(file.name);

  return {
    document: {
      title: cleanTitle,
      type,
      originalName: file.name,
      fileSize: file.size,
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
      accumulatedWords > 350 &&
      (accumulatedWords + itemWordCount > 600 || (item.title && item.title.length > 5 && !item.title.startsWith('Page ')))
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
