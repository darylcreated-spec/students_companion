import React from 'react';
import { Mic, Check, X, Loader2, Cpu } from 'lucide-react';
import { WaveformVisualizer } from '../audio/WaveformVisualizer';

interface FloatingMicButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  audioLevel: number;
  capturedTimestamp: string;
  onStartDictation: () => void;
  onFinalizeDictation: () => void;
  onCancelDictation: () => void;
  onManualTextChange?: (text: string) => void;
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({
  isRecording,
  isProcessing,
  transcript,
  audioLevel,
  capturedTimestamp,
  onStartDictation,
  onFinalizeDictation,
  onCancelDictation,
}) => {
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

      {/* Dictation Overlay Sheet */}
      {(isRecording || isProcessing) && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-obsidian-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm mx-auto rounded-3xl bg-[#0E1426] border border-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.3)] p-5 flex flex-col space-y-4">
            {/* Header with Live Lecture Timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {isProcessing ? 'SYNTHESIZING NOTE...' : 'LISTENING TO COMMUTER...'}
                </span>
              </div>

              <span className="text-xs font-mono text-cyan-300 font-bold">
                {capturedTimestamp}
              </span>
            </div>

            {/* Live Audio Waveform Canvas */}
            <div className="py-2">
              <WaveformVisualizer
                isPlaying={isRecording}
                progress={0.5}
                audioLevel={audioLevel}
                activeColor="#FBBF24"
                inactiveColor="rgba(251, 191, 36, 0.2)"
                height={55}
              />
            </div>

            {/* Transcription Box */}
            <div className="w-full min-h-[80px] p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 flex flex-col justify-between">
              {transcript ? (
                <p className="text-sm font-medium text-slate-100 font-sora leading-relaxed">
                  "{transcript}"
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic font-mono animate-pulse">
                  Speak your thought, question, or exam alert...
                </p>
              )}

              {isProcessing && (
                <div className="flex items-center space-x-1.5 text-[11px] font-mono text-cyan-400 pt-2 border-t border-white/5 mt-2">
                  <Cpu className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                  <span>Categorizing into Study Notes via Gemini...</span>
                </div>
              )}
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
                    <span>Done & Resume Audio</span>
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
