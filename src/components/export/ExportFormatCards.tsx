import React, { useState } from 'react';
import { FileText, Download, Check } from 'lucide-react';
import { LectureDocument, CommuteNote } from '../../types';
import { downloadPdfStudyGuide } from '../../services/export/pdfExporter';
import { downloadDocxStudyGuide } from '../../services/export/docxExporter';
import { downloadMarkdownFile } from '../../services/export/markdownExporter';
import confetti from 'canvas-confetti';

interface ExportFormatCardsProps {
  document: LectureDocument | null;
  notes: CommuteNote[];
}

export const ExportFormatCards: React.FC<ExportFormatCardsProps> = ({
  document,
  notes,
}) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  if (!document) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#22D3EE', '#FBBF24', '#34D399']
      });
    } catch (_) {}
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'md') => {
    setDownloadingFormat(format);

    try {
      if (format === 'pdf') {
        downloadPdfStudyGuide(document, notes);
      } else if (format === 'docx') {
        await downloadDocxStudyGuide(document, notes);
      } else if (format === 'md') {
        downloadMarkdownFile(document, notes);
      }
      triggerConfetti();
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1200);
    }
  };

  const formats = [
    {
      id: 'pdf' as const,
      title: 'PDF Study Sheet',
      desc: 'Print-ready formatted document with tables & exam flags',
      color: 'from-red-500/20 to-red-500/5 text-red-300 border-red-500/30',
      btnColor: 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30',
    },
    {
      id: 'docx' as const,
      title: 'Word Document',
      desc: 'Editable Microsoft Word guide with structured headers',
      color: 'from-blue-500/20 to-blue-500/5 text-blue-300 border-blue-500/30',
      btnColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30',
    },
    {
      id: 'md' as const,
      title: 'Markdown / Notion',
      desc: 'Clean GitHub-flavored markdown for Obsidian & Notion',
      color: 'from-cyan-500/20 to-cyan-500/5 text-cyan-300 border-cyan-500/30',
      btnColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30',
    },
  ];

  return (
    <div className="w-full space-y-2.5">
      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
        Select Export Format
      </span>

      {formats.map((f) => {
        const isCurrent = downloadingFormat === f.id;

        return (
          <div
            key={f.id}
            className={`w-full p-3.5 rounded-2xl bg-gradient-to-r ${f.color} border backdrop-blur-md flex items-center justify-between transition-all`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  {f.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                  {f.desc}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleExport(f.id)}
              disabled={!!downloadingFormat}
              className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all active:scale-95 ${f.btnColor}`}
            >
              {isCurrent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Exported</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
