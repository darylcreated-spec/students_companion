import { useState, useEffect, useCallback, useRef } from 'react';
import { LectureDocument, LectureSegment, PlaybackRate, AudioPlayerState } from '../types';
import { TTSEngine } from '../services/audio/ttsEngine';
import { MediaSessionService } from '../services/audio/mediaSession';
import { GeminiService } from '../services/ai/geminiService';

export function useAudioPlayer(activeDocument: LectureDocument | null) {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentDocumentId: activeDocument?.id || null,
    currentSegmentId: activeDocument?.segments[0]?.id || null,
    currentSegmentIndex: 0,
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: activeDocument?.segments[0]?.estimatedSeconds || 240,
    playbackRate: 1.0,
    isBuffering: false,
    isSynthesizingSpeech: false,
    ttsEngineType: 'browser'
  });

  const timerRef = useRef<any>(null);
  const activeDocRef = useRef<LectureDocument | null>(activeDocument);
  activeDocRef.current = activeDocument;

  const currentSegmentIndexRef = useRef(0);
  currentSegmentIndexRef.current = playerState.currentSegmentIndex;

  const playbackRateRef = useRef<PlaybackRate>(1.0);
  playbackRateRef.current = playerState.playbackRate;

  // Clear progress timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start progress timer
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setPlayerState(prev => {
        if (!prev.isPlaying || prev.isPaused) return prev;
        const nextTime = prev.currentTime + 1 * prev.playbackRate;
        if (nextTime >= prev.duration) {
          return prev; // Will trigger onEnd from TTS
        }
        return { ...prev, currentTime: nextTime };
      });
    }, 1000);
  }, [stopTimer]);

  // Update MediaSession on change
  useEffect(() => {
    if (!activeDocument) return;
    const currentSeg = activeDocument.segments[playerState.currentSegmentIndex];
    if (!currentSeg) return;

    MediaSessionService.updateMetadata({
      title: currentSeg.title,
      artist: "Student's Companion",
      album: activeDocument.title,
      onPlay: () => resume(),
      onPause: () => pause(),
      onSeekBackward: () => skip(-15),
      onSeekForward: () => skip(15),
      onPreviousTrack: () => previousChapter(),
      onNextTrack: () => nextChapter()
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
      // Restart current chapter
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
    playSegment
  };
}
