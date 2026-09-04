import { useState, useEffect, useRef, useCallback } from 'react';
import { LectureDocument, LectureSegment, PlaybackRate, AudioPlayerState, SleepTimerMode, CommuteBookmark } from '../types';
import { TTSEngine } from '../services/audio/ttsEngine';
import { MediaSessionService } from '../services/audio/mediaSession';
import { BackgroundAudioKeepAlive } from '../services/audio/backgroundAudioKeepAlive';
import { HapticFeedback } from '../services/device/deviceDetector';

const DEFAULT_PLAYER_STATE: AudioPlayerState = {
  currentDocumentId: null,
  currentSegmentId: null,
  currentSegmentIndex: 0,
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 240, // 4 mins default
  playbackRate: 1.0,
  isBuffering: false,
  isSynthesizingSpeech: false,
  ttsEngineType: 'browser',
};

export function useAudioPlayer(activeDocument: LectureDocument | null) {
  const [playerState, setPlayerState] = useState<AudioPlayerState>(DEFAULT_PLAYER_STATE);
  const [sleepTimerMode, setSleepTimerMode] = useState<SleepTimerMode>('off');
  const [sleepSecondsRemaining, setSleepSecondsRemaining] = useState<number | null>(null);
  const [savedBookmark, setSavedBookmark] = useState<CommuteBookmark | null>(null);

  const timerRef = useRef<any>(null);
  const sleepTimerRef = useRef<any>(null);
  const activeDocRef = useRef<LectureDocument | null>(activeDocument);
  const currentSegmentIndexRef = useRef(0);
  const playbackRateRef = useRef<PlaybackRate>(1.0);
  const currentTimeRef = useRef(0);
  const sleepModeRef = useRef<SleepTimerMode>('off');
  const sleepSecRef = useRef<number | null>(null);

  // Sync refs with latest state
  useEffect(() => {
    activeDocRef.current = activeDocument;
    if (activeDocument) {
      // Check for saved bookmark for this document
      try {
        const raw = localStorage.getItem(`STUDENT_COMPANION_BOOKMARK_${activeDocument.id}`);
        if (raw) {
          const parsed: CommuteBookmark = JSON.parse(raw);
          if (parsed && (parsed.chapterIndex > 0 || parsed.currentTime > 5)) {
            setSavedBookmark(parsed);
          } else {
            setSavedBookmark(null);
          }
        } else {
          setSavedBookmark(null);
        }
      } catch (_) {
        setSavedBookmark(null);
      }
    }
  }, [activeDocument]);

  useEffect(() => {
    currentSegmentIndexRef.current = playerState.currentSegmentIndex;
    playbackRateRef.current = playerState.playbackRate;
    currentTimeRef.current = playerState.currentTime;
    sleepModeRef.current = sleepTimerMode;
    sleepSecRef.current = sleepSecondsRemaining;
  }, [playerState.currentSegmentIndex, playerState.playbackRate, playerState.currentTime, sleepTimerMode, sleepSecondsRemaining]);

  // Persist commute bookmark on change
  const saveBookmark = useCallback((docId: string, segmentIdx: number, timeSec: number) => {
    const doc = activeDocRef.current;
    if (!doc || doc.id !== docId) return;

    const seg = doc.segments[segmentIdx];
    if (!seg) return;

    const bookmark: CommuteBookmark = {
      documentId: doc.id,
      documentTitle: doc.title,
      chapterIndex: segmentIdx,
      chapterTitle: seg.title,
      currentTime: Math.round(timeSec),
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(`STUDENT_COMPANION_BOOKMARK_${doc.id}`, JSON.stringify(bookmark));
      localStorage.setItem('STUDENT_COMPANION_ACTIVE_BOOKMARK', JSON.stringify(bookmark));
    } catch (_) {}
  }, []);

  // Sleep timer tick handling
  useEffect(() => {
    if (sleepTimerMode === 'off') {
      setSleepSecondsRemaining(null);
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      return;
    }

    if (sleepTimerMode === '15m') setSleepSecondsRemaining(15 * 60);
    else if (sleepTimerMode === '30m') setSleepSecondsRemaining(30 * 60);
    else if (sleepTimerMode === '45m') setSleepSecondsRemaining(45 * 60);
    else if (sleepTimerMode === 'chapter') {
      const remaining = Math.max(10, playerState.duration - playerState.currentTime);
      setSleepSecondsRemaining(remaining);
    }

    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);

    sleepTimerRef.current = setInterval(() => {
      if (!playerState.isPlaying || playerState.isPaused) return;

      setSleepSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Timer expired: stop audio smoothly
          pause();
          setSleepTimerMode('off');
          HapticFeedback.trigger('warning');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimerMode, playerState.isPlaying, playerState.isPaused, playerState.duration, playerState.currentTime]);

  // Start progress timer during playback
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setPlayerState((prev) => {
        if (!prev.isPlaying || prev.isPaused) return prev;
        const newTime = prev.currentTime + 1;
        const safeTime = newTime >= prev.duration ? prev.duration : newTime;

        // Save bookmark every 5 seconds
        if (safeTime % 5 === 0 && prev.currentDocumentId) {
          saveBookmark(prev.currentDocumentId, prev.currentSegmentIndex, safeTime);
        }

        // Report position to MediaSession
        MediaSessionService.setPositionState({
          duration: prev.duration,
          playbackRate: prev.playbackRate,
          position: safeTime,
        });

        return { ...prev, currentTime: safeTime };
      });
    }, 1000 / playbackRateRef.current);
  }, [saveBookmark]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Update Media Session controls
  useEffect(() => {
    if (!activeDocument) return;

    const segment = activeDocument.segments[playerState.currentSegmentIndex];
    if (!segment) return;

    MediaSessionService.updateMetadata({
      title: segment.title,
      album: activeDocument.title,
      artist: "Student's Companion",
      onPlay: () => resume(),
      onPause: () => pause(),
      onSeekBackward: () => skip(-15),
      onSeekForward: () => skip(15),
      onPreviousTrack: () => previousChapter(),
      onNextTrack: () => nextChapter(),
    });

    MediaSessionService.setPositionState({
      duration: segment.estimatedSeconds,
      playbackRate: playerState.playbackRate,
      position: playerState.currentTime,
    });
  }, [activeDocument, playerState.currentSegmentIndex]);

  // Play a specific segment
  const playSegment = useCallback(
    async (segmentIndex: number, startOffsetSec: number = 0) => {
      const doc = activeDocRef.current;
      if (!doc || !doc.segments[segmentIndex]) return;

      const segment = doc.segments[segmentIndex];
      stopTimer();

      setPlayerState((prev) => ({
        ...prev,
        currentDocumentId: doc.id,
        currentSegmentId: segment.id,
        currentSegmentIndex: segmentIndex,
        isPlaying: true,
        isPaused: false,
        currentTime: startOffsetSec,
        duration: segment.estimatedSeconds,
        isBuffering: false,
      }));

      MediaSessionService.setPlaybackState('playing');
      BackgroundAudioKeepAlive.start();

      // Check if narrative text is ready
      let speechText = segment.synthesizedAudioText;
      if (!speechText || speechText.length < 10) {
        speechText = segment.originalContent;
      }

      TTSEngine.speak(speechText, playbackRateRef.current, {
        onStart: () => {
          startTimer();
          setPlayerState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
          BackgroundAudioKeepAlive.start();
        },
        onEnd: () => {
          stopTimer();
          MediaSessionService.setPlaybackState('paused');

          // Check if sleep timer was set to "chapter"
          if (sleepModeRef.current === 'chapter') {
            setPlayerState((prev) => ({ ...prev, isPlaying: false, isPaused: false, currentTime: prev.duration }));
            setSleepTimerMode('off');
            BackgroundAudioKeepAlive.stop();
            HapticFeedback.trigger('warning');
            return;
          }

          // Auto advance to next chapter
          const nextIdx = currentSegmentIndexRef.current + 1;
          if (doc.segments[nextIdx]) {
            playSegment(nextIdx, 0);
          } else {
            setPlayerState((prev) => ({ ...prev, isPlaying: false, isPaused: false, currentTime: prev.duration }));
            BackgroundAudioKeepAlive.stop();
          }
        },
        onPause: () => {
          stopTimer();
          setPlayerState((prev) => ({ ...prev, isPaused: true }));
          MediaSessionService.setPlaybackState('paused');
          BackgroundAudioKeepAlive.stop();
        },
        onResume: () => {
          startTimer();
          setPlayerState((prev) => ({ ...prev, isPaused: false, isPlaying: true }));
          MediaSessionService.setPlaybackState('playing');
          BackgroundAudioKeepAlive.start();
        },
        onError: (err) => {
          console.warn('TTS Playback error:', err);
          stopTimer();
          setPlayerState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
          BackgroundAudioKeepAlive.stop();
        },
      });

      // Persist active bookmark
      saveBookmark(doc.id, segmentIndex, startOffsetSec);
    },
    [startTimer, stopTimer, saveBookmark]
  );

  // Play starting directly from a selected sentence
  const playFromSentence = useCallback(
    (sentenceIndex: number, totalSentences: number, sentenceText: string) => {
      const doc = activeDocRef.current;
      if (!doc) return;

      const seg = doc.segments[currentSegmentIndexRef.current];
      if (!seg) return;

      stopTimer();
      TTSEngine.stop();

      const proportionalOffset = Math.round((sentenceIndex / Math.max(1, totalSentences)) * seg.estimatedSeconds);

      setPlayerState((prev) => ({
        ...prev,
        currentTime: proportionalOffset,
        isPlaying: true,
        isPaused: false,
      }));

      MediaSessionService.setPlaybackState('playing');
      BackgroundAudioKeepAlive.start();
      HapticFeedback.trigger('light');

      const fullText = seg.synthesizedAudioText || seg.originalContent;
      const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
      const allSentences = fullText.match(sentenceRegex) || [fullText];
      const remainingSentences = allSentences.slice(sentenceIndex);
      const remainingSpeechText = remainingSentences.join(' ').trim() || sentenceText;

      TTSEngine.speak(remainingSpeechText, playbackRateRef.current, {
        onStart: () => {
          startTimer();
          setPlayerState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
          BackgroundAudioKeepAlive.start();
        },
        onEnd: () => {
          stopTimer();
          MediaSessionService.setPlaybackState('paused');

          if (sleepModeRef.current === 'chapter') {
            setPlayerState((prev) => ({ ...prev, isPlaying: false, isPaused: false, currentTime: prev.duration }));
            setSleepTimerMode('off');
            BackgroundAudioKeepAlive.stop();
            return;
          }

          const nextIdx = currentSegmentIndexRef.current + 1;
          if (doc.segments[nextIdx]) {
            playSegment(nextIdx, 0);
          } else {
            setPlayerState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
            BackgroundAudioKeepAlive.stop();
          }
        },
        onPause: () => {
          stopTimer();
          setPlayerState((prev) => ({ ...prev, isPaused: true }));
          MediaSessionService.setPlaybackState('paused');
          BackgroundAudioKeepAlive.stop();
        },
        onResume: () => {
          startTimer();
          setPlayerState((prev) => ({ ...prev, isPaused: false, isPlaying: true }));
          MediaSessionService.setPlaybackState('playing');
          BackgroundAudioKeepAlive.start();
        },
        onError: (err) => {
          console.warn('TTS Playback error:', err);
          stopTimer();
          setPlayerState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
          BackgroundAudioKeepAlive.stop();
        },
      });

      saveBookmark(doc.id, currentSegmentIndexRef.current, proportionalOffset);
    },
    [startTimer, stopTimer, playSegment, saveBookmark]
  );

  const togglePlayPause = useCallback(() => {
    HapticFeedback.trigger('medium');
    if (playerState.isPlaying && !playerState.isPaused) {
      pause();
    } else if (playerState.isPaused) {
      resume();
    } else {
      playSegment(playerState.currentSegmentIndex, playerState.currentTime);
    }
  }, [playerState.isPlaying, playerState.isPaused, playerState.currentSegmentIndex, playerState.currentTime, playSegment]);

  const pause = useCallback(() => {
    TTSEngine.pause();
    stopTimer();
    setPlayerState((prev) => ({ ...prev, isPaused: true }));
    MediaSessionService.setPlaybackState('paused');
    BackgroundAudioKeepAlive.stop();

    if (activeDocRef.current) {
      saveBookmark(activeDocRef.current.id, currentSegmentIndexRef.current, currentTimeRef.current);
    }
  }, [stopTimer, saveBookmark]);

  const resume = useCallback(() => {
    TTSEngine.resume();
    startTimer();
    setPlayerState((prev) => ({ ...prev, isPaused: false, isPlaying: true }));
    MediaSessionService.setPlaybackState('playing');
    BackgroundAudioKeepAlive.start();
  }, [startTimer]);

  const skip = useCallback(
    (seconds: number) => {
      HapticFeedback.trigger('light');
      setPlayerState((prev) => {
        const nextTime = Math.max(0, Math.min(prev.duration, prev.currentTime + seconds));
        return { ...prev, currentTime: nextTime };
      });
    },
    []
  );

  const setPlaybackRate = useCallback((rate: PlaybackRate) => {
    HapticFeedback.trigger('light');
    setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
    TTSEngine.setRate(rate);
  }, []);

  const nextChapter = useCallback(() => {
    HapticFeedback.trigger('medium');
    const doc = activeDocRef.current;
    if (!doc) return;
    const nextIdx = playerState.currentSegmentIndex + 1;
    if (doc.segments[nextIdx]) {
      playSegment(nextIdx, 0);
    }
  }, [playerState.currentSegmentIndex, playSegment]);

  const previousChapter = useCallback(() => {
    HapticFeedback.trigger('medium');
    const prevIdx = playerState.currentSegmentIndex - 1;
    if (prevIdx >= 0) {
      playSegment(prevIdx, 0);
    } else {
      playSegment(0, 0);
    }
  }, [playerState.currentSegmentIndex, playSegment]);

  const seekToTime = useCallback((timeSec: number) => {
    setPlayerState((prev) => ({ ...prev, currentTime: Math.max(0, Math.min(prev.duration, timeSec)) }));
  }, []);

  // Resume playback from saved commute bookmark
  const resumeFromBookmark = useCallback(
    (bookmarkToUse?: CommuteBookmark) => {
      const b = bookmarkToUse || savedBookmark;
      if (!b) return;

      HapticFeedback.trigger('success');
      playSegment(b.chapterIndex, b.currentTime);
      setSavedBookmark(null);
    },
    [savedBookmark, playSegment]
  );

  // Set Sleep Timer
  const setSleepTimer = useCallback((mode: SleepTimerMode) => {
    HapticFeedback.trigger('light');
    setSleepTimerMode(mode);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      TTSEngine.stop();
      BackgroundAudioKeepAlive.stop();
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [stopTimer]);

  return {
    playerState,
    currentSegment: activeDocument?.segments[playerState.currentSegmentIndex] || null,
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
    // Upgrades
    sleepTimerMode,
    sleepSecondsRemaining,
    setSleepTimer,
    savedBookmark,
    resumeFromBookmark,
  };
}
