import { createWorker } from 'tesseract.js';
import { GeminiService } from '../ai/geminiService';

export interface ExtractedOcrResult {
  text: string;
  confidence: number;
  lines: string[];
}

/**
 * Preprocesses camera photos on an HTML5 canvas:
 * - Downsamples high-resolution 12MP/48MP smartphone photos to an optimal OCR size (max 1800px)
 *   to avoid mobile WebAssembly out-of-memory crashes.
 * - Enhances contrast for book text and printed documents.
 */
async function preprocessImageForOcr(
  fileOrBlob: File | Blob
): Promise<{ blob: Blob; base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();

      img.onload = () => {
        const MAX_DIMENSION = 1800;
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const rawBase64 = dataUrl.split(',')[1] || '';
          resolve({ blob: fileOrBlob, base64: rawBase64, mimeType: fileOrBlob.type || 'image/jpeg' });
          return;
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        // Enhance contrast for document/page text
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            // Moderate contrast stretch
            const contrast = gray < 120 ? Math.max(0, gray * 0.85) : Math.min(255, gray * 1.15);
            d[i] = contrast;
            d[i + 1] = contrast;
            d[i + 2] = contrast;
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (_) {
          // If security prevents getImageData, proceed with raw draw
        }

        canvas.toBlob(
          (blob) => {
            const resultBlob = blob || fileOrBlob;
            const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const base64 = finalDataUrl.split(',')[1] || '';
            resolve({ blob: resultBlob, base64, mimeType: 'image/jpeg' });
          },
          'image/jpeg',
          0.9
        );
      };

      img.onerror = (e) => reject(new Error('Failed to load image for OCR processing'));
      img.src = dataUrl;
    };

    reader.onerror = (e) => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(fileOrBlob);
  });
}

export async function parseImageOcr(
  imageFileOrBlob: File | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedOcrResult> {
  onProgress?.(10, 'Optimizing photo for text recognition...');

  let preprocessed: { blob: Blob; base64: string; mimeType: string };
  try {
    preprocessed = await preprocessImageForOcr(imageFileOrBlob);
  } catch (err) {
    console.warn('Preprocessing fallback:', err);
    preprocessed = {
      blob: imageFileOrBlob,
      base64: '',
      mimeType: imageFileOrBlob.type || 'image/jpeg',
    };
  }

  // 1. Try Gemini Vision OCR if user configured a Gemini API key
  const apiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
  if (apiKey && apiKey.trim().length > 10 && preprocessed.base64) {
    try {
      onProgress?.(30, 'Scanning image with Gemini AI Vision...');
      const geminiText = await GeminiService.ocrImageWithGemini(
        preprocessed.base64,
        preprocessed.mimeType,
        apiKey
      );

      if (geminiText && geminiText.trim().length > 0) {
        onProgress?.(100, 'OCR text recognition complete.');
        const lines = geminiText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        return {
          text: geminiText.trim(),
          confidence: 99,
          lines,
        };
      }
    } catch (geminiErr) {
      console.warn('Gemini vision OCR fallback to local Tesseract:', geminiErr);
    }
  }

  // 2. Client-side local offline Tesseract.js OCR
  onProgress?.(25, 'Initializing offline OCR engine...');

  // Match language if configured (e.g., 'spa' for Spanish, 'fra' for French, 'deu' for German)
  let langCode = 'eng';
  const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('SELECTED_LANGUAGE') : null;
  if (savedLang) {
    if (savedLang.startsWith('es')) langCode = 'spa';
    else if (savedLang.startsWith('fr')) langCode = 'fra';
    else if (savedLang.startsWith('de')) langCode = 'deu';
    else if (savedLang.startsWith('it')) langCode = 'ita';
    else if (savedLang.startsWith('pt')) langCode = 'por';
  }

  let worker: any = null;

  try {
    worker = await createWorker(langCode, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const p = Math.min(95, Math.round((m.progress || 0) * 70) + 25);
          onProgress?.(p, `Scanning text in photo (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });

    onProgress?.(50, 'Extracting text from photo scan...');
    const ret = await worker.recognize(preprocessed.blob);
    await worker.terminate();
    worker = null;

    const rawText = (ret.data?.text || '').trim();
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (!rawText) {
      throw new Error('No readable text found in photo. Please ensure good lighting and clear focus.');
    }

    onProgress?.(100, 'OCR text recognition complete.');

    return {
      text: rawText,
      confidence: ret.data?.confidence || 80,
      lines,
    };
  } catch (err: any) {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
    console.error('Tesseract error:', err);
    throw new Error(`Photo OCR recognition failed: ${err.message || 'Could not read text'}`);
  }
}
