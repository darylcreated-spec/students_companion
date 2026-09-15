import React, { useState, useEffect } from 'react';
import { TargetWordDetail } from '../../types';
import { TTSEngine } from '../../services/audio/ttsEngine';
import { HapticFeedback } from '../../services/device/deviceDetector';
import { DailyLiteracyManager } from '../../services/education/dailyLiteracyProgram';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Clock,
  Shuffle,
  Puzzle,
  Lightbulb,
  Award
} from 'lucide-react';

interface OrthographicLabStepProps {
  targetWords: TargetWordDetail[];
  onComplete: (accuracyRate: number) => void;
}

type SubExercise = 'syllable_puzzle' | 'affix_reconstruction' | 'timed_dictation';

export const OrthographicLabStep: React.FC<OrthographicLabStepProps> = ({
  targetWords,
  onComplete
}) => {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [activeExercise, setActiveExercise] = useState<SubExercise>('syllable_puzzle');

  // Exercise 1: Syllable Puzzle State
  const currentWord = targetWords[currentWordIdx] || targetWords[0];
  const [scrambledSyllables, setScrambledSyllables] = useState<string[]>([]);
  const [selectedSyllableSequence, setSelectedSyllableSequence] = useState<string[]>([]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  // Exercise 2: Missing Affix State
  const [affixOptions, setAffixOptions] = useState<string[]>([]);
  const [selectedAffix, setSelectedAffix] = useState<string | null>(null);
  const [isAffixSolved, setIsAffixSolved] = useState(false);

  // Exercise 3: Timed Dictation State
  const [dictationInput, setDictationInput] = useState('');
  const [dictationTimer, setDictationTimer] = useState(30);
  const [isDictationActive, setIsDictationActive] = useState(false);
  const [dictationFeedback, setDictationFeedback] = useState<{
    tested: boolean;
    isCorrect: boolean;
    scaffolding: string;
    message: string;
  }>({ tested: false, isCorrect: false, scaffolding: '', message: '' });

  // Accuracy score accumulation
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctFirstTries, setCorrectFirstTries] = useState(0);

  // Initialize Syllables on word change
  useEffect(() => {
    // Scramble syllables deterministically but non-identically
    const syls = [...currentWord.syllables];
    const shuffled = [...syls].sort(() => Math.random() - 0.5);
    // Ensure not identical if length > 1
    if (shuffled.join('') === syls.join('') && syls.length > 1) {
      shuffled.reverse();
    }
    setScrambledSyllables(shuffled);
    setSelectedSyllableSequence([]);
    setIsPuzzleSolved(false);

    // Initialize Affixes
    const realAffix = currentWord.morphemes.prefix || currentWord.morphemes.suffix || '-ize';
    const distractorPool = ['dis-', 're-', 'pre-', 'con-', '-tion', '-ic', '-ment', 'un-'];
    const distractors = distractorPool.filter((a) => a !== realAffix).slice(0, 3);
    setAffixOptions([realAffix, ...distractors].sort(() => Math.random() - 0.5));
    setSelectedAffix(null);
    setIsAffixSolved(false);

    // Reset Dictation
    setDictationInput('');
    setDictationTimer(30);
    setIsDictationActive(false);
    setDictationFeedback({ tested: false, isCorrect: false, scaffolding: '', message: '' });
  }, [currentWordIdx, currentWord]);

  // Dictation Timer
  useEffect(() => {
    if (!isDictationActive || dictationTimer <= 0) return;
    const interval = setInterval(() => {
      setDictationTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isDictationActive, dictationTimer]);

  // Handle Syllable Tap
  const handleTapSyllable = (syl: string, index: number) => {
    HapticFeedback.light();
    TTSEngine.stop();
    TTSEngine.speak(syl, 0.85);

    const nextSeq = [...selectedSyllableSequence, syl];
    setSelectedSyllableSequence(nextSeq);

    // Remove from available scrambled
    const remaining = [...scrambledSyllables];
    remaining.splice(index, 1);
    setScrambledSyllables(remaining);

    // Check if finished
    if (nextSeq.length === currentWord.syllables.length) {
      const reconstructed = nextSeq.join('').toLowerCase();
      const targetClean = currentWord.word.toLowerCase();
      if (reconstructed === targetClean) {
        HapticFeedback.success();
        setIsPuzzleSolved(true);
        setCorrectFirstTries((c) => c + 1);
      } else {
        HapticFeedback.error();
      }
      setTotalAttempts((t) => t + 1);
    }
  };

  const handleResetPuzzle = () => {
    HapticFeedback.light();
    setScrambledSyllables([...currentWord.syllables].sort(() => Math.random() - 0.5));
    setSelectedSyllableSequence([]);
    setIsPuzzleSolved(false);
  };

  // Handle Affix Selection
  const handleSelectAffix = (affix: string) => {
    HapticFeedback.light();
    setSelectedAffix(affix);
    const realAffix = currentWord.morphemes.prefix || currentWord.morphemes.suffix;
    const isCorrect = affix === realAffix;
    setIsAffixSolved(isCorrect);
    setTotalAttempts((t) => t + 1);
    if (isCorrect) {
      HapticFeedback.success();
      setCorrectFirstTries((c) => c + 1);
    } else {
      HapticFeedback.warning();
    }
  };

  // Handle Dictation Check
  const handleCheckDictation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dictationInput.trim()) return;

    const result = DailyLiteracyManager.checkSpelling(dictationInput, currentWord.word);
    setDictationFeedback({
      tested: true,
      isCorrect: result.isCorrect,
      scaffolding: result.scaffolding,
      message: result.feedback
    });

    setTotalAttempts((t) => t + 1);
    if (result.isCorrect) {
      HapticFeedback.success();
      setCorrectFirstTries((c) => c + 1);
      setIsDictationActive(false);
    } else {
      HapticFeedback.error();
    }
  };

  const handleNextWordOrFinish = () => {
    HapticFeedback.light();
    if (currentWordIdx < targetWords.length - 1) {
      setCurrentWordIdx(currentWordIdx + 1);
      setActiveExercise('syllable_puzzle');
    } else {
      HapticFeedback.success();
      const rate = totalAttempts > 0 ? Math.round((correctFirstTries / totalAttempts) * 100) : 100;
      onComplete(rate);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header & Sub-Exercise Tabs */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>Step 3: Orthographic Lab (Phoneme-to-Grapheme)</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold">
            Word {currentWordIdx + 1} of {targetWords.length}: {currentWord.word}
          </span>
        </div>

        {/* Sub-exercises navigation */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <button
            onClick={() => setActiveExercise('syllable_puzzle')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              activeExercise === 'syllable_puzzle'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>1. Syllable Puzzle</span>
          </button>

          <button
            onClick={() => setActiveExercise('affix_reconstruction')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              activeExercise === 'affix_reconstruction'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>2. Affix Lab</span>
          </button>

          <button
            onClick={() => {
              setActiveExercise('timed_dictation');
              setIsDictationActive(true);
            }}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              activeExercise === 'timed_dictation'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>3. Audio Dictation</span>
          </button>
        </div>
      </div>

      {/* ================= 1. SYLLABLE PUZZLE ================= */}
      {activeExercise === 'syllable_puzzle' && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white mb-1">
              Assemble the Syllables
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tap the scrambled syllable chunks in the correct phonetic order to construct: <strong className="text-purple-300">"{currentWord.word}"</strong>
            </p>
          </div>

          {/* Construction Tray */}
          <div className="min-h-[56px] p-3 bg-slate-900/80 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center gap-2 flex-wrap">
            {selectedSyllableSequence.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Tap blocks below to place syllables here...</span>
            ) : (
              selectedSyllableSequence.map((syl, i) => (
                <div
                  key={i}
                  className="px-3.5 py-1.5 bg-purple-600 text-white font-bold rounded-lg text-sm shadow-md animate-scaleIn"
                >
                  {syl}
                </div>
              ))
            )}
          </div>

          {/* Scrambled Blocks */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {scrambledSyllables.map((syl, i) => (
              <button
                key={i}
                onClick={() => handleTapSyllable(syl, i)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-100 font-bold rounded-xl text-sm border border-slate-600 shadow transition-all flex items-center space-x-1.5"
              >
                <span>{syl}</span>
                <Volume2 className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>

          {/* Feedback or Reset */}
          {selectedSyllableSequence.length > 0 && !isPuzzleSolved && (
            <div className="text-center pt-2">
              <button
                onClick={handleResetPuzzle}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center space-x-1 mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Blocks</span>
              </button>
            </div>
          )}

          {isPuzzleSolved && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center space-y-2 animate-fadeIn">
              <div className="flex items-center justify-center space-x-1.5 text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Perfect Phonemic Reconstruction!</span>
              </div>
              <p className="text-xs text-emerald-200">
                You successfully joined the {currentWord.syllables.length} syllable sounds of "{currentWord.word}".
              </p>
              <button
                onClick={() => setActiveExercise('affix_reconstruction')}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all inline-flex items-center space-x-1.5 shadow"
              >
                <span>Proceed to Affix Reconstruction</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. AFFIX RECONSTRUCTION ================= */}
      {activeExercise === 'affix_reconstruction' && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white mb-1">
              Missing Affix Reconstruction
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Identify the missing morpheme (prefix or suffix) that completes the morphological structure of this word.
            </p>
          </div>

          {/* Stem Display */}
          <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl text-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              Word Root & Context
            </div>
            <div className="text-xl font-mono font-bold text-indigo-300">
              {currentWord.morphemes.prefix ? `[ ___ ] + ${currentWord.morphemes.root}` : `${currentWord.morphemes.root} + [ ___ ]`}
            </div>
            <div className="text-xs text-slate-400 italic mt-1">
              Meaning: {currentWord.morphemes.meaning}
            </div>
          </div>

          {/* Affix Options */}
          <div className="grid grid-cols-2 gap-2">
            {affixOptions.map((aff, i) => {
              const isSelected = selectedAffix === aff;
              let style = 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750';
              if (selectedAffix !== null) {
                if (aff === (currentWord.morphemes.prefix || currentWord.morphemes.suffix)) {
                  style = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold';
                } else if (isSelected) {
                  style = 'bg-rose-500/20 border-rose-500/60 text-rose-200';
                }
              }

              return (
                <button
                  key={i}
                  disabled={selectedAffix !== null}
                  onClick={() => handleSelectAffix(aff)}
                  className={`p-3 rounded-xl border font-mono font-bold text-sm transition-all ${style}`}
                >
                  {aff}
                </button>
              );
            })}
          </div>

          {isAffixSolved && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center space-y-2 animate-fadeIn">
              <div className="text-xs text-emerald-300 font-semibold">
                Correct! Morphological structure verified.
              </div>
              <button
                onClick={() => {
                  setActiveExercise('timed_dictation');
                  setIsDictationActive(true);
                }}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all inline-flex items-center space-x-1.5 shadow"
              >
                <span>Proceed to Audio Dictation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. TIMED DICTATION ================= */}
      {activeExercise === 'timed_dictation' && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Audio Dictation Challenge</h2>
              <p className="text-xs text-slate-400">Listen carefully and spell under gentle pressure.</p>
            </div>
            <div className="flex items-center space-x-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{dictationTimer}s</span>
            </div>
          </div>

          {/* Hear Word Button */}
          <div className="text-center py-2">
            <button
              onClick={() => {
                HapticFeedback.light();
                TTSEngine.stop();
                TTSEngine.speak(currentWord.word, 0.85);
              }}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold rounded-xl shadow-lg transition-all inline-flex items-center space-x-2"
            >
              <Volume2 className="w-5 h-5" />
              <span>Hear Target Word</span>
            </button>
            <div className="text-xs text-slate-400 mt-2 font-mono">
              Target length: <span className="text-purple-300 font-bold">{currentWord.word.length} letters</span>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleCheckDictation} className="space-y-3">
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={dictationInput}
              onChange={(e) => setDictationInput(e.target.value)}
              placeholder="Type spelling..."
              className="w-full bg-slate-900 border-2 border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-3 text-lg font-mono tracking-wider focus:outline-none"
            />

            <button
              type="submit"
              disabled={!dictationInput.trim()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Check Spelling
            </button>
          </form>

          {/* Feedback Display */}
          {dictationFeedback.tested && (
            <div
              className={`p-3.5 rounded-xl border transition-all animate-fadeIn ${
                dictationFeedback.isCorrect
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="text-xs font-semibold">{dictationFeedback.message}</div>
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scaffold: </span>
                <span className="font-mono text-sm font-bold text-purple-300 tracking-[0.2em]">
                  {dictationFeedback.scaffolding}
                </span>
              </div>
            </div>
          )}

          {/* Advance Button */}
          {dictationFeedback.isCorrect && (
            <button
              onClick={handleNextWordOrFinish}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm animate-fadeIn"
            >
              <span>{currentWordIdx < targetWords.length - 1 ? 'Next Target Word' : 'Complete Orthographic Lab'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
