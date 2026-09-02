export interface ParsedSection {
  title: string;
  content: string;
}

export async function parseTxtFile(file: File | string): Promise<{ text: string; sections: ParsedSection[] }> {
  let rawText = '';
  if (typeof file === 'string') {
    rawText = file;
  } else {
    rawText = await file.text();
  }

  // Detect markdown headings # or ## or standard section breaks
  const lines = rawText.split('\n');
  const sections: ParsedSection[] = [];
  let currentTitle = 'Introduction';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      if (currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n').trim()
        });
        currentContent = [];
      }
      currentTitle = trimmed.replace(/^#+\s*/, '');
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n').trim()
    });
  }

  return { text: rawText, sections };
}
