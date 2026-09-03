import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfEmpty } from './db/database';
import { LectureDocument, AppSettings, DEFAULT_SETTINGS } from './types';
import { MobileContainer } from './components/layout/MobileContainer';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { CommuteAudioHub } from './screens/CommuteAudioHub';
import { LibraryIngestion } from './screens/LibraryIngestion';
import { CommuteNotebook } from './screens/CommuteNotebook';
import { ExportReview } from './screens/ExportReview';
import { ApiKeyModal } from './components/common/ApiKeyModal';
import { LoadingScreen } from './components/common/LoadingScreen';
import { FloatingMicButton } from './components/notebook/FloatingMicButton';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useVoiceDictation } from './hooks/useVoiceDictation';
import { GeminiService } from './services/ai/geminiService';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('audio');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isRewriting, setIsRewriting] = useState(false);

  // Initialize DB data
  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  // Live Query from IndexedDB (Offline Persistence)
  const documents = useLiveQuery(() => db.documents.toArray(), []) || [];
  const notes = useLiveQuery(() => db.notes.orderBy('createdAt').reverse().toArray(), []) || [];

  // Set default active document
  const activeDocument = documents.find((d) => d.id === activeDocId) || documents[0] || null;

  useEffect(() => {
    if (!activeDocId && documents.length > 0) {
      setActiveDocId(documents[0].id);
    }
  }, [documents, activeDocId]);

  // Audio Player Hook
  const {
    playerState,
    currentSegment,
    togglePlayPause,
    pause,
    resume,
    skip,
    setPlaybackRate,
    nextChapter,
    previousChapter,
    seekToTime,
    playSegment,
    playFromSentence,
  } = useAudioPlayer(activeDocument);

  // Voice Dictation Hook
  const {
    isRecording,
    isProcessing,
    transcript,
    setTranscript,
    audioLevel,
    capturedTimestamp,
    errorMessage,
    startDictation,
    finalizeDictation,
    cancelDictation,
  } = useVoiceDictation(
    activeDocument,
    playerState.currentTime,
    // On start dictation: pause lecture audio
    () => {
      pause();
    },
    // On finish dictation: auto resume lecture if enabled
    () => {
      if (settings.autoResumeAfterNote) {
        setTimeout(() => {
          resume();
        }, 500);
      }
    }
  );

  // Handle Play toggle from Library card
  const handlePlayToggleFromLibrary = (doc: LectureDocument) => {
    if (activeDocId !== doc.id) {
      setActiveDocId(doc.id);
      setTimeout(() => {
        playSegment(0, 0);
      }, 100);
    } else {
      togglePlayPause();
    }
  };

  // Delete lecture
  const handleDeleteDocument = async (id: string) => {
    if (confirm('Delete this lecture from offline cache?')) {
      await db.documents.delete(id);
      if (activeDocId === id) {
        setActiveDocId(null);
      }
    }
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    await db.notes.delete(id);
  };

  // Jump from note to exact lecture moment
  const handleJumpToAudio = (timestampSec: number) => {
    seekToTime(timestampSec);
    setActiveTab('audio');
    resume();
  };

  // Rewrite active chapter with Gemini AI Flash Audio Polish
  const handleRewriteWithGemini = async (segmentIndex: number) => {
    if (!activeDocument || !activeDocument.segments[segmentIndex]) return;

    const segment = activeDocument.segments[segmentIndex];
    setIsRewriting(true);

    try {
      const apiKey = settings.geminiApiKey || localStorage.getItem('GEMINI_API_KEY') || undefined;

      const enhancedScript = await GeminiService.rewriteForCommute(
        segment.originalContent,
        activeDocument.title,
        apiKey
      );

      // Update segment in IndexedDB
      const updatedSegments = [...activeDocument.segments];
      updatedSegments[segmentIndex] = {
        ...segment,
        synthesizedAudioText: enhancedScript,
      };

      const updatedDoc: LectureDocument = {
        ...activeDocument,
        segments: updatedSegments,
      };

      await db.documents.put(updatedDoc);
    } catch (err: any) {
      console.error('Audio polish failed:', err);
      alert(`Audio enhancement note: ${err.message || 'Check Gemini API Key in Settings'}`);
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen onLoaded={() => setIsLoading(false)} />}

      <MobileContainer>
        {/* Top HUD Header */}
        <TopHeader
          title={activeDocument ? activeDocument.title : "The Student's Companion"}
          subtitle={
            activeDocument && currentSegment
              ? `Ch ${playerState.currentSegmentIndex + 1}: ${currentSegment.title}`
              : undefined
          }
          hasApiKey={!!settings.geminiApiKey}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Screen Views */}
        {activeTab === 'audio' && (
          <CommuteAudioHub
            document={activeDocument}
            currentSegment={currentSegment}
            playerState={playerState}
            onTogglePlayPause={togglePlayPause}
            onSkipBackward={() => skip(-15)}
            onSkipForward={() => skip(15)}
            onPreviousChapter={previousChapter}
            onNextChapter={nextChapter}
            onRateChange={setPlaybackRate}
            onSeek={seekToTime}
            onDropNote={startDictation}
            onSwitchToLibrary={() => setActiveTab('library')}
            onRewriteWithGemini={handleRewriteWithGemini}
            onSelectChapter={(idx) => playSegment(idx, 0)}
            onSentenceClick={playFromSentence}
            isRewriting={isRewriting}
          />
        )}

        {activeTab === 'library' && (
          <LibraryIngestion
            documents={documents}
            activeDocumentId={activeDocId}
            isPlaying={playerState.isPlaying && !playerState.isPaused}
            onSelectDocument={(doc) => {
              setActiveDocId(doc.id);
              setActiveTab('audio');
            }}
            onPlayToggle={handlePlayToggleFromLibrary}
            onDocumentAdded={(doc, startChapterIndex = 0) => {
              setActiveDocId(doc.id);
              setActiveTab('audio');
              setTimeout(() => {
                playSegment(startChapterIndex, 0);
              }, 250);
            }}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {activeTab === 'notebook' && (
          <CommuteNotebook
            notes={notes}
            activeDocument={activeDocument}
            currentLectureTimeSec={playerState.currentTime}
            isRecording={isRecording}
            isProcessing={isProcessing}
            transcript={transcript}
            audioLevel={audioLevel}
            capturedTimestamp={capturedTimestamp}
            errorMessage={errorMessage}
            onStartDictation={startDictation}
            onFinalizeDictation={finalizeDictation}
            onCancelDictation={cancelDictation}
            onTranscriptChange={setTranscript}
            onJumpToAudio={handleJumpToAudio}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {activeTab === 'export' && (
          <ExportReview
            documents={documents}
            activeDocument={activeDocument}
            notes={notes}
            onSelectDocument={(doc) => setActiveDocId(doc.id)}
          />
        )}

        {/* Global Voice Dictation Floating Sheet (Visible when recording or on Notebook tab) */}
        {(isRecording || isProcessing || activeTab === 'notebook') && (
          <FloatingMicButton
            isRecording={isRecording}
            isProcessing={isProcessing}
            transcript={transcript}
            audioLevel={audioLevel}
            capturedTimestamp={capturedTimestamp}
            errorMessage={errorMessage}
            onStartDictation={startDictation}
            onFinalizeDictation={finalizeDictation}
            onCancelDictation={cancelDictation}
            onTranscriptChange={setTranscript}
          />
        )}

        {/* Tactile Commute 4-Tab Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Settings & API Key Modal */}
        <ApiKeyModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={setSettings}
        />
      </MobileContainer>
    </>
  );
}
