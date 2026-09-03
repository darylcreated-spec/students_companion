import { useState, useCallback, useRef } from 'react';
import { CommuteNote, LectureDocument } from '../types';
import { VoiceRecognitionService } from '../services/audio/speechRecognition';
import { GeminiService } from '../services/ai/geminiService';
import { db } from '../db/database';

export function useVoiceDictation(
  activeDocument: LectureDocument | null,
  currentLectureTimeSec: number,
  onDictationStart?: () => void,
  onDictationEnd?: () => void
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [capturedTimestamp, setCapturedTimestamp] = useState('00:00');
  const [capturedSeconds, setCapturedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeDocRef = useRef(activeDocument);
  activeDocRef.current = activeDocument;

  const lectureTimeRef = useRef(currentLectureTimeSec);
  lectureTimeRef.current = currentLectureTimeSec;

  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startDictation = useCallback(async () => {
    const currentSecs = lectureTimeRef.current;
    setCapturedSeconds(currentSecs);
    setCapturedTimestamp(formatTime(currentSecs));
    setTranscript('');
    setErrorMessage(null);
    setIsRecording(true);

    // Pause audio lecture playback
    onDictationStart?.();

    // Start speech recognition
    await VoiceRecognitionService.startListening({
      onTranscriptChange: (currentText) => {
        setTranscript(currentText);
      },
      onAudioLevelChange: (lvl) => {
        setAudioLevel(lvl);
      },
      onStateChange: (state) => {
        if (state === 'error') {
          // Keep recording overlay open so user can type or retry
        }
      },
      onError: (err) => {
        console.warn('Dictation warning:', err);
        setErrorMessage(err);
      },
    });
  }, [onDictationStart]);

  const finalizeDictation = useCallback(
    async (manualText?: string) => {
      const recorded = VoiceRecognitionService.stopListening();
      const textToProcess = (manualText ?? (transcriptRef.current || recorded)).trim();

      setIsRecording(false);
      setErrorMessage(null);

      if (!textToProcess) {
        onDictationEnd?.();
        return;
      }

      setIsProcessing(true);

      try {
        const doc = activeDocRef.current;
        const context = doc ? `${doc.title}` : 'General Lecture';

        // 1. Synthesize and categorize note
        const { synthesizedText, category } = await GeminiService.synthesizeCommuteNote(
          textToProcess,
          context
        );

        // 2. Save to Dexie IndexedDB
        const newNote: CommuteNote = {
          id: `note-${Date.now()}`,
          documentId: doc?.id || 'general-commute',
          documentTitle: doc?.title || 'Commute Quick Capture',
          timestampSeconds: capturedSeconds,
          timestampFormatted: capturedTimestamp,
          rawTranscription: textToProcess,
          synthesizedContent: synthesizedText,
          category,
          createdAt: Date.now(),
        };

        await db.notes.add(newNote);
      } catch (err) {
        console.error('Failed to save commute note:', err);
      } finally {
        setIsProcessing(false);
        setTranscript('');
        onDictationEnd?.();
      }
    },
    [capturedSeconds, capturedTimestamp, onDictationEnd]
  );

  const cancelDictation = useCallback(() => {
    VoiceRecognitionService.stopListening();
    setIsRecording(false);
    setIsProcessing(false);
    setTranscript('');
    setErrorMessage(null);
    onDictationEnd?.();
  }, [onDictationEnd]);

  return {
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
  };
}
