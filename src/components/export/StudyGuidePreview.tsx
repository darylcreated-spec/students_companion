import React from 'react';
import { LectureDocument, CommuteNote } from '../../types';
import { BookOpen, AlertTriangle, CheckSquare } from 'lucide-react';

interface StudyGuidePreviewProps {
  document: LectureDocument | null;
  notes: CommuteNote[];
}

export const StudyGuidePreview: React.FC<StudyGuidePreviewProps> = ({
  document,
  notes,
}) => {
  if (!document) {
    return (
      <div className="w-full p-8 rounded-3xl bg-[#0E1426]/60 border border-white/10 text-center flex flex-col items-center justify-center space-y-2">
        <BookOpen className="w-8 h-8 text-slate-500" />
        <p className="text-xs text-slate-400 font-mono">
          No lecture selected for export preview.
        </p>
      </div>
    );
  }

  const docNotes = notes.filter(n => n.documentId === document.id);
  const examNotes = docNotes.filter(n => n.category === 'exam');
  const actionNotes = docNotes.filter(n => n.category === 'action');

  return (
    <div className="w-full rounded-3xl bg-[#0E1426]/80 border border-cyan-400/20 shadow-xl p-5 flex flex-col space-y-4 max-h-[380px] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-white/10 pb-3">
        <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
          Compiled Study Guide
        </span>
        <h3 className="text-base font-bold text-slate-100 mt-0.5">
          {document.title}
        </h3>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          {document.segments.length} Chapters • {docNotes.length} Commute Voice Notes
        </p>
      </div>

      {/* Chapters Preview */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono text-slate-300 uppercase tracking-wider font-bold">
          Chapters & Key Concepts
        </h4>
        {document.segments.map((seg, idx) => (
          <div key={seg.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
            <h5 className="text-xs font-bold text-cyan-300">
              {seg.title}
            </h5>
            {seg.keyPoints && seg.keyPoints.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {seg.keyPoints.map((kp, kidx) => (
                  <li key={kidx} className="text-[11px] text-slate-300 flex items-start space-x-1.5">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Exam Alerts */}
      {examNotes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <h4 className="text-xs font-mono text-rose-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Exam Flags
          </h4>
          {examNotes.map(n => (
            <div key={n.id} className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
              <span className="font-mono text-[10px] text-rose-400 font-bold">[{n.timestampFormatted}] </span>
              {n.synthesizedContent}
            </div>
          ))}
        </div>
      )}

      {/* Action Items */}
      {actionNotes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> Action Checklist
          </h4>
          {actionNotes.map(n => (
            <div key={n.id} className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-2">
              <input type="checkbox" className="mt-0.5 accent-amber-400 rounded" />
              <span>
                <span className="font-mono text-[10px] text-amber-400 font-bold">[{n.timestampFormatted}] </span>
                {n.synthesizedContent}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
