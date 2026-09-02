import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LectureDocument, CommuteNote } from '../../types';

export function downloadPdfStudyGuide(document: LectureDocument, notes: CommuteNote[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // Header Banner
  doc.setFillColor(10, 15, 29); // Obsidian #0A0F1D
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 211, 238); // Cyan
  doc.setFontSize(20);
  doc.text(document.title, 40, 45, { maxWidth: pageWidth - 80 });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 220);
  doc.setFontSize(10);
  doc.text(`The Student's Companion • Audio Runtime: ~${document.durationMinutes} mins • Source: ${document.originalName}`, 40, 72);

  currentY = 115;

  // Chapter Overview Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Chapter & Audio Lecture Breakdown', 40, currentY);
  currentY += 15;

  const tableData = document.segments.map((seg, idx) => [
    `Ch ${idx + 1}`,
    seg.title,
    `~${Math.round(seg.estimatedSeconds / 60)} min`,
    seg.keyPoints ? seg.keyPoints.slice(0, 2).join('\n• ') : 'Key concept overview'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Chapter Title', 'Est. Time', 'Key Core Concepts']],
    body: tableData,
    headStyles: { fillColor: [14, 20, 38], textColor: [34, 211, 238] },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, cellPadding: 6 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 30;

  // Voice Notes Section
  const docNotes = notes.filter(n => n.documentId === document.id);

  if (currentY > 680) {
    doc.addPage();
    currentY = 50;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Commute Voice Notes & AI Categorization', 40, currentY);
  currentY += 15;

  if (docNotes.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('No commute voice notes recorded for this document.', 40, currentY + 15);
  } else {
    const notesTableData = docNotes.map(n => {
      const typeLabel = n.category === 'exam' ? '🚩 EXAM FLAG' : n.category === 'action' ? '⚡ ACTION ITEM' : '💡 KEY CONCEPT';
      return [
        n.timestampFormatted,
        typeLabel,
        n.synthesizedContent,
        `"${n.rawTranscription}"`
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Time', 'Category', 'Synthesized Note', 'Raw Spoken Voice']],
      body: notesTableData,
      headStyles: { fillColor: [14, 20, 38], textColor: [251, 191, 36] }, // Amber head
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 85, fontStyle: 'bold' },
        2: { cellWidth: 200 },
        3: { cellWidth: 150, fontStyle: 'italic', textColor: [100, 100, 100] }
      },
      margin: { left: 40, right: 40 },
      styles: { fontSize: 8.5, cellPadding: 5 }
    });
  }

  const filename = `${document.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Study_Guide.pdf`;
  doc.save(filename);
}
