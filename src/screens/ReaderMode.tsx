import React, { useState } from 'react';
import { LectureDocument, LectureSegment, PlaybackRate, AudioPlayerState } from '../types';
import { LiveReadingWindow } from '../components/audio/LiveReadingWindow';
import { PlayerControls } from '../components/audio/PlayerControls';
import { ChapterScrubber } from '../components/audio/ChapterScrubber';
import { ChapterPickerModal } from '../components/audio/ChapterPickerModal';
import { UniversalIngestionPortal } from '../components/library/UniversalIngestionPortal';
import { LectureCard } from '../components/library/LectureCard';
import { Upload, BookOpen, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';

interface ReaderModeProps {
  documents: LectureDocument[];
  activeDocument: LectureDocument | null;
  activeDocumentId: string | null;
  currentSegment: LectureSegment | null;
  playerState: AudioPlayerState;
  onTogglePlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onRateChange: (rate: PlaybackRate) => void;
  onSeek: (timeSec: number) => void;
  onSelectChapter: (chapterIndex: number) => void;
  onSentenceClick: (sentenceIndex: number, totalSentences: number) => void;
  onSelectDocument: (doc: LectureDocument) => void;
  onPlayToggle: (doc: LectureDocument) => void;
  onDocumentAdded: (doc: LectureDocument, startChapterIndex?: number) => void;
  onDeleteDocument: (id: string) => void;
}

export const ReaderMode: React.FC<ReaderModeProps> = ({
  documents,
  activeDocument,
  activeDocumentId,
  currentSegment,
  playerState,
  onTogglePlayPause,
  onSkipBackward,
  onSkipForward,
  onPreviousChapter,
  onNextChapter,
  onRateChange,
  onSeek,
  onSelectChapter,
  onSentenceClick,
  onSelectDocument,
  onPlayToggle,
  onDocumentAdded,
  onDeleteDocument,
}) => {
  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // No document loaded — show full-screen import
  if (!activeDocument) {
    return (
      <div className="flex-1 flex flex-col p-4 pb-4 space-y-3 overflow-y-auto overscroll-contain">
        <div className="flex items-center space-x-2 pb-1">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Import a Document to Read
          </span>
        </div>

        <UniversalIngestionPortal onDocumentAdded={onDocumentAdded} />

        {documents.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saved Documents</span>
            </h3>
            {documents.map((doc) => (
              <LectureCard
                key={doc.id}
                document={doc}
                isActive={activeDocumentId === doc.id}
                isPlaying={false}
                onSelect={() => onSelectDocument(doc)}
                onPlayToggle={(e) => { e.stopPropagation(); onPlayToggle(doc); }}
                onDelete={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const progress = playerState.duration > 0 ? playerState.currentTime / playerState.duration : 0;
  const totalChapters = activeDocument.segments.length;
  const currentChapterNum = playerState.currentSegmentIndex + 1;

  const activeReadingText =
    currentSegment?.synthesizedAudioText ||
    currentSegment?.originalContent ||
    'Preparing reading text...';

  return (
    <div className="flex-1 flex flex-col p-3 pb-2 overflow-hidden">
      {/* Compact Import Toggle & Document Title Strip */}
      <div className="flex items-center justify-between pb-2 shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-100 tracking-tight truncate">
            {activeDocument.title}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            Ch {currentChapterNum}/{totalChapters} • {currentSegment?.title || 'Loading...'}
          </p>
        </div>

        <button
          onClick={() => setIsImportOpen(!isImportOpen)}
          className="ml-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-cyan-400/30 hover:border-cyan-400 text-[10px] font-mono text-cyan-300 transition-colors flex items-center gap-1 shrink-0"
        >
          <Upload className="w-3 h-3" />
          {isImportOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible Import Section */}
      {isImportOpen && (
        <div className="mb-2 shrink-0 max-h-[35vh] overflow-y-auto rounded-2xl border border-white/5 bg-[#0E1426]/60 p-3 space-y-2">
          <UniversalIngestionPortal onDocumentAdded={(doc, idx) => { setIsImportOpen(false); onDocumentAdded(doc, idx); }} />
          {documents.length > 1 && (
            <div className="space-y-1.5 pt-1">
              {documents.map((doc) => (
                <LectureCard
                  key={doc.id}
                  document={doc}
                  isActive={activeDocumentId === doc.id}
                  isPlaying={playerState.isPlaying && !playerState.isPaused && activeDocumentId === doc.id}
                  onSelect={() => { onSelectDocument(doc); setIsImportOpen(false); }}
                  onPlayToggle={(e) => { e.stopPropagation(); onPlayToggle(doc); }}
                  onDelete={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Large Proportional Content Reading Window — fills available space */}
      <div className="flex-1 min-h-0 flex flex-col">
        <LiveReadingWindow
          title={currentSegment?.title || activeDocument.title}
          content={activeReadingText}
          isPlaying={playerState.isPlaying}
          isPaused={playerState.isPaused}
          progress={progress}
          currentTime={playerState.currentTime}
          duration={playerState.duration}
          onSentenceClick={onSentenceClick}
          onOpenChapterPicker={() => setIsChapterPickerOpen(true)}
          fillHeight
        />
      </div>

      {/* Chapter Scrubber */}
      <div className="py-1 shrink-0">
        <ChapterScrubber
          currentTime={playerState.currentTime}
          duration={playerState.duration}
          chapterNumber={currentChapterNum}
          totalChapters={totalChapters}
          chapterTitle={currentSegment?.title || ''}
          onSeek={onSeek}
        />
      </div>

      {/* Compact Playback Controls */}
      <div className="shrink-0">
        <PlayerControls
          isPlaying={playerState.isPlaying}
          isPaused={playerState.isPaused}
          playbackRate={playerState.playbackRate}
          onTogglePlayPause={onTogglePlayPause}
          onSkipBackward={onSkipBackward}
          onSkipForward={onSkipForward}
          onPreviousChapter={onPreviousChapter}
          onNextChapter={onNextChapter}
          onRateChange={onRateChange}
        />
      </div>

      {/* Chapter Picker Modal */}
      <ChapterPickerModal
        isOpen={isChapterPickerOpen}
        onClose={() => setIsChapterPickerOpen(false)}
        document={activeDocument}
        currentChapterIndex={playerState.currentSegmentIndex}
        onSelectChapter={onSelectChapter}
      />
    </div>
  );
};
