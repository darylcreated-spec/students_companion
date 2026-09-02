import JSZip from 'jszip';

export interface ExtractedSlide {
  slideNumber: number;
  title: string;
  bodyText: string[];
  speakerNotes?: string;
  combinedText: string;
}

export async function parsePptxFile(file: File | ArrayBuffer): Promise<{ slides: ExtractedSlide[]; rawText: string }> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const slideFiles = Object.keys(loadedZip.files).filter(filename =>
    filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
  );

  // Sort slides numerically slide1.xml, slide2.xml ...
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/) ?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/) ?.[0] || '0', 10);
    return numA - numB;
  });

  const slides: ExtractedSlide[] = [];
  let fullDocText = '';

  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath = slideFiles[i];
    const slideNum = i + 1;
    const slideXml = await loadedZip.file(slidePath)?.async('text');

    if (!slideXml) continue;

    // Parse XML using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(slideXml, 'text/xml');

    // Extract text elements: <a:t>
    const textNodes = xmlDoc.getElementsByTagName('a:t');
    const textPieces: string[] = [];

    for (let j = 0; j < textNodes.length; j++) {
      const piece = textNodes[j].textContent?.trim();
      if (piece) {
        textPieces.push(piece);
      }
    }

    // Try to get speaker notes if available: ppt/notesSlides/notesSlide[num].xml
    let notesText = '';
    const notePath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    const noteXml = await loadedZip.file(notePath)?.async('text');
    if (noteXml) {
      const noteDoc = parser.parseFromString(noteXml, 'text/xml');
      const noteNodes = noteDoc.getElementsByTagName('a:t');
      const notePieces: string[] = [];
      for (let k = 0; k < noteNodes.length; k++) {
        const text = noteNodes[k].textContent?.trim();
        // Ignore slide number placeholders
        if (text && text !== `${slideNum}` && !text.match(/^[0-9]+$/)) {
          notePieces.push(text);
        }
      }
      notesText = notePieces.join(' ');
    }

    const title = textPieces.length > 0 ? textPieces[0] : `Slide ${slideNum}`;
    const bodyItems = textPieces.length > 1 ? textPieces.slice(1) : textPieces;
    const combined = [
      `Slide ${slideNum}: ${title}`,
      ...bodyItems,
      notesText ? `[Speaker Notes: ${notesText}]` : ''
    ].filter(Boolean).join('\n');

    slides.push({
      slideNumber: slideNum,
      title,
      bodyText: bodyItems,
      speakerNotes: notesText,
      combinedText: combined
    });

    fullDocText += combined + '\n\n';
  }

  return { slides, rawText: fullDocText };
}
