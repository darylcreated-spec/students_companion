import { useState, useEffect, useRef, useCallback } from 'react';
import { LectureDocument, LectureSegment, PlaybackRate, AudioPlayerState } from '../types';
import { TTSEngine } from '../services/audio/ttsEngine';
import { MediaSessionService } from '../services/audio/mediaSession';

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
  ttsEngineType: 'browser'
};

export function useAudioPlayer(activeDocument: LectureDocument | null) {
  const [playerState, setPlayerState] = useState<AudioPlayerState>(DEFAULT_PLAYER_STATE);
  const timerRef = useRef<any>(null);
  const activeDocRef = useRef<LectureDocument | null>(activeDocument);
  const currentSegmentIndexRef = useRef(0);
  const playbackRateRef = useRef<PlaybackRate>(1.0);
  const currentTimeRef = useRef(0);

  // Sync refs with latest state
  useEffect(() => {
    activeDocRef.current = activeDocument;
  }, [activeDocument]);

  useEffect(() => {
    currentSegmentIndexRef.current = playerState.currentSegmentIndex;
    playbackRateRef.current = playerState.playbackRate;
    currentTimeRef.current = playerState.currentTime;
  }, [playerState.currentSegmentIndex, playerState.playbackRate, playerState.currentTime]);

  // Start progress timer during playback
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setPlayerState(prev => {
        if (!prev.isPlaying || prev.isPaused) return prev;
        const newTime = prev.currentTime + 1;
        if (newTime >= prev.duration) {
          return { ...prev, currentTime: prev.duration };
        }
        return { ...prev, currentTime: newTime };
      });
    }, 1000 / playbackRateRef.current);
  }, []);

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
  }, [activeDocument, playerState.currentSegmentIndex]);

  // Play a specific segment
  const playSegment = useCallback(async (segmentIndex: number, startOffsetSec: number = 0) => {
    const doc = activeDocRef.current;
    if (!doc || !doc.segments[segmentIndex]) return;

    const segment = doc.segments[segmentIndex];
    stopTimer();

    setPlayerState(prev => ({
      ...prev,
      currentDocumentId: doc.id,
      currentSegmentId: segment.id,
      currentSegmentIndex: segmentIndex,
      isPlaying: true,
      isPaused: false,
      currentTime: startOffsetSec,
      duration: segment.estimatedSeconds,
      isBuffering: false
    }));

    MediaSessionService.setPlaybackState('playing');

    // Check if narrative text is ready
    let speechText = segment.synthesizedAudioText;
    if (!speechText || speechText.length < 10) {
      speechText = segment.originalContent;
    }

    TTSEngine.speak(
      speechText,
      playbackRateRef.current,
      {
        onStart: () => {
          startTimer();
          setPlayerState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
        },
        onEnd: () => {
          stopTimer();
          MediaSessionService.setPlaybackState('paused');
          // Auto advance to next chapter
          const nextIdx = currentSegmentIndexRef.current + 1;
          if (doc.segments[nextIdx]) {
            playSegment(nextIdx, 0);
          } else {
            setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: false, currentTime: prev.duration }));
          }
        },
        onPause: () => {
          stopTimer();
          setPlayerState(prev => ({ ...prev, isPaused: true }));
          MediaSessionService.setPlaybackState('paused');
        },
        onResume: () => {
          startTimer();
          setPlayerState(prev => ({ ...prev, isPaused: false, isPlaying: true }));
          MediaSessionService.setPlaybackState('playing');
        },
        onError: (err) => {
          console.warn('TTS Playback error:', err);
          stopTimer();
          setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
        }
      }
    );
  }, [startTimer, stopTimer]);

  // Play from a specific sentence within current chapter
  const playFromSentence = useCallback((sentenceIndex: number, totalSentences: number) => {
    const doc = activeDocRef.current;
    const segIdx = currentSegmentIndexRef.current;
    if (!doc || !doc.segments[segIdx]) return;

    const segment = doc.segments[segIdx];
    const fullText = segment.synthesizedAudioText || segment.originalContent;
    const sentences = fullText.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
    const remainingText = sentences.slice(sentenceIndex).join(' ');

    const estimatedOffset = Math.round((sentenceIndex / (totalSentences || 1)) * segment.estimatedSeconds);

    stopTimer();
    setPlayerState(prev => ({
      ...prev,
      currentTime: estimatedOffset,
      isPlaying: true,
      isPaused: false
    }));

    MediaSessionService.setPlaybackState('playing');

    TTSEngine.speak(
      remainingText,
      playbackRateRef.current,
      {
        onStart: () => {
          startTimer();
          setPlayerState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
        },
        onEnd: () => {
          stopTimer();
          MediaSessionService.setPlaybackState('paused');
          const nextIdx = currentSegmentIndexRef.current + 1;
          if (doc.segments[nextIdx]) {
            playSegment(nextIdx, 0);
          } else {
            setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: false, currentTime: prev.duration }));
          }
        },
        onPause: () => {
          stopTimer();
          setPlayerState(prev => ({ ...prev, isPaused: true }));
          MediaSessionService.setPlaybackState('paused');
        },
        onResume: () => {
          startTimer();
          setPlayerState(prev => ({ ...prev, isPaused: false, isPlaying: true }));
          MediaSessionService.setPlaybackState('playing');
        },
        onError: (err) => {
          console.warn('TTS Playback error:', err);
          stopTimer();
          setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
        }
      }
    );
  }, [startTimer, stopTimer, playSegment]);

  const togglePlayPause = useCallback(() => {
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
    setPlayerState(prev => ({ ...prev, isPaused: true }));
    MediaSessionService.setPlaybackState('paused');
  }, [stopTimer]);

  const resume = useCallback(() => {
    TTSEngine.resume();
    startTimer();
    setPlayerState(prev => ({ ...prev, isPaused: false, isPlaying: true }));
    MediaSessionService.setPlaybackState('playing');
  }, [startTimer]);

  const skip = useCallback((seconds: number) => {
    setPlayerState(prev => {
      const nextTime = Math.max(0, Math.min(prev.duration, prev.currentTime + seconds));
      return { ...prev, currentTime: nextTime };
    });
  }, []);

  const setPlaybackRate = useCallback((rate: PlaybackRate) => {
    setPlayerState(prev => ({ ...prev, playbackRate: rate }));
    TTSEngine.setRate(rate);
  }, []);

  const nextChapter = useCallback(() => {
    const doc = activeDocRef.current;
    if (!doc) return;
    const nextIdx = playerState.currentSegmentIndex + 1;
    if (doc.segments[nextIdx]) {
      playSegment(nextIdx, 0);
    }
  }, [playerState.currentSegmentIndex, playSegment]);

  const previousChapter = useCallback(() => {
    const prevIdx = playerState.currentSegmentIndex - 1;
    if (prevIdx >= 0) {
      playSegment(prevIdx, 0);
    } else {
      playSegment(0, 0);
    }
  }, [playerState.currentSegmentIndex, playSegment]);

  const seekToTime = useCallback((timeSec: number) => {
    setPlayerState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(prev.duration, timeSec)) }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      TTSEngine.stop();
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
  };
}
