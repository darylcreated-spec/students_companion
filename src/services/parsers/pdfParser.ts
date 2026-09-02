import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for browser/PWA bundle
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker configuration fallback:', e);
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
}

export async function parsePdfFile(file: File | ArrayBuffer): Promise<{ pages: ExtractedPdfPage[]; fullText: string }> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: ExtractedPdfPage[] = [];
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Combine text items preserving space
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pages.push({
      pageNumber: pageNum,
      text: pageText
    });

    fullText += `\n[Page ${pageNum}]\n` + pageText + '\n';
  }

  return { pages, fullText };
}
