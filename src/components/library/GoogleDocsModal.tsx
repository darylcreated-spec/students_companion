import React, { useState } from 'react';
import { X, Cloud, Link2, Check, ArrowRight, Loader2 } from 'lucide-react';
import { db } from '../../db/database';
import { LectureDocument } from '../../types';

interface GoogleDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAdded: (doc: LectureDocument) => void;
}

export const GoogleDocsModal: React.FC<GoogleDocsModalProps> = ({
  isOpen,
  onClose,
  onDocumentAdded,
}) => {
  const [docUrl, setDocUrl] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!docTitle.trim() || !docContent.trim()) {
      alert('Please enter a document title and some lecture content.');
      return;
    }

    setIsImporting(true);

    try {
      // Create chapters from paragraphs
      const paragraphs = docContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const words = docContent.split(/\s+/).filter(Boolean).length;
      const durationMin = Math.max(1, Math.round(words / 140));

      const segments = paragraphs.map((p, idx) => ({
        id: `seg-gdoc-${Date.now()}-${idx}`,
        chapterIndex: idx,
        title: `Section ${idx + 1}: ${p.slice(0, 40)}...`,
        originalContent: p,
        synthesizedAudioText: `Section ${idx + 1}. ${p}`,
        estimatedSeconds: Math.max(45, Math.round((p.split(/\s+/).length / 140) * 60)),
        keyPoints: [p.slice(0, 100)]
      }));

      const newDoc: LectureDocument = {
        id: `gdoc-${Date.now()}`,
        title: docTitle.trim(),
        type: 'gdoc',
        originalName: `${docTitle.trim()}.gdoc`,
        fileSize: docContent.length,
        totalPagesOrSlides: segments.length,
        uploadedAt: Date.now(),
        durationMinutes: durationMin,
        rawText: docContent,
        status: 'ready',
        segments
      };

      await db.documents.add(newDoc);
      onDocumentAdded(newDoc);
      onClose();
    } catch (e: any) {
      alert(`Error importing doc: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1426] border border-cyan-400/30 shadow-2xl p-5 flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Cloud className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">Sync Google Docs</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Paste your Google Doc text, shared notes, or lecture outline below for instant commute conversion.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              DOCUMENT TITLE
            </label>
            <input
              type="text"
              placeholder="e.g., Biology 101 - Cell Respiration"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sora"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              DOCUMENT / SLIDE CONTENT
            </label>
            <textarea
              rows={4}
              placeholder="Paste Google Doc text or lecture transcript here..."
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sora resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-obsidian-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:brightness-110 active:scale-98 transition-all"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Convert to Commute Audio</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
