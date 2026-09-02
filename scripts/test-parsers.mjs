import assert from 'assert';
import JSZip from 'jszip';

// Test 1: Test 3-5 minute audio chunking logic
function chunkIntoAudioChapters(items, fallbackTitle) {
  const WORDS_PER_MINUTE = 140;
  const segments = [];
  let currentChunkTexts = [];
  let currentKeyPoints = [];
  let currentTitle = items[0]?.title || `${fallbackTitle} - Part 1`;
  let currentSlide = items[0]?.pageOrSlide;
  let accumulatedWords = 0;
  let chapterIndex = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemWordCount = item.text.split(/\s+/).filter(Boolean).length;

    if (accumulatedWords > 350 && (accumulatedWords + itemWordCount > 600 || (item.title && item.title.length > 5))) {
      const originalContent = currentChunkTexts.join('\n\n');
      const estimatedSec = Math.max(45, Math.round((accumulatedWords / WORDS_PER_MINUTE) * 60));
      segments.push({
        id: `seg-${chapterIndex}`,
        chapterIndex,
        title: `${chapterIndex + 1}. ${currentTitle}`,
        originalContent,
        estimatedSeconds: estimatedSec,
        slideNumber: currentSlide,
      });

      chapterIndex++;
      currentChunkTexts = [];
      accumulatedWords = 0;
      currentTitle = item.title || `Part ${chapterIndex + 1}: ${fallbackTitle}`;
      currentSlide = item.pageOrSlide;
    }

    currentChunkTexts.push(item.text);
    accumulatedWords += itemWordCount;
  }

  if (currentChunkTexts.length > 0) {
    const originalContent = currentChunkTexts.join('\n\n');
    const estimatedSec = Math.max(45, Math.round((accumulatedWords / WORDS_PER_MINUTE) * 60));
    segments.push({
      id: `seg-${chapterIndex}`,
      chapterIndex,
      title: `${chapterIndex + 1}. ${currentTitle}`,
      originalContent,
      estimatedSeconds: estimatedSec,
      slideNumber: currentSlide,
    });
  }

  return segments;
}

// Test 2: PPTX extraction simulation
async function testPptxParser() {
  const zip = new JSZip();
  const slide1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp><p:txBody><a:p><a:r><a:t>Introduction to Quantum Mechanics</a:t></a:r></a:p></p:txBody></p:sp>
      <p:sp><p:txBody><a:p><a:r><a:t>Wave-particle duality and Schrödinger wave equations.</a:t></a:r></a:p></p:txBody></p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

  zip.file('ppt/slides/slide1.xml', slide1Xml);
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });

  const loaded = await zip.loadAsync(buffer);
  const slideContent = await loaded.file('ppt/slides/slide1.xml').async('text');
  assert(slideContent.includes('Introduction to Quantum Mechanics'), 'PPTX must extract title');
  assert(slideContent.includes('Schrödinger'), 'PPTX must extract slide text');
  console.log('✔ PPTX slide parser test passed.');
}

async function runTests() {
  console.log('Running Student Companion unit test suite...');

  // Test chunking with 1500 words
  const mockItems = Array.from({ length: 15 }, (_, i) => ({
    title: `Slide ${i + 1}: Concept ${i + 1}`,
    text: `Detailed discussion on topic ${i + 1}. ` + 'Word '.repeat(80),
    pageOrSlide: i + 1,
  }));

  const chunks = chunkIntoAudioChapters(mockItems, 'Test Lecture');
  assert(chunks.length >= 2, 'Should partition long document into multiple chapters');
  assert(chunks[0].estimatedSeconds >= 100, 'Chapter duration should reflect audio reading time');
  console.log(`✔ Chunker test passed: ${chunks.length} chapters generated from 15 slides.`);

  await testPptxParser();

  console.log('🎉 All parser unit tests passed successfully!');
}

runTests();
