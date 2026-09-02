import { Document, Paragraph, TextRun, HeadingLevel, Packer, BorderStyle } from 'docx';
import saveAs from 'file-saver';
import { LectureDocument, CommuteNote } from '../../types';

export async function downloadDocxStudyGuide(document: LectureDocument, notes: CommuteNote[]): Promise<void> {
  const docNotes = notes.filter(n => n.documentId === document.id);
  const examNotes = docNotes.filter(n => n.category === 'exam');
  const actionNotes = docNotes.filter(n => n.category === 'action');
  const conceptNotes = docNotes.filter(n => n.category === 'concept');

  const docParagraphs: Paragraph[] = [
    new Paragraph({
      text: document.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Commute Study Guide • Audio Runtime: ~${document.durationMinutes} mins • Source: ${document.originalName}`,
          italics: true,
          color: '666666'
        })
      ],
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: 'Executive Summary & Chapters',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 }
    })
  ];

  // Add Chapters
  document.segments.forEach((seg, idx) => {
    docParagraphs.push(
      new Paragraph({
        text: `Chapter ${idx + 1}: ${seg.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );

    if (seg.keyPoints && seg.keyPoints.length > 0) {
      seg.keyPoints.forEach(kp => {
        docParagraphs.push(
          new Paragraph({
            text: `• ${kp}`,
            spacing: { after: 50 }
          })
        );
      });
    }

    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Spoken Lecture Narrative: ',
            bold: true,
            color: '006699'
          }),
          new TextRun({
            text: seg.synthesizedAudioText,
            italics: true
          })
        ],
        spacing: { before: 100, after: 250 }
      })
    );
  });

  // Add Commute Voice Notes Section
  docParagraphs.push(
    new Paragraph({
      text: 'Commute Voice Notes & AI Key Findings',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 150 }
    })
  );

  if (examNotes.length > 0) {
    docParagraphs.push(
      new Paragraph({
        text: '🚩 Critical Exam Flags & Test Alerts',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );
    examNotes.forEach(n => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${n.timestampFormatted}] `, bold: true, color: 'CC0000' }),
            new TextRun({ text: n.synthesizedContent, bold: true })
          ],
          spacing: { after: 80 }
        })
      );
    });
  }

  if (actionNotes.length > 0) {
    docParagraphs.push(
      new Paragraph({
        text: '⚡ Action Items & Task List',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );
    actionNotes.forEach(n => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${n.timestampFormatted}] `, bold: true, color: 'E68A00' }),
            new TextRun({ text: `☐ ${n.synthesizedContent}` })
          ],
          spacing: { after: 80 }
        })
      );
    });
  }

  if (conceptNotes.length > 0) {
    docParagraphs.push(
      new Paragraph({
        text: '💡 Core Concepts & Formulations',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    );
    conceptNotes.forEach(n => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${n.timestampFormatted}] `, bold: true, color: '0088CC' }),
            new TextRun({ text: n.synthesizedContent })
          ],
          spacing: { after: 80 }
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${document.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Study_Guide.docx`;
  saveAs(blob, filename);
}
