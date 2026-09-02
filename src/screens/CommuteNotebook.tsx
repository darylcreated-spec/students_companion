import React, { useState } from 'react';
import { CommuteNote, LectureDocument, NoteCategory } from '../types';
import { CategoryFilters, FilterCategory } from '../components/notebook/CategoryFilters';
import { NoteItem } from '../components/notebook/NoteItem';
import { FloatingMicButton } from '../components/notebook/FloatingMicButton';
import { BookmarkCheck, Plus, Sparkles, Mic, Volume2 } from 'lucide-react';
import { db } from '../db/database';

interface CommuteNotebookProps {
  notes: CommuteNote[];
  activeDocument: LectureDocument | null;
  currentLectureTimeSec: number;
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  audioLevel: number;
  capturedTimestamp: string;
  onStartDictation: () => void;
  onFinalizeDictation: () => void;
  onCancelDictation: () => void;
  onJumpToAudio: (timestampSec: number) => void;
  onDeleteNote: (id: string) => void;
}

export const CommuteNotebook: React.FC<CommuteNotebookProps> = ({
  notes,
  activeDocument,
  currentLectureTimeSec,
  isRecording,
  isProcessing,
  transcript,
  audioLevel,
  capturedTimestamp,
  onStartDictation,
  onFinalizeDictation,
  onCancelDictation,
  onJumpToAudio,
  onDeleteNote,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [manualNoteText, setManualNoteText] = useState('');
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedFilter === 'all') return true;
    return n.category === selectedFilter;
  });

  const counts = {
    all: notes.length,
    action: notes.filter((n) => n.category === 'action').length,
    concept: notes.filter((n) => n.category === 'concept').length,
    exam: notes.filter((n) => n.category === 'exam').length,
  };

  const handleAddManualNote = async () => {
    if (!manualNoteText.trim()) return;

    const newNote: CommuteNote = {
      id: `note-${Date.now()}`,
      documentId: activeDocument?.id || 'general-commute',
      documentTitle: activeDocument?.title || 'Commute Quick Capture',
      timestampSeconds: currentLectureTimeSec,
      timestampFormatted: `${Math.floor(currentLectureTimeSec / 60)
        .toString()
        .padStart(2, '0')}:${Math.floor(currentLectureTimeSec % 60)
        .toString()
        .padStart(2, '0')}`,
      rawTranscription: manualNoteText.trim(),
      synthesizedContent: manualNoteText.trim(),
      category: 'concept',
      createdAt: Date.now(),
    };

    await db.notes.add(newNote);
    setManualNoteText('');
    setIsManualInputOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3.5 overflow-y-auto overscroll-contain relative pb-28">
      {/* Top Header Card */}
      <div className="p-3.5 rounded-2xl bg-[#0E1426]/80 border border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>Real-Time Commute Notebook</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
            {activeDocument ? activeDocument.title : 'General Study Notes'}
          </p>
        </div>

        <button
          onClick={() => setIsManualInputOpen(!isManualInputOpen)}
          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 flex items-center space-x-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Type Note</span>
        </button>
      </div>

      {/* Manual Note Input Dropdown */}
      {isManualInputOpen && (
        <div className="p-3 rounded-2xl bg-slate-900/95 border border-cyan-400/40 shadow-xl flex flex-col space-y-2 animate-in slide-in-from-top-2">
          <textarea
            rows={2}
            placeholder="Type quick thought or question..."
            value={manualNoteText}
            onChange={(e) => setManualNoteText(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sora resize-none"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsManualInputOpen(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleAddManualNote}
              className="px-4 py-1 rounded-lg bg-cyan-400 text-obsidian-950 text-xs font-bold font-mono"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <CategoryFilters
        selected={selectedFilter}
        onSelect={setSelectedFilter}
        counts={counts}
      />

      {/* Note Stream */}
      {filteredNotes.length === 0 ? (
        <div className="flex-1 min-h-[220px] rounded-3xl bg-[#0E1426]/40 border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">
            No notes in this category yet
          </h4>
          <p className="text-xs text-slate-500 max-w-[240px]">
            Tap the floating mic or the "Drop Note" button during playback to capture voice thoughts hands-free.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onJumpToAudio={onJumpToAudio}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      )}

      {/* Floating Action Mic Button with Commute Dictation Overlay */}
      <FloatingMicButton
        isRecording={isRecording}
        isProcessing={isProcessing}
        transcript={transcript}
        audioLevel={audioLevel}
        capturedTimestamp={capturedTimestamp}
        onStartDictation={onStartDictation}
        onFinalizeDictation={onFinalizeDictation}
        onCancelDictation={onCancelDictation}
      />
    </div>
  );
};
