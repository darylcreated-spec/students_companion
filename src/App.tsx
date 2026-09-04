import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfEmpty } from './db/database';
import { LectureDocument, AppSettings, DEFAULT_SETTINGS } from './types';
import { MobileContainer } from './components/layout/MobileContainer';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { ReaderMode } from './screens/ReaderMode';
import { TranscriberMode } from './screens/TranscriberMode';
import { ApiKeyModal } from './components/common/ApiKeyModal';
import { PwaInstallModal } from './components/common/PwaInstallModal';
import { LoadingScreen } from './components/common/LoadingScreen';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { usePwaInstall } from './hooks/usePwaInstall';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('reader');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  // PWA Install Hook for Mobile Browsers
  const { isInstallable, isInstalled, isIOS, isAndroid, isSecureContext, triggerInstall } = usePwaInstall();

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof localStorage !== 'undefined') {
      return {
        ...DEFAULT_SETTINGS,
        selectedLanguage: localStorage.getItem('SELECTED_LANGUAGE') || DEFAULT_SETTINGS.selectedLanguage,
        selectedVoiceURI: localStorage.getItem('SELECTED_VOICE_URI') || '',
        speechPitch: parseFloat(localStorage.getItem('SPEECH_PITCH') || '1.0'),
        speechRate: parseFloat(localStorage.getItem('SPEECH_RATE') || '1.0'),
        cloudVoiceName: localStorage.getItem('CLOUD_VOICE_NAME') || DEFAULT_SETTINGS.cloudVoiceName,
        googleCloudTtsKey: localStorage.getItem('GOOGLE_TTS_KEY') || '',
        geminiApiKey: localStorage.getItem('GEMINI_API_KEY') || '',
      };
    }
    return DEFAULT_SETTINGS;
  });

  // Initialize DB data
  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  // Live Query from IndexedDB
  const documents = useLiveQuery(() => db.documents.toArray(), []) || [];

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
    skip,
    setPlaybackRate,
    nextChapter,
    previousChapter,
    seekToTime,
    playSegment,
    playFromSentence,
    playHighlights,
    sleepTimerMode,
    sleepSecondsRemaining,
    setSleepTimer,
    savedBookmark,
    resumeFromBookmark,
  } = useAudioPlayer(activeDocument);

  // Handle Play toggle from document card
  const handlePlayToggle = (doc: LectureDocument) => {
    if (activeDocId !== doc.id) {
      setActiveDocId(doc.id);
      setTimeout(() => playSegment(0, 0), 100);
    } else {
      togglePlayPause();
    }
  };

  // Delete document
  const handleDeleteDocument = async (id: string) => {
    if (confirm('Delete this document?')) {
      await db.documents.delete(id);
      if (activeDocId === id) setActiveDocId(null);
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen onLoaded={() => setIsLoading(false)} />}
      <MobileContainer oledMode={!!settings.oledMode}>
      {/* Top Header with PWA Mobile Install Option & Settings */}
      <TopHeader
        title={
          activeTab === 'reader'
            ? (activeDocument ? activeDocument.title : "Reader")
            : "Transcriber"
        }
        subtitle={
          activeTab === 'reader' && activeDocument && currentSegment
            ? `Ch ${playerState.currentSegmentIndex + 1}: ${currentSegment.title}`
            : undefined
        }
        hasApiKey={!!settings.geminiApiKey}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInstall={() => setIsPwaModalOpen(true)}
        isInstalled={isInstalled}
      />

      {/* Mode Screens */}
      {activeTab === 'reader' && (
        <ReaderMode
          documents={documents}
          activeDocument={activeDocument}
          activeDocumentId={activeDocId}
          currentSegment={currentSegment}
          playerState={playerState}
          onTogglePlayPause={togglePlayPause}
          onSkipBackward={() => skip(-15)}
          onSkipForward={() => skip(15)}
          onPreviousChapter={previousChapter}
          onNextChapter={nextChapter}
          onRateChange={setPlaybackRate}
          onSeek={seekToTime}
          onSelectChapter={(idx) => playSegment(idx, 0)}
          onSentenceClick={playFromSentence}
          onSelectDocument={(doc) => {
            setActiveDocId(doc.id);
            setTimeout(() => playSegment(0, 0), 50);
          }}
          onPlayToggle={handlePlayToggle}
          onDocumentAdded={(doc, startChapterIndex = 0) => {
            setActiveDocId(doc.id);
            setTimeout(() => playSegment(startChapterIndex, 0), 250);
          }}
          onDeleteDocument={handleDeleteDocument}
          sleepTimerMode={sleepTimerMode}
          sleepSecondsRemaining={sleepSecondsRemaining}
          onSelectSleepTimer={setSleepTimer}
          savedBookmark={savedBookmark}
          onResumeBookmark={resumeFromBookmark}
          onPlayHighlights={playHighlights}
        />
      )}

      {activeTab === 'transcriber' && (
        <TranscriberMode />
      )}

      {/* 2-Tab Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Language & Voice Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onOpenInstall={() => setIsPwaModalOpen(true)}
        isInstalled={isInstalled}
      />

      {/* Mobile PWA Install Modal (iOS Safari & Android) */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isSecureContext={isSecureContext}
        onInstall={triggerInstall}
      />
      </MobileContainer>
    </>
  );
}
