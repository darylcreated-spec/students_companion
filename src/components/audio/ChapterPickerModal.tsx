import React from 'react';
import { X, Play, Clock, BookOpen, Check } from 'lucide-react';
import { LectureDocument, LectureSegment } from '../../types';

interface ChapterPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: LectureDocument | null;
  currentChapterIndex: number;
  onSelectChapter: (chapterIndex: number) => void;
}

export const ChapterPickerModal: React.FC<ChapterPickerModalProps> = ({
  isOpen,
  onClose,
  document,
  currentChapterIndex,
  onSelectChapter,
}) => {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1426] border border-cyan-400/40 shadow-2xl p-5 flex flex-col space-y-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Choose Start Point</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {document.segments.length} Chapters • Select where to begin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto overscroll-contain space-y-2.5 pr-1">
          {document.segments.map((seg, idx) => {
            const isCurrent = idx === currentChapterIndex;
            const durationMin = Math.max(1, Math.round(seg.estimatedSeconds / 60));

            return (
              <div
                key={seg.id}
                onClick={() => {
                  onSelectChapter(idx);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between space-x-3 group ${
                  isCurrent
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        isCurrent ? 'text-cyan-300' : 'text-slate-400'
                      }`}
                    >
                      CH {idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ~{durationMin} min
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 mt-1 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {seg.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 font-sora mt-1 line-clamp-2">
                    {seg.synthesizedAudioText || seg.originalContent}
                  </p>
                </div>

                <div className="pt-1 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isCurrent
                        ? 'bg-cyan-400 text-obsidian-950'
                        : 'bg-slate-800 text-slate-300 group-hover:bg-cyan-400 group-hover:text-obsidian-950'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
