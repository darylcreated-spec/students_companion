import React from 'react';
import { Play, Pause, Trash2, Clock, Layers, FileText, Presentation } from 'lucide-react';
import { LectureDocument } from '../../types';

interface LectureCardProps {
  document: LectureDocument;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlayToggle: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const LectureCard: React.FC<LectureCardProps> = ({
  document,
  isActive,
  isPlaying,
  onSelect,
  onPlayToggle,
  onDelete,
}) => {
  const getIcon = () => {
    switch (document.type) {
      case 'pptx':
        return <Presentation className="w-4 h-4 text-rose-400" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />;
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`w-full p-4 rounded-2xl transition-all cursor-pointer relative group flex flex-col space-y-3 ${
        isActive
          ? 'bg-cyan-950/40 border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
          : 'bg-[#0E1426]/70 hover:bg-[#0E1426] border border-white/10 hover:border-slate-600'
      }`}
    >
      {/* Top Row: Format & Action Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-white/5">
            {getIcon()}
          </div>
          <span className="text-[11px] font-mono text-slate-300 font-medium uppercase">
            {document.type.toUpperCase()} • {document.totalPagesOrSlides || document.segments.length} Sections
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Delete action */}
          <button
            onClick={onDelete}
            title="Delete lecture"
            className="w-7 h-7 rounded-lg bg-slate-900/60 hover:bg-red-950/60 hover:text-red-400 border border-transparent hover:border-red-500/30 flex items-center justify-center text-slate-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Quick Play Trigger */}
          <button
            onClick={onPlayToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isActive && isPlaying
                ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_12px_rgba(34,211,238,0.8)]'
                : 'bg-slate-800 hover:bg-cyan-400 hover:text-obsidian-950 text-cyan-400 border border-cyan-400/30'
            }`}
          >
            {isActive && isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Lecture Title */}
      <div>
        <h4 className="text-sm font-bold text-slate-100 tracking-tight line-clamp-1 group-hover:text-cyan-300 transition-colors">
          {document.title}
        </h4>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
          {document.originalName}
        </p>
      </div>

      {/* Meta Text: Duration & Chapters (No badge dots) */}
      <div className="flex items-center space-x-3 pt-1 border-t border-white/5 text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-1 text-amber-300">
          <Clock className="w-3 h-3" />
          <span>~{document.durationMinutes} min</span>
        </div>
        <div className="flex items-center space-x-1">
          <Layers className="w-3 h-3 text-slate-500" />
          <span>{document.segments.length} chapters</span>
        </div>
      </div>
    </div>
  );
};
