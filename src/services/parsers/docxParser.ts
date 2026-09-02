import mammoth from 'mammoth';

export async function parseDocxFile(file: File | ArrayBuffer): Promise<{ text: string; paragraphs: string[] }> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
  }

  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value || '';
  
  // Split into paragraphs
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return {
    text: rawText,
    paragraphs
  };
}
