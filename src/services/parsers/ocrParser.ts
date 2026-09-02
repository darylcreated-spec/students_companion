import { createWorker } from 'tesseract.js';

export interface ExtractedOcrResult {
  text: string;
  confidence: number;
  lines: string[];
}

export async function parseImageOcr(
  imageFileOrBlob: File | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedOcrResult> {
  onProgress?.(10, 'Initializing OCR optical engine...');

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const p = Math.round((m.progress || 0) * 80) + 15;
        onProgress?.(p, `Scanning text in image (${Math.round((m.progress || 0) * 100)}%)...`);
      }
    },
  });

  try {
    onProgress?.(40, 'Extracting text from image scan...');
    const ret = await worker.recognize(imageFileOrBlob);
    await worker.terminate();

    const rawText = ret.data.text || '';
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    onProgress?.(100, 'OCR text recognition complete.');

    return {
      text: rawText,
      confidence: ret.data.confidence,
      lines,
    };
  } catch (err: any) {
    await worker.terminate().catch(() => {});
    throw new Error(`OCR Recognition failed: ${err.message}`);
  }
}
