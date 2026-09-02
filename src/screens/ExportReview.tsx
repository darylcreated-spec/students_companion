import React, { useState } from 'react';
import { LectureDocument, CommuteNote } from '../types';
import { StudyGuidePreview } from '../components/export/StudyGuidePreview';
import { ExportFormatCards } from '../components/export/ExportFormatCards';
import { FileDown, Sparkles, CheckCircle2, Sliders, BookOpen } from 'lucide-react';

interface ExportReviewProps {
  documents: LectureDocument[];
  activeDocument: LectureDocument | null;
  notes: CommuteNote[];
  onSelectDocument: (doc: LectureDocument) => void;
}

export const ExportReview: React.FC<ExportReviewProps> = ({
  documents,
  activeDocument,
  notes,
  onSelectDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'formats'>('formats');

  const docNotes = notes.filter(n => activeDocument ? n.documentId === activeDocument.id : true);
  const examNotesCount = docNotes.filter(n => n.category === 'exam').length;
  const actionNotesCount = docNotes.filter(n => n.category === 'action').length;

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto pb-10">
      {/* Top Header Card */}
      <div className="p-3.5 rounded-2xl bg-[#0E1426]/80 border border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
            <FileDown className="w-4 h-4 text-cyan-400" />
            <span>Export & Study Guide</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {docNotes.length} Notes Compiled • {examNotesCount} Exam Flags
          </p>
        </div>

        {/* Document Selector Dropdown if multiple */}
        {documents.length > 1 && (
          <select
            value={activeDocument?.id || ''}
            onChange={(e) => {
              const selected = documents.find(d => d.id === e.target.value);
              if (selected) onSelectDocument(selected);
            }}
            className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none"
          >
            {documents.map(d => (
              <option key={d.id} value={d.id}>
                {d.title.slice(0, 20)}...
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs: Export Downloads vs Live Preview */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-white/5">
        <button
          onClick={() => setActiveTab('formats')}
          className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'formats'
              ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Export Packages
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'preview'
              ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Preview
        </button>
      </div>

      {activeTab === 'formats' ? (
        <div className="space-y-4">
          {/* Export Format Cards */}
          <ExportFormatCards
            document={activeDocument}
            notes={notes}
          />

          {/* Study Guide Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Study Guide Includes
            </h4>
            <div className="space-y-1 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Executive Summary & 3-5 min Chapter Overviews</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lecture Timestamp Audio Bookmarks</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI-Categorized Exam Flags & Action Items</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <StudyGuidePreview
          document={activeDocument}
          notes={notes}
        />
      )}
    </div>
  );
};
