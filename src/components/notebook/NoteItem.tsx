import React from 'react';
import { Play, Trash2, AlertTriangle, CheckSquare, Lightbulb } from 'lucide-react';
import { CommuteNote } from '../../types';

interface NoteItemProps {
  note: CommuteNote;
  onJumpToAudio: (timestampSec: number) => void;
  onDelete: (id: string) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  onJumpToAudio,
  onDelete,
}) => {
  const getCategoryConfig = () => {
    switch (note.category) {
      case 'exam':
        return {
          label: 'EXAM FLAG',
          icon: AlertTriangle,
          borderColor: 'border-rose-500/30',
          bgColor: 'bg-rose-950/20',
          textColor: 'text-rose-400',
          glow: 'shadow-[0_0_15px_rgba(244,63,94,0.1)]',
        };
      case 'action':
        return {
          label: 'ACTION ITEM',
          icon: CheckSquare,
          borderColor: 'border-amber-500/30',
          bgColor: 'bg-amber-950/20',
          textColor: 'text-amber-400',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
        };
      case 'concept':
      default:
        return {
          label: 'KEY CONCEPT',
          icon: Lightbulb,
          borderColor: 'border-cyan-500/30',
          bgColor: 'bg-cyan-950/20',
          textColor: 'text-cyan-400',
          glow: 'shadow-[0_0_15px_rgba(34,211,238,0.1)]',
        };
    }
  };

  const config = getCategoryConfig();
  const Icon = config.icon;

  return (
    <div
      className={`w-full p-4 rounded-2xl border ${config.borderColor} ${config.bgColor} ${config.glow} backdrop-blur-md flex flex-col space-y-2.5 transition-all`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Category Label (Clean colored text and icon, no badge pill) */}
          <div className={`text-xs font-mono font-bold flex items-center space-x-1.5 ${config.textColor}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{config.label}</span>
          </div>

          {/* Timestamp Bookmark Button */}
          <button
            onClick={() => onJumpToAudio(note.timestampSeconds)}
            title="Jump to this moment in lecture audio"
            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-[11px] font-mono font-bold text-slate-300 hover:text-cyan-300 flex items-center space-x-1 transition-colors group"
          >
            <Play className="w-2.5 h-2.5 fill-current text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>{note.timestampFormatted}</span>
          </button>
        </div>

        {/* Delete note */}
        <button
          onClick={() => onDelete(note.id)}
          className="w-6 h-6 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 flex items-center justify-center transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Synthesized Note Body */}
      <p className="text-sm font-medium text-slate-100 leading-snug tracking-tight">
        {note.synthesizedContent}
      </p>

      {/* Raw Spoken Audio Thought Quote */}
      {note.rawTranscription && (
        <div className="pt-1 border-t border-white/5">
          <p className="text-[11px] text-slate-400 font-mono italic">
            🎙️ "{note.rawTranscription}"
          </p>
        </div>
      )}

      {/* Linked Document Context */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="truncate max-w-[200px]">{note.documentTitle}</span>
        <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};
