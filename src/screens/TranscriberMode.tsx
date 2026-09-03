import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Square, Download, FileText, Trash2, AlertCircle, Check } from 'lucide-react';
import { VoiceRecognitionService } from '../services/audio/speechRecognition';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';

export const TranscriberMode: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);

  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  // Timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setIsRecording(true);
    setSeconds(0);

    await VoiceRecognitionService.startListening({
      onTranscriptChange: (text) => {
        setTranscript(text);
      },
      onAudioLevelChange: (lvl) => {
        setAudioLevel(lvl);
      },
      onStateChange: (state) => {
        if (state === 'error') {
          // Keep overlay open — user can type manually
        }
      },
      onError: (err) => {
        console.warn('Transcriber error:', err);
        setErrorMessage(err);
      },
    });
  }, []);

  const stopRecording = useCallback(() => {
    VoiceRecognitionService.stopListening();
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setSeconds(0);
    setErrorMessage(null);
    setExportedFormat(null);
  }, []);

  // Export functions
  const exportAs = useCallback((format: 'txt' | 'pdf' | 'docx') => {
    const text = transcriptRef.current.trim();
    if (!text) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `transcription-${timestamp}`;

    if (format === 'txt') {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Use jspdf dynamically
      import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF();
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, 15, 20);
        doc.save(`${filename}.pdf`);
      });
    } else if (format === 'docx') {
      // Simple HTML-to-Blob docx approach
      const html = `<html><body><p>${text.replace(/\n/g, '</p><p>')}</p></body></html>`;
      const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setExportedFormat(format);
    setTimeout(() => setExportedFormat(null), 2000);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-3 pb-2 overflow-hidden">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between pb-2 shrink-0">
        <div className="flex items-center space-x-2">
          {isRecording && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          )}
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            {isRecording ? `Recording ${formatTime(seconds)}` : 'Voice Transcriber'}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span>{wordCount} words</span>
          {transcript && (
            <button
              onClick={clearTranscript}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear transcription"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 font-sora shrink-0">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-tight">{errorMessage}</p>
        </div>
      )}

      {/* Waveform Visualizer (when recording) */}
      {isRecording && !errorMessage && (
        <div className="py-1 shrink-0">
          <WaveformVisualizer
            isPlaying={isRecording}
            progress={0.5}
            audioLevel={audioLevel}
            activeColor="#FBBF24"
            inactiveColor="rgba(251, 191, 36, 0.2)"
            height={35}
          />
        </div>
      )}

      {/* Large Proportional Content Window — fills available space (~70% viewport) */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-[#0E1426]/90 border border-cyan-400/20 shadow-xl overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-900/80 border-b border-white/5 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
            Transcription
          </span>
          {isRecording && (
            <span className="text-[10px] font-mono text-amber-400 animate-pulse">
              ● LIVE
            </span>
          )}
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={isRecording
            ? "Listening... speak naturally. Your words will appear here in real time."
            : "Tap the microphone below to start recording, or type directly here..."
          }
          className="flex-1 w-full p-4 bg-transparent text-sm text-slate-100 font-sora leading-relaxed resize-none focus:outline-none placeholder:text-slate-500 placeholder:italic overflow-y-auto"
        />
      </div>

      {/* Record / Stop Control */}
      <div className="flex items-center justify-center py-3 shrink-0">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:brightness-110 active:scale-95 transition-all"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 text-[#0A0F1D] flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition-all"
          >
            <Mic className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Export Bar */}
      {transcript.trim() && !isRecording && (
        <div className="flex items-center space-x-2 shrink-0 pb-1">
          <button
            onClick={() => exportAs('txt')}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              exportedFormat === 'txt'
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400/50'
            }`}
          >
            {exportedFormat === 'txt' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>TXT</span>
          </button>

          <button
            onClick={() => exportAs('pdf')}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              exportedFormat === 'pdf'
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400/50'
            }`}
          >
            {exportedFormat === 'pdf' ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            <span>PDF</span>
          </button>

          <button
            onClick={() => exportAs('docx')}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              exportedFormat === 'docx'
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400/50'
            }`}
          >
            {exportedFormat === 'docx' ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            <span>DOCX</span>
          </button>
        </div>
      )}
    </div>
  );
};
