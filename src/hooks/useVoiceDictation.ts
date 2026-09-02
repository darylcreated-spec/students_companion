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

  const activeDocRef = useRef(activeDocument);
  activeDocRef.current = activeDocument;

  const lectureTimeRef = useRef(currentLectureTimeSec);
  lectureTimeRef.current = currentLectureTimeSec;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startDictation = useCallback(async () => {
    // 1. Mark timestamp at the moment user presses Drop Note
    const currentSecs = lectureTimeRef.current;
    setCapturedSeconds(currentSecs);
    setCapturedTimestamp(formatTime(currentSecs));
    setTranscript('');
    setIsRecording(true);

    // 2. Trigger audio pause callback
    onDictationStart?.();

    // 3. Start speech recognition & microphone visualizer
    await VoiceRecognitionService.startListening({
      onTranscriptChange: (currentText, isFinal) => {
        setTranscript(currentText);
        if (isFinal) {
          // Auto complete if silence was detected
          finalizeDictation(currentText);
        }
      },
      onAudioLevelChange: (lvl) => {
        setAudioLevel(lvl);
      },
      onStateChange: (state) => {
        if (state === 'idle' && isRecording) {
          // Stopped by browser
        }
      },
      onError: (err) => {
        console.warn('Dictation error:', err);
      }
    });
  }, [onDictationStart, isRecording]);

  const finalizeDictation = useCallback(async (manualText?: string) => {
    const textToProcess = manualText || transcript || VoiceRecognitionService.stopListening();
    VoiceRecognitionService.stopListening();
    setIsRecording(false);

    if (!textToProcess || textToProcess.trim().length === 0) {
      onDictationEnd?.();
      return;
    }

    setIsProcessing(true);

    try {
      const doc = activeDocRef.current;
      const context = doc ? `${doc.title}` : 'General Lecture';

      // 4. Synthesize with Gemini
      const { synthesizedText, category } = await GeminiService.synthesizeCommuteNote(
        textToProcess,
        context
      );

      // 5. Save to Dexie DB
      const newNote: CommuteNote = {
        id: `note-${Date.now()}`,
        documentId: doc?.id || 'general-commute',
        documentTitle: doc?.title || 'Commute Quick Capture',
        timestampSeconds: capturedSeconds,
        timestampFormatted: capturedTimestamp,
        rawTranscription: textToProcess,
        synthesizedContent: synthesizedText,
        category,
        createdAt: Date.now()
      };

      await db.notes.add(newNote);
    } catch (err) {
      console.error('Failed to save commute note:', err);
    } finally {
      setIsProcessing(false);
      setTranscript('');
      onDictationEnd?.();
    }
  }, [transcript, capturedSeconds, capturedTimestamp, onDictationEnd]);

  const cancelDictation = useCallback(() => {
    VoiceRecognitionService.stopListening();
    setIsRecording(false);
    setIsProcessing(false);
    setTranscript('');
    onDictationEnd?.();
  }, [onDictationEnd]);

  return {
    isRecording,
    isProcessing,
    transcript,
    audioLevel,
    capturedTimestamp,
    startDictation,
    finalizeDictation,
    cancelDictation,
    setTranscript
  };
}
