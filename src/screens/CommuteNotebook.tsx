import React, { useState } from 'react';
import { CommuteNote, LectureDocument } from '../types';
import { CategoryFilters, FilterCategory } from '../components/notebook/CategoryFilters';
import { NoteItem } from '../components/notebook/NoteItem';
import { FloatingMicButton } from '../components/notebook/FloatingMicButton';
import { BookmarkCheck, Edit3, Save, X, Mic } from 'lucide-react';
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
  errorMessage?: string | null;
  onStartDictation: () => void;
  onFinalizeDictation: () => void;
  onCancelDictation: () => void;
  onTranscriptChange?: (text: string) => void;
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
  errorMessage,
  onStartDictation,
  onFinalizeDictation,
  onCancelDictation,
  onTranscriptChange,
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

    const mins = Math.floor(currentLectureTimeSec / 60);
    const secs = Math.floor(currentLectureTimeSec % 60);
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const newNote: CommuteNote = {
      id: `note-${Date.now()}`,
      documentId: activeDocument?.id || 'general-commute',
      documentTitle: activeDocument?.title || 'Quick Study Note',
      timestampSeconds: currentLectureTimeSec,
      timestampFormatted: timeFormatted,
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
    <div className="flex-1 flex flex-col p-4 pb-16 space-y-4 overflow-y-auto overscroll-contain relative">
      {/* Top Status & Add Button */}
      <div className="p-3.5 rounded-2xl bg-[#0E1426]/70 border border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookmarkCheck className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">
            {notes.length} Captured Study Thoughts
          </span>
        </div>

        <button
          onClick={() => setIsManualInputOpen(!isManualInputOpen)}
          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-400/40 text-[11px] font-mono text-amber-300 hover:border-amber-400 transition-colors flex items-center gap-1.5"
        >
          <Edit3 className="w-3 h-3 text-amber-400" />
          <span>Type Note</span>
        </button>
      </div>

      {/* Manual Note Editor Input Drawer */}
      {isManualInputOpen && (
        <div className="p-3.5 rounded-2xl bg-[#0E1426] border border-amber-400/40 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400">
            <span>QUICK TYPE STUDY NOTE</span>
            <button
              onClick={() => setIsManualInputOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            rows={3}
            placeholder="Type your study note, thought, or exam question..."
            value={manualNoteText}
            onChange={(e) => setManualNoteText(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-sora focus:outline-none focus:border-amber-400 resize-none"
          />
          <button
            onClick={handleAddManualNote}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Study Note</span>
          </button>
        </div>
      )}

      {/* Category Filter Chips */}
      <CategoryFilters
        selected={selectedFilter}
        onSelect={setSelectedFilter}
        counts={counts}
      />

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-950/40 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Mic className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">
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
        errorMessage={errorMessage}
        onStartDictation={onStartDictation}
        onFinalizeDictation={onFinalizeDictation}
        onCancelDictation={onCancelDictation}
        onTranscriptChange={onTranscriptChange}
      />
    </div>
  );
};
