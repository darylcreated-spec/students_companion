import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic,
  Square,
  Download,
  FileText,
  Trash2,
  AlertCircle,
  Check,
  Smartphone,
  CheckCheck,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { VoiceRecognitionService } from '../services/audio/speechRecognition';
import { PunctuationService } from '../services/audio/punctuationService';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { HapticFeedback } from '../services/device/deviceDetector';

export const TranscriberMode: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);
  const [isPunctuating, setIsPunctuating] = useState(false);
  const [punctuationSuccess, setPunctuationSuccess] = useState(false);
  const [showPunctuationHelp, setShowPunctuationHelp] = useState(false);

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

  // Start recording synchronously on user gesture (required for mobile iOS & Android)
  const startRecording = useCallback(() => {
    HapticFeedback.trigger('medium');
    setErrorMessage(null);
    setIsRecording(true);
    setSeconds(0);

    VoiceRecognitionService.startListening({
      onTranscriptChange: (text) => {
        setTranscript(text);
      },
      onAudioLevelChange: (lvl) => {
        setAudioLevel(lvl);
      },
      onStateChange: (state) => {
        if (state === 'idle') {
          setIsRecording(false);
        }
      },
      onError: (err) => {
        console.warn('Transcriber error:', err);
        setErrorMessage(err);
      },
    });
  }, []);

  const stopRecording = useCallback(() => {
    HapticFeedback.trigger('medium');
    VoiceRecognitionService.stopListening();
    setIsRecording(false);
    setAudioLevel(0);

    // Apply smart offline auto-punctuation to finalize raw continuous dictation
    const current = transcriptRef.current;
    if (current && current.trim()) {
      const autoPunctuated = PunctuationService.autoPunctuateOffline(current);
      setTranscript(autoPunctuated);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    HapticFeedback.trigger('light');
    setTranscript('');
    setSeconds(0);
    setErrorMessage(null);
    setExportedFormat(null);
    setPunctuationSuccess(false);
  }, []);

  // One-tap Auto-Punctuate
  const handleAutoPunctuate = async () => {
    const current = transcriptRef.current;
    if (!current || !current.trim() || isPunctuating) return;

    HapticFeedback.trigger('light');
    setIsPunctuating(true);
    try {
      const formatted = await PunctuationService.autoPunctuateWithAI(current);
      setTranscript(formatted);
      setPunctuationSuccess(true);
      HapticFeedback.trigger('success');
      setTimeout(() => setPunctuationSuccess(false), 2500);
    } catch (e) {
      console.warn('Auto punctuate error:', e);
      const fallback = PunctuationService.autoPunctuateOffline(current);
      setTranscript(fallback);
    } finally {
      setIsPunctuating(false);
    }
  };

  // Export functions
  const exportAs = useCallback((format: 'txt' | 'pdf' | 'docx' | 'anki') => {
    const text = transcriptRef.current.trim();
    if (!text) return;

    HapticFeedback.trigger('success');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `transcription-${timestamp}`;

    if (format === 'txt') {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF();
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, 15, 20);
        doc.save(`${filename}.pdf`);
      });
    } else if (format === 'docx') {
      const html = `<html><body><p>${text.replace(/\n/g, '</p><p>')}</p></body></html>`;
      const blob = new Blob([html], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'anki') {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const rows = [
        '#separator:tab',
        '#html:true',
        '#tags column:3',
        '#deck:Student Companion Commute Notes',
      ];

      sentences.forEach((sentence, idx) => {
        const clean = sentence.trim().replace(/\t/g, ' ');
        if (!clean) return;
        const front = `<b>Lecture Note #${idx + 1}</b><br><i>What is the core takeaway?</i>`;
        const back = `${clean}`;
        const tags = 'students_companion commute_notes exam_review';
        rows.push(`${front}\t${back}\t${tags}`);
      });

      const blob = new Blob([rows.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-anki.tsv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setExportedFormat(format);
    setTimeout(() => setExportedFormat(null), 2000);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-3 pb-2 overflow-hidden select-none sm:select-auto">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between pb-2 shrink-0">
        <div className="flex items-center space-x-2">
          {isRecording ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-amber-400">
                RECORDING ({formatTime(seconds)})
              </span>
            </>
          ) : (
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Transcriber</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span>{wordCount} words</span>
          <button
            onClick={() => setShowPunctuationHelp(!showPunctuationHelp)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Spoken punctuation guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {transcript && (
            <button
              onClick={clearTranscript}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear transcription"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Spoken Punctuation Commands Guide (Collapsible) */}
      {showPunctuationHelp && (
        <div className="mb-2 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-400/30 text-cyan-200 text-xs font-sora shrink-0 space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spoken Punctuation & Voice Commands</span>
            </span>
            <button
              onClick={() => setShowPunctuationHelp(false)}
              className="text-slate-400 hover:text-white text-[11px] font-mono"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Speak naturally or say punctuation out loud while dictating:
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-cyan-300/90 pt-0.5">
            <div>• &quot;period&quot; ➔ .</div>
            <div>• &quot;comma&quot; ➔ ,</div>
            <div>• &quot;question mark&quot; ➔ ?</div>
            <div>• &quot;exclamation point&quot; ➔ !</div>
            <div>• &quot;new line&quot; ➔ [line break]</div>
            <div>• &quot;new paragraph&quot; ➔ [spacing]</div>
            <div>• &quot;colon&quot; / &quot;semi colon&quot; ➔ : ;</div>
            <div>• &quot;bullet point&quot; ➔ • </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1 border-t border-cyan-400/10">
            Tip: You can also tap the <strong>✨ Auto-Punctuate</strong> button anytime to add commas and periods automatically.
          </p>
        </div>
      )}

      {/* Error & Permission Notice */}
      {errorMessage && (
        <div className="mb-2 p-2.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex flex-col space-y-1.5 font-sora shrink-0">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-tight">{errorMessage}</p>
          </div>
          <div className="pt-1 border-t border-rose-500/20 text-[11px] text-rose-300/90 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span>
              Tip: You can also tap the box below and use the <strong>microphone button on your mobile keyboard</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Waveform Visualizer (when recording) */}
      {isRecording && (
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

      {/* Large Proportional Content Window — fills available space (~75% viewport) */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-[#0E1426]/90 border border-cyan-400/20 shadow-xl overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-900/80 border-b border-white/5 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Transcription Window</span>
          </span>

          <div className="flex items-center space-x-2">
            {/* Auto-Punctuate Button */}
            {transcript.trim() && !isRecording && (
              <button
                id="auto-punctuate-btn"
                onClick={handleAutoPunctuate}
                disabled={isPunctuating}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all active:scale-95 border ${
                  punctuationSuccess
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-400/40 hover:border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                }`}
                title="Add punctuation, periods, and capitalization automatically"
              >
                {isPunctuating ? (
                  <>
                    <FileText className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                    <span>Punctuating...</span>
                  </>
                ) : punctuationSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Punctuated!</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Auto-Punctuate</span>
                  </>
                )}
              </button>
            )}

            {isRecording ? (
              <span className="text-[10px] font-mono text-amber-400 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>LIVE AUDIO</span>
              </span>
            ) : !transcript.trim() ? (
              <span className="text-[10px] font-mono text-slate-400">
                Tap below to edit or type
              </span>
            ) : null}
          </div>
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={
            isRecording
              ? "Listening... speak into your device's microphone now (say 'period', 'comma', 'new line' to punctuate)."
              : "Tap the microphone below to dictate, or tap here to type / use your mobile keyboard microphone..."
          }
          autoCapitalize="sentences"
          autoCorrect="on"
          spellCheck={true}
          className="flex-1 w-full p-4 bg-transparent text-sm text-slate-100 font-sora leading-relaxed resize-none focus:outline-none placeholder:text-slate-500 placeholder:italic overflow-y-auto touch-manipulation"
        />
      </div>

      {/* Record / Stop Control */}
      <div className="flex flex-col items-center justify-center py-2 shrink-0 space-y-1">
        {isRecording ? (
          <button
            onClick={stopRecording}
            aria-label="Stop recording"
            className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:brightness-110 active:scale-95 transition-all"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            aria-label="Start microphone dictation"
            className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 text-[#0A0F1D] flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition-all"
          >
            <Mic className="w-7 h-7" />
          </button>
        )}

        <span className="text-[10px] font-mono text-slate-400">
          {isRecording ? 'Tap to Stop (Auto-Punctuates)' : 'Tap Mic to Start Dictating'}
        </span>
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
            {exportedFormat === 'txt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
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
            {exportedFormat === 'pdf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
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
            {exportedFormat === 'docx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
            <span>DOCX</span>
          </button>

          <button
            onClick={() => exportAs('anki')}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              exportedFormat === 'anki'
                ? 'bg-amber-400/20 border-amber-400/80 text-amber-300'
                : 'bg-slate-900 border-amber-400/30 text-amber-300/90 hover:border-amber-400'
            }`}
            title="Export to Anki Flashcards Deck"
          >
            {exportedFormat === 'anki' ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Layers className="w-3.5 h-3.5 text-amber-400" />}
            <span>ANKI</span>
          </button>
        </div>
      )}
    </div>
  );
};
