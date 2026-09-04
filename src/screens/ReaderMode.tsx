import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import {
  LectureDocument,
  LectureSegment,
  PlaybackRate,
  AudioPlayerState,
  SleepTimerMode,
  CommuteBookmark,
  TextHighlight,
  HighlightColor,
  WordDefinition,
} from '../types';
import { LiveReadingWindow } from '../components/audio/LiveReadingWindow';
import { PlayerControls } from '../components/audio/PlayerControls';
import { ChapterScrubber } from '../components/audio/ChapterScrubber';
import { ChapterPickerModal } from '../components/audio/ChapterPickerModal';
import { UniversalIngestionPortal } from '../components/library/UniversalIngestionPortal';
import { LectureCard } from '../components/library/LectureCard';
import { WordDefinitionModal } from '../components/reader/WordDefinitionModal';
import { DictionaryService } from '../services/education/dictionaryService';
import { TTSEngine } from '../services/audio/ttsEngine';
import { HapticFeedback } from '../services/device/deviceDetector';
import {
  Upload,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Play,
  HelpCircle,
  RotateCcw,
  Volume2,
  Highlighter,
} from 'lucide-react';

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
  onSentenceClick: (sentenceIndex: number, totalSentences: number, sentenceText: string) => void;
  onSelectDocument: (doc: LectureDocument) => void;
  onPlayToggle: (doc: LectureDocument) => void;
  onDocumentAdded: (doc: LectureDocument, startChapterIndex?: number) => void;
  onDeleteDocument: (id: string) => void;
  // Upgrade Props
  sleepTimerMode?: SleepTimerMode;
  sleepSecondsRemaining?: number | null;
  onSelectSleepTimer?: (mode: SleepTimerMode) => void;
  savedBookmark?: CommuteBookmark | null;
  onResumeBookmark?: () => void;
  onPlayHighlights?: (highlights: TextHighlight[]) => void;
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
  sleepTimerMode = 'off',
  sleepSecondsRemaining = null,
  onSelectSleepTimer,
  savedBookmark = null,
  onResumeBookmark,
  onPlayHighlights,
}) => {
  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [isQuizRevealed, setIsQuizRevealed] = useState(false);
  const [quizCountdown, setQuizCountdown] = useState<number | null>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Live query of highlights for active document
  const highlights = useLiveQuery(
    () => (activeDocumentId ? db.highlights.where('documentId').equals(activeDocumentId).toArray() : []),
    [activeDocumentId]
  ) || [];

  const chapterHighlights = highlights.filter(
    (h) => h.chapterIndex === playerState.currentSegmentIndex
  );

  // Dictionary state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDefinition, setWordDefinition] = useState<WordDefinition | null>(null);
  const [isWordLoading, setIsWordLoading] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);
  const [isDefinitionModalOpen, setIsDefinitionModalOpen] = useState(false);

  const handleToggleHighlight = async (
    sentenceIndex: number,
    sentenceText: string,
    color: HighlightColor
  ) => {
    if (!activeDocumentId) return;
    const existing = highlights.find(
      (h) =>
        h.chapterIndex === playerState.currentSegmentIndex &&
        h.sentenceIndex === sentenceIndex
    );

    if (existing) {
      if (existing.color === color) {
        await db.highlights.delete(existing.id);
        HapticFeedback.trigger('light');
      } else {
        await db.highlights.update(existing.id, { color });
        HapticFeedback.trigger('success');
      }
    } else {
      const newHighlight: TextHighlight = {
        id: 'hl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        documentId: activeDocumentId,
        chapterIndex: playerState.currentSegmentIndex,
        sentenceIndex,
        text: sentenceText,
        color,
        createdAt: Date.now(),
      };
      await db.highlights.add(newHighlight);
      HapticFeedback.trigger('success');
    }
  };

  const handleLookupWord = async (rawWord: string) => {
    const clean = DictionaryService.cleanWord(rawWord);
    if (!clean) return;
    setSelectedWord(clean);
    setIsDefinitionModalOpen(true);
    setIsWordLoading(true);
    setWordError(null);
    try {
      const def = await DictionaryService.lookupWord(clean);
      setWordDefinition(def);
    } catch (err: any) {
      setWordError(err.message || 'Could not find definition.');
    } finally {
      setIsWordLoading(false);
    }
  };

  const handlePlayJourneyHighlights = () => {
    HapticFeedback.trigger('medium');
    if (highlights.length === 0) {
      alert(
        'No journey highlights yet! Tap any sentence in E-Book mode to highlight key takeaways for your commute.'
      );
      return;
    }
    onPlayHighlights?.(highlights);
  };


  // Generate commute active-recall questions from chapter content
  const quizItems = React.useMemo(() => {
    if (!currentSegment) return [];

    const items: { question: string; answer: string }[] = [];

    // Use segment keypoints if present
    if (currentSegment.keyPoints && currentSegment.keyPoints.length > 0) {
      currentSegment.keyPoints.forEach((kp, i) => {
        const parts = kp.split(/:\s*|—\s*|-\s*/);
        if (parts.length >= 2) {
          items.push({
            question: `What is the core takeaway regarding ${parts[0].trim()}?`,
            answer: parts.slice(1).join(' ').trim(),
          });
        } else {
          items.push({
            question: `Key Concept #${i + 1}: What is the significance of this topic?`,
            answer: kp.trim(),
          });
        }
      });
    }

    // Fallback: extract concept sentences
    if (items.length === 0) {
      const text = currentSegment.synthesizedAudioText || currentSegment.originalContent;
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      sentences.slice(0, 4).forEach((s, idx) => {
        items.push({
          question: `Active Recall Question #${idx + 1} from ${currentSegment.title}:`,
          answer: s.trim(),
        });
      });
    }

    return items;
  }, [currentSegment]);

  // Handle playing audio quiz with anticipation countdown
  const handlePlayAudioQuiz = (index: number) => {
    const item = quizItems[index];
    if (!item) return;

    HapticFeedback.trigger('medium');
    setIsQuizRevealed(false);
    setQuizCountdown(4);

    // Speak question first
    TTSEngine.speak(item.question, 1.0, {
      onEnd: () => {
        // Start 4-second anticipation countdown
        let count = 4;
        const interval = setInterval(() => {
          count -= 1;
          setQuizCountdown(count);
          HapticFeedback.trigger('light');

          if (count <= 0) {
            clearInterval(interval);
            setQuizCountdown(null);
            setIsQuizRevealed(true);
            HapticFeedback.trigger('success');

            // Speak answer
            TTSEngine.speak(`Answer: ${item.answer}`, 1.0);
          }
        }, 1000);
      },
    });
  };

  // Reset quiz state on chapter change
  useEffect(() => {
    setCurrentQuizIndex(0);
    setIsQuizRevealed(false);
    setQuizCountdown(null);
  }, [playerState.currentSegmentIndex]);

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
                onPlayToggle={(e) => {
                  e.stopPropagation();
                  onPlayToggle(doc);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteDocument(doc.id);
                }}
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
    <div className="flex-1 flex flex-col p-3 pb-2 overflow-hidden select-none sm:select-auto">
      {/* Consolidated Top Action Bar (Deduplicated with TopHeader) */}
      {!isFocusMode && (
        <div className="flex items-center justify-between gap-2 pb-2 shrink-0">
          {/* Document Switcher or Chapter Pill */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar min-w-0">
            {documents.length > 1 ? (
              documents.map((doc) => {
                const isSelected = activeDocumentId === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-cyan-400 text-obsidian-950 font-bold shadow-[0_0_8px_rgba(34,211,238,0.35)]'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{doc.title}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-[11px] text-cyan-400 font-mono px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-400/20 truncate">
                Ch {currentChapterNum}/{totalChapters} • {currentSegment?.title || activeDocument.title}
              </span>
            )}
          </div>

          {/* Action Buttons: Highlights, Audio Quiz, Add File */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Journey Highlights Audio Playback Button */}
            <button
              id="journey-highlights-btn"
              onClick={handlePlayJourneyHighlights}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all active:scale-95 ${
                highlights.length > 0
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)] hover:bg-amber-400/30 font-medium'
                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-amber-300'
              }`}
              title="Listen to your highlighted points for your commute journey"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-400" />
              <span>Highlights ({highlights.length})</span>
            </button>

            {/* Mode Switcher: Read vs Audio Quiz */}
            <button
              id="audio-quiz-btn"
              onClick={() => {
                HapticFeedback.trigger('light');
                setIsQuizMode(!isQuizMode);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all active:scale-95 ${
                isQuizMode
                  ? 'bg-amber-400 text-obsidian-950 font-bold border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                  : 'bg-slate-900 border-white/5 text-slate-300 hover:text-cyan-300'
              }`}
              title="Toggle Commute Audio Quiz Mode"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isQuizMode ? 'Exit Quiz' : 'Audio Quiz'}</span>
            </button>

            <button
              onClick={() => setIsImportOpen(!isImportOpen)}
              aria-label="Add or Import Document"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950 border border-cyan-400/40 hover:border-cyan-400 text-[11px] font-mono text-cyan-300 transition-all flex items-center gap-1.5 shadow-[0_0_8px_rgba(34,211,238,0.2)] active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isImportOpen ? 'Close' : '+ Add File'}</span>
              {isImportOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {/* Resume Commute Top Banner */}
      {!isFocusMode && savedBookmark && !playerState.isPlaying && onResumeBookmark && (
        <div className="mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-[#0E1426] to-cyan-950/70 border border-cyan-400/50 flex items-center justify-between shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-in fade-in shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-cyan-400 text-obsidian-950 flex items-center justify-center font-bold shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.6)]">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Resume Commute</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 font-mono">
                  Ch {savedBookmark.chapterIndex + 1}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {savedBookmark.chapterTitle} • {Math.floor(savedBookmark.currentTime / 60)}:
                {(savedBookmark.currentTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
          <button
            onClick={onResumeBookmark}
            className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-obsidian-950 text-xs font-bold font-mono transition-all active:scale-95 shadow-[0_0_10px_rgba(34,211,238,0.4)] shrink-0"
          >
            Resume
          </button>
        </div>
      )}

      {/* Collapsible Import Section */}
      {isImportOpen && (
        <div className="mb-2 shrink-0 max-h-[52vh] overflow-y-auto rounded-2xl border border-white/5 bg-[#0E1426]/60 p-3 space-y-2">
          <UniversalIngestionPortal
            onDocumentAdded={(doc, idx) => {
              setIsImportOpen(false);
              onDocumentAdded(doc, idx);
            }}
          />
          {documents.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[11px] font-mono text-slate-400 font-medium uppercase">
                  Library ({documents.length} {documents.length === 1 ? 'Document' : 'Documents'})
                </span>
                <span className="text-[10px] font-mono text-slate-500">Tap trash icon to delete</span>
              </div>
              {documents.map((doc) => (
                <LectureCard
                  key={doc.id}
                  document={doc}
                  isActive={activeDocumentId === doc.id}
                  isPlaying={playerState.isPlaying && !playerState.isPaused && activeDocumentId === doc.id}
                  onSelect={() => {
                    onSelectDocument(doc);
                    setIsImportOpen(false);
                  }}
                  onPlayToggle={(e) => {
                    e.stopPropagation();
                    onPlayToggle(doc);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDeleteDocument(doc.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Large Proportional Content Window: Live Reading OR Commute Audio Quiz */}
      <div className="flex-1 min-h-0 flex flex-col">
        {!isQuizMode ? (
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
            highlights={chapterHighlights}
            onToggleHighlight={handleToggleHighlight}
            onOpenDictionary={handleLookupWord}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          />
        ) : (
          /* Active Recall Audio Quiz Deck */
          <div className="flex-1 min-h-0 flex flex-col rounded-3xl bg-[#0E1426]/95 border border-amber-400/40 shadow-2xl p-4 overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-400 text-obsidian-950 font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Audio Flashcards • Active Recall
                  </h3>
                  <p className="text-[10px] text-amber-300 font-mono">
                    Question {currentQuizIndex + 1} of {Math.max(1, quizItems.length)}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                Commute Quiz
              </span>
            </div>

            {/* Quiz Content Area */}
            <div className="flex-1 min-h-0 flex flex-col justify-center items-center text-center p-4 space-y-4 overflow-y-auto">
              {quizItems.length > 0 ? (
                <>
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 w-full shadow-lg">
                    <p className="text-sm font-semibold text-slate-100 font-sora leading-relaxed">
                      {quizItems[currentQuizIndex]?.question}
                    </p>
                  </div>

                  {/* Anticipation Countdown or Revealed Answer */}
                  {quizCountdown !== null ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-14 h-14 rounded-full bg-amber-400 text-obsidian-950 font-extrabold text-xl flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                        {quizCountdown}s
                      </div>
                      <p className="text-xs text-amber-300 font-mono animate-pulse">
                        Recall the answer out loud...
                      </p>
                    </div>
                  ) : isQuizRevealed ? (
                    <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-400/50 w-full animate-in fade-in slide-in-from-bottom-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                        CORRECT ANSWER
                      </span>
                      <p className="text-xs text-slate-100 leading-relaxed font-sora">
                        {quizItems[currentQuizIndex]?.answer}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono">
                      Tap &quot;Play Audio Quiz&quot; to speak question with 4-second recall pause.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 font-mono">
                  No flashcards found for this chapter. Switch chapters below.
                </p>
              )}
            </div>

            {/* Quiz Actions Footer */}
            <div className="flex items-center space-x-2 pt-2 border-t border-white/5 shrink-0">
              <button
                disabled={currentQuizIndex <= 0}
                onClick={() => {
                  HapticFeedback.trigger('light');
                  setCurrentQuizIndex((i) => Math.max(0, i - 1));
                  setIsQuizRevealed(false);
                  setQuizCountdown(null);
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 disabled:opacity-40"
              >
                Prev
              </button>

              <button
                onClick={() => handlePlayAudioQuiz(currentQuizIndex)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(251,191,36,0.4)] active:scale-95 transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span>Play Audio Quiz</span>
              </button>

              <button
                disabled={currentQuizIndex >= quizItems.length - 1}
                onClick={() => {
                  HapticFeedback.trigger('light');
                  setCurrentQuizIndex((i) => Math.min(quizItems.length - 1, i + 1));
                  setIsQuizRevealed(false);
                  setQuizCountdown(null);
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Scrubber (Visible in full player mode, or when mini-player is expanded) */}
      {!isMiniPlayer && (
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
      )}

      {/* Playback Controls with Mini-Player & Full Deck Modes */}
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
          sleepTimerMode={sleepTimerMode}
          sleepSecondsRemaining={sleepSecondsRemaining}
          onSelectSleepTimer={onSelectSleepTimer}
          isMini={isMiniPlayer}
          onToggleMini={() => setIsMiniPlayer(!isMiniPlayer)}
          chapterTitle={currentSegment?.title || activeDocument.title}
          chapterNumber={currentChapterNum}
          totalChapters={totalChapters}
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

      {/* Word & Context Definition Modal */}
      {isDefinitionModalOpen && (
        <WordDefinitionModal
          definition={wordDefinition}
          isLoading={isWordLoading}
          error={wordError}
          onClose={() => {
            setIsDefinitionModalOpen(false);
            setWordDefinition(null);
            setWordError(null);
          }}
          onStartReading={() => {
            if (activeDocument && wordDefinition) {
              // Find sentence containing the word if possible
              const segText = currentSegment?.synthesizedAudioText || currentSegment?.originalContent || '';
              const sentences = segText.split(/(?<=[.?!])\s+/);
              const foundIdx = sentences.findIndex(s => s.toLowerCase().includes(wordDefinition.word.toLowerCase()));
              if (foundIdx !== -1) {
                onSentenceClick(foundIdx, sentences.length, sentences[foundIdx]);
              } else {
                onSentenceClick(0, sentences.length || 1, sentences[0] || '');
              }
            }
          }}
          onHighlightWord={async (color) => {
            if (wordDefinition && activeDocumentId) {
              await db.highlights.add({
                id: 'hl-def-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                documentId: activeDocumentId,
                chapterIndex: playerState.currentSegmentIndex,
                text: `${wordDefinition.word} (${wordDefinition.partOfSpeech || 'vocab'}): ${wordDefinition.definition}`,
                color,
                createdAt: Date.now(),
              });
              HapticFeedback.trigger('success');
            }
          }}
        />
      )}
    </div>
  );
};
