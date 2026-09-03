import React, { useState, useEffect } from 'react';
import { Mic, Check, X, Loader2, Cpu, AlertCircle, Edit3 } from 'lucide-react';
import { WaveformVisualizer } from '../audio/WaveformVisualizer';

interface FloatingMicButtonProps {
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
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({
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
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <>
      {/* Floating Action Trigger Button (Bottom-Right) */}
      {!isRecording && !isProcessing && (
        <div className="absolute bottom-20 right-5 z-40">
          <button
            onClick={onStartDictation}
            aria-label="Drop Note Voice Dictation"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-obsidian-950 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 transition-all group"
          >
            <Mic className="w-6 h-6 animate-pulse" />
          </button>
        </div>
      )}

      {/* Continuous Dictation Overlay Sheet */}
      {(isRecording || isProcessing) && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-obsidian-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm mx-auto rounded-3xl bg-[#0E1426] border border-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.3)] p-5 flex flex-col space-y-4">
            {/* Header with Live Lecture Timestamp & Continuous Mode indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {isProcessing ? 'SYNTHESIZING STUDY NOTE...' : `VOICE DICTATION (${formatSecs(seconds)})`}
                </span>
              </div>

              <span className="text-xs font-mono text-cyan-300 font-bold">
                {capturedTimestamp}
              </span>
            </div>

            {/* Error / Permission Notice */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 font-sora">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-tight">{errorMessage}</p>
              </div>
            )}

            {/* Live Audio Waveform Canvas */}
            {!errorMessage && (
              <div className="py-1">
                <WaveformVisualizer
                  isPlaying={isRecording}
                  progress={0.5}
                  audioLevel={audioLevel}
                  activeColor="#FBBF24"
                  inactiveColor="rgba(251, 191, 36, 0.2)"
                  height={45}
                />
              </div>
            )}

            {/* Live Streaming Editable Transcription Box */}
            <div className="w-full min-h-[100px] max-h-[150px] p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-100 flex flex-col justify-between">
              <textarea
                value={transcript}
                onChange={(e) => onTranscriptChange?.(e.target.value)}
                placeholder="Listening... Speak naturally or type your note here..."
                rows={3}
                className="w-full bg-transparent text-sm font-medium text-slate-100 font-sora leading-relaxed resize-none focus:outline-none placeholder:text-slate-500 placeholder:italic"
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span>{wordCount} Words</span>
                </span>
                {isProcessing && (
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-amber-400 animate-spin" />
                    <span>Organizing note...</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={onCancelDictation}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                onClick={onFinalizeDictation}
                disabled={isProcessing}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Note & Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
