import React, { useState, useEffect, useRef } from 'react';
import {
  ImmersionPassage,
  ReadingDomain,
  LexileBand,
  TargetWordDetail,
  PassageCheckpoint
} from '../../types';
import { ImmersionPassageManager } from '../../services/education/immersionPassages';
import { TTSEngine } from '../../services/audio/ttsEngine';
import { HapticFeedback } from '../../services/device/deviceDetector';
import {
  BookOpen,
  Volume2,
  Compass,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Zap,
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';

interface ImmersionStepProps {
  initialDomain?: ReadingDomain;
  initialLexile?: LexileBand;
  onPassageChange?: (passage: ImmersionPassage) => void;
  onComplete: (stats: { wpm: number; durationSeconds: number }) => void;
}

export const ImmersionStep: React.FC<ImmersionStepProps> = ({
  initialDomain = 'Philosophy',
  initialLexile = '1000L',
  onPassageChange,
  onComplete
}) => {
  const [selectedDomain, setSelectedDomain] = useState<ReadingDomain>(initialDomain);
  const [selectedLexile, setSelectedLexile] = useState<LexileBand>(initialLexile);
  const [passage, setPassage] = useState<ImmersionPassage>(() =>
    ImmersionPassageManager.getPassage(initialDomain, initialLexile)
  );

  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Active Word Glossing Modal/State
  const [glossWord, setGlossWord] = useState<TargetWordDetail | null>(null);

  // Embedded Checkpoints State
  const [checkpoint1Answer, setCheckpoint1Answer] = useState<number | null>(null);
  const [checkpoint2Answer, setCheckpoint2Answer] = useState<number | null>(null);

  // Reading Timer & WPM
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Update passage when domain or lexile changes
  const handleDomainOrLexileChange = (domain: ReadingDomain, lexile: LexileBand) => {
    TTSEngine.stop();
    setIsPlayingAudio(false);
    setSelectedDomain(domain);
    setSelectedLexile(lexile);
    const newPassage = ImmersionPassageManager.getPassage(domain, lexile);
    setPassage(newPassage);
    onPassageChange?.(newPassage);
    setCheckpoint1Answer(null);
    setCheckpoint2Answer(null);
    setSecondsElapsed(0);
    setIsTimerRunning(true);
  };

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Clean up audio
  useEffect(() => {
    return () => {
      TTSEngine.stop();
    };
  }, [passage]);

  const togglePassageAudio = () => {
    if (isPlayingAudio) {
      TTSEngine.stop();
      setIsPlayingAudio(false);
      return;
    }

    HapticFeedback.light();
    setIsPlayingAudio(true);
    TTSEngine.speak(passage.content, 0.95, {
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  };

  // Calculate WPM
  const minutes = Math.max(0.1, secondsElapsed / 60);
  const calculatedWPM = Math.round(passage.wordCount / minutes);

  const cp1 = passage.checkpoints[0];
  const cp2 = passage.checkpoints[1];

  const isCp1Complete = checkpoint1Answer !== null;
  const isCp2Complete = checkpoint2Answer !== null;
  const allCheckpointsComplete = isCp1Complete && isCp2Complete;

  // Split passage into sections around checkpoints
  const words = passage.content.split(/\s+/);
  const section1Text = words.slice(0, cp1.wordOffset).join(' ');
  const section2Text = words.slice(cp1.wordOffset, cp2.wordOffset).join(' ');
  const section3Text = words.slice(cp2.wordOffset).join(' ');

  const renderHighlightedText = (text: string) => {
    // Regex matching any target word
    const targetWordRegex = new RegExp(
      `\\b(${passage.targetWords.map((t) => t.word).join('|')})\\b`,
      'gi'
    );

    const parts = text.split(targetWordRegex);

    return (
      <>
        {parts.map((part, i) => {
          const matchedTarget = passage.targetWords.find(
            (t) => t.word.toLowerCase() === part.toLowerCase()
          );

          if (matchedTarget) {
            return (
              <button
                key={i}
                onClick={() => {
                  HapticFeedback.light();
                  setGlossWord(matchedTarget);
                }}
                className="inline-flex items-baseline px-1.5 py-0.5 mx-0.5 rounded-md font-bold bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/40 transition-all cursor-pointer underline decoration-dotted"
                title="Tap to see definition & syllables"
              >
                {part}
              </button>
            );
          }

          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Domain & Lexile Selector Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Domain Chips */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Reading Domain:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['Philosophy', 'Science', 'Literature', 'CurrentAffairs'] as ReadingDomain[]).map((dom) => (
                <button
                  key={dom}
                  onClick={() => handleDomainOrLexileChange(dom, selectedLexile)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedDomain === dom
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-slate-900/60 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  {dom === 'CurrentAffairs' ? 'Current Affairs' : dom}
                </button>
              ))}
            </div>
          </div>

          {/* Lexile Bands */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Lexile Band:
            </div>
            <div className="flex gap-1.5">
              {(['800L', '1000L', '1200L'] as LexileBand[]).map((lex) => (
                <button
                  key={lex}
                  onClick={() => handleDomainOrLexileChange(selectedDomain, lex)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    selectedLexile === lex
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-slate-900/60 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  {lex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reading Passage Container */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        {/* Passage Header */}
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {passage.domain} • {passage.lexile}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-mono">
                {passage.wordCount} words
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              {passage.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {passage.subtitle}
            </p>
          </div>

          {/* Audio & Timer Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</span>
            </div>

            <button
              onClick={togglePassageAudio}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
              title="Read-along audio"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse text-amber-300' : ''}`} />
            </button>
          </div>
        </div>

        {/* ================= Section 1 ================= */}
        <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed font-serif tracking-wide space-y-3">
          <p>{renderHighlightedText(section1Text)}</p>
        </div>

        {/* ================= Checkpoint 1 ================= */}
        <div className="my-6 p-4 bg-indigo-950/40 border-2 border-indigo-500/40 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Active Checkpoint 1 of 2 (Mid-Text Recall)</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-3">
            {cp1.question}
          </h3>

          <div className="space-y-2">
            {cp1.options.map((opt, idx) => {
              const isSelected = checkpoint1Answer === idx;
              const isCorrect = idx === cp1.correctIndex;
              let btnClass = 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800';

              if (checkpoint1Answer !== null) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-500/20 border-rose-500/60 text-rose-200';
                } else {
                  btnClass = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={checkpoint1Answer !== null}
                  onClick={() => {
                    HapticFeedback.light();
                    setCheckpoint1Answer(idx);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start space-x-2.5 ${btnClass}`}
                >
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          {checkpoint1Answer !== null && (
            <div className="mt-3 p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 animate-fadeIn">
              <span className="font-bold text-indigo-400">Insight: </span>
              {cp1.explanation}
            </div>
          )}
        </div>

        {/* ================= Section 2 (Unlocks after Checkpoint 1) ================= */}
        {isCp1Complete && (
          <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed font-serif tracking-wide space-y-3 animate-fadeIn">
            <p>{renderHighlightedText(section2Text)}</p>
          </div>
        )}

        {/* ================= Checkpoint 2 ================= */}
        {isCp1Complete && (
          <div className="my-6 p-4 bg-purple-950/40 border-2 border-purple-500/40 rounded-2xl shadow-lg animate-fadeIn">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>Active Checkpoint 2 of 2 (Deep Synthesis)</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-3">
              {cp2.question}
            </h3>

            <div className="space-y-2">
              {cp2.options.map((opt, idx) => {
                const isSelected = checkpoint2Answer === idx;
                const isCorrect = idx === cp2.correctIndex;
                let btnClass = 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800';

                if (checkpoint2Answer !== null) {
                  if (isCorrect) {
                    btnClass = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold';
                  } else if (isSelected) {
                    btnClass = 'bg-rose-500/20 border-rose-500/60 text-rose-200';
                  } else {
                    btnClass = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={checkpoint2Answer !== null}
                    onClick={() => {
                      HapticFeedback.light();
                      setCheckpoint2Answer(idx);
                      setIsTimerRunning(false); // Stop timer on completion
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start space-x-2.5 ${btnClass}`}
                  >
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            {checkpoint2Answer !== null && (
              <div className="mt-3 p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-200 animate-fadeIn">
                <span className="font-bold text-purple-400">Insight: </span>
                {cp2.explanation}
              </div>
            )}
          </div>
        )}

        {/* ================= Section 3 (Unlocks after Checkpoint 2) ================= */}
        {isCp2Complete && (
          <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed font-serif tracking-wide space-y-3 animate-fadeIn">
            <p>{renderHighlightedText(section3Text)}</p>
          </div>
        )}
      </div>

      {/* Interactive In-Text Gloss Modal/Popover */}
      {glossWord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-scaleIn space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {glossWord.partOfSpeech} • {glossWord.phonetic}
                </span>
                <h2 className="text-2xl font-black text-white">{glossWord.word}</h2>
              </div>
              <button
                onClick={() => {
                  TTSEngine.stop();
                  TTSEngine.speak(glossWord.word, 0.85);
                }}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <span className="font-bold text-slate-100">Meaning: </span>
              {glossWord.definition}
            </div>

            <div className="text-xs text-purple-300 bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40">
              <span className="font-bold">Morphemes: </span>
              {glossWord.morphemes.root} ({glossWord.morphemes.meaning})
            </div>

            <button
              onClick={() => setGlossWord(null)}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs"
            >
              Close Gloss
            </button>
          </div>
        </div>
      )}

      {/* Completion & WPM Bar */}
      {allCheckpointsComplete && (
        <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-800 to-indigo-950/40 border border-emerald-500/40 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Passage Mastered!
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Reading Speed: <span className="text-emerald-400 font-bold font-mono">{calculatedWPM} WPM</span> in {secondsElapsed}s
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              HapticFeedback.success();
              TTSEngine.stop();
              onComplete({ wpm: calculatedWPM, durationSeconds: secondsElapsed });
            }}
            className="py-3 px-5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 text-xs"
          >
            <span>Continue to Orthographic Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
