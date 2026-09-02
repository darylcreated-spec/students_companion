import { LectureDocument, LectureSegment, DocumentType } from '../../types';
import { parsePptxFile } from './pptxParser';
import { parseDocxFile } from './docxParser';
import { parsePdfFile } from './pdfParser';
import { parseTxtFile } from './txtParser';

const WORDS_PER_MINUTE = 140; // Spoken audio reading rate
const TARGET_CHAPTER_DURATION_SEC = 240; // 4 minutes target per chapter (~560 words)

export async function extractDocumentText(file: File): Promise<{
  document: Omit<LectureDocument, 'id'>;
  segments: LectureSegment[];
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
    rawItems = parsed.slides.map(s => ({
      title: s.title,
      text: s.combinedText,
      pageOrSlide: s.slideNumber
    }));
  } else if (fileName.endsWith('.docx')) {
    type = 'docx';
    const parsed = await parseDocxFile(file);
    rawText = parsed.text;
    totalCount = Math.max(1, Math.ceil(parsed.paragraphs.length / 4));
    rawItems = parsed.paragraphs.map((p, idx) => ({
      title: p.length < 60 ? p : undefined,
      text: p,
      pageOrSlide: idx + 1
    }));
  } else if (fileName.endsWith('.pdf')) {
    type = 'pdf';
    const parsed = await parsePdfFile(file);
    rawText = parsed.fullText;
    totalCount = parsed.pages.length;
    rawItems = parsed.pages.map(p => ({
      title: `Page ${p.pageNumber}`,
      text: p.text,
      pageOrSlide: p.pageNumber
    }));
  } else {
    type = 'txt';
    const parsed = await parseTxtFile(file);
    rawText = parsed.text;
    totalCount = parsed.sections.length;
    rawItems = parsed.sections.map((s, idx) => ({
      title: s.title,
      text: s.content,
      pageOrSlide: idx + 1
    }));
  }

  // Divide into 3-5 minute audio chapters
  const segments = chunkIntoAudioChapters(rawItems, file.name.replace(/\.[^/.]+$/, ''));
  const totalDurationMinutes = Math.max(1, Math.round(segments.reduce((acc, s) => acc + s.estimatedSeconds, 0) / 60));

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
      segments
    },
    segments
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
        originalContent: 'No readable content found.',
        synthesizedAudioText: 'This document contains no readable text.',
        estimatedSeconds: 30,
        keyPoints: ['No text found in document']
      }
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

    // Check if adding this item exceeds target chapter size (500 words ~ 3.5 mins)
    if (accumulatedWords > 350 && (accumulatedWords + itemWordCount > 600 || (item.title && item.title.length > 5))) {
      // Finalize current chapter
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
        keyPoints: currentKeyPoints.length > 0 ? currentKeyPoints : extractQuickKeyPoints(originalContent)
      });

      // Reset for next chapter
      chapterIndex++;
      currentChunkTexts = [];
      currentKeyPoints = [];
      accumulatedWords = 0;
      currentTitle = item.title || `Part ${chapterIndex + 1}: ${fallbackTitle}`;
      currentSlide = item.pageOrSlide;
    }

    currentChunkTexts.push(item.text);
    accumulatedWords += itemWordCount;

    // Extract potential bullets as key points
    const lines = item.text.split('\n');
    for (const l of lines) {
      const cleanLine = l.trim().replace(/^[-•*–—\d.)]+\s*/, '');
      if (cleanLine.length > 20 && cleanLine.length < 140 && currentKeyPoints.length < 4) {
        currentKeyPoints.push(cleanLine);
      }
    }
  }

  // Push remaining content
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
      keyPoints: currentKeyPoints.length > 0 ? currentKeyPoints : extractQuickKeyPoints(originalContent)
    });
  }

  return segments;
}

function createConversationalNarrative(title: string, content: string, chapterNum: number): string {
  // Clean bullet symbols and academic shorthand into smooth audio prose
  const cleanContent = content
    .replace(/^Slide \d+:\s*/gim, '')
    .replace(/^\[Speaker Notes:\s*/gim, 'Speaker note: ')
    .replace(/\]$/gim, '')
    .replace(/[•*–—]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  // Create engaging commuter lecture cadence
  const opener = chapterNum === 1
    ? `Starting Chapter ${chapterNum}, ${title}. `
    : `Moving to Chapter ${chapterNum}, ${title}. `;

  return `${opener}${cleanContent}. That wraps up this section. Next chapter is coming up.`;
}

function extractQuickKeyPoints(content: string): string[] {
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 25);
  if (sentences.length <= 3) return sentences;
  return [sentences[0], sentences[Math.floor(sentences.length / 2)], sentences[sentences.length - 1]];
}

function formatDocTitle(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '');
  return base
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
