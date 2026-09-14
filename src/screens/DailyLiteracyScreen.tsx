import React, { useState, useEffect, useRef } from 'react';
import { DailyLesson, UserLiteracyProgress } from '../types';
import {
  DailyLiteracyManager,
  DAILY_LESSONS,
} from '../services/education/dailyLiteracyProgram';
import { TTSEngine } from '../services/audio/ttsEngine';
import { HapticFeedback } from '../services/device/deviceDetector';
import {
  GraduationCap,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  RotateCcw,
  Trophy,
  Star,
  Compass,
  Check,
  ChevronRight,
  BookmarkCheck,
} from 'lucide-react';

type Step = 'vocab' | 'spelling' | 'reading' | 'celebration';

export const DailyLiteracyScreen: React.FC = () => {
  const [progress, setProgress] = useState<UserLiteracyProgress>(() =>
    DailyLiteracyManager.getProgress()
  );
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const p = DailyLiteracyManager.getProgress();
    return Math.min(p.currentDay, DAILY_LESSONS.length);
  });
  const [currentStep, setCurrentStep] = useState<Step>('vocab');

  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSyllable, setActiveSyllable] = useState<string | null>(null);

  // Spelling Step State
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingFeedback, setSpellingFeedback] = useState<{
    tested: boolean;
    isCorrect: boolean;
    message: string;
    scaffolding: string;
  }>({
    tested: false,
    isCorrect: false,
    message: '',
    scaffolding: '',
  });
  const [showSpellingHint, setShowSpellingHint] = useState(false);
  const spellingInputRef = useRef<HTMLInputElement>(null);

  // Reading Step State
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // Active Lesson
  const lesson: DailyLesson = DailyLiteracyManager.getLessonByDay(selectedDay);

  // Clean up audio on unmount or step changes
  useEffect(() => {
    return () => {
      TTSEngine.stop();
    };
  }, [currentStep, selectedDay]);

  // Reset step-specific states when switching lessons
  const handleSelectDay = (day: number) => {
    TTSEngine.stop();
    setIsPlayingAudio(false);
    setSelectedDay(day);
    setCurrentStep('vocab');
    setSpellingInput('');
    setSpellingFeedback({ tested: false, isCorrect: false, message: '', scaffolding: '' });
    setShowSpellingHint(false);
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
  };

  // Play audio for a single syllable
  const handleSpeakSyllable = (syllable: string) => {
    HapticFeedback.light();
    TTSEngine.stop();
    setActiveSyllable(syllable);
    TTSEngine.speak(
      syllable,
      0.8,
      {
        onEnd: () => setActiveSyllable(null),
        onError: () => setActiveSyllable(null),
      }
    );
  };

  // Play audio for full target word
  const handleSpeakWord = () => {
    HapticFeedback.light();
    TTSEngine.stop();
    setIsPlayingAudio(true);
    TTSEngine.speak(
      lesson.word,
      0.85,
      {
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      }
    );
  };

  // Play audio for reading passage
  const handleTogglePassageAudio = () => {
    if (isPlayingAudio) {
      TTSEngine.stop();
      setIsPlayingAudio(false);
      return;
    }

    HapticFeedback.light();
    setIsPlayingAudio(true);
    TTSEngine.speak(
      lesson.readingPassage,
      0.95,
      {
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      }
    );
  };

  // Handle spelling check
  const handleCheckSpelling = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!spellingInput.trim()) return;

    const result = DailyLiteracyManager.checkSpelling(spellingInput, lesson.word);
    setSpellingFeedback({
      tested: true,
      isCorrect: result.isCorrect,
      message: result.feedback,
      scaffolding: result.scaffolding,
    });

    if (result.isCorrect) {
      HapticFeedback.success();
    } else {
      HapticFeedback.error();
    }
  };

  // Handle reading answer selection
  const handleSelectAnswer = (index: number) => {
    if (isAnswerSubmitted) return;
    HapticFeedback.light();
    setSelectedAnswerIndex(index);
    setIsAnswerSubmitted(true);
    if (index === lesson.correctOptionIndex) {
      HapticFeedback.success();
    } else {
      HapticFeedback.warning();
    }
  };

  // Finish daily lesson and update streak & mastery
  const handleCompleteLesson = () => {
    HapticFeedback.success();
    const updated = DailyLiteracyManager.completeDailyLesson(lesson.dayNumber, lesson.word);
    setProgress(updated);
    setCurrentStep('celebration');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-900 text-slate-100 pb-28">
      {/* Top Header & Progress Ribbon */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Daily Word Lab
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                  Day {lesson.dayNumber} of {DAILY_LESSONS.length}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-100 truncate">
                {lesson.word}
              </h2>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span className="text-xs font-bold tracking-wide">
              {progress.streakCount} Day{progress.streakCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Step Progression Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <button
            onClick={() => {
              TTSEngine.stop();
              setCurrentStep('vocab');
            }}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              currentStep === 'vocab'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Vocab</span>
          </button>

          <button
            onClick={() => {
              TTSEngine.stop();
              setCurrentStep('spelling');
            }}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              currentStep === 'spelling'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Spelling</span>
          </button>

          <button
            onClick={() => {
              TTSEngine.stop();
              setCurrentStep('reading');
            }}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              currentStep === 'reading'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>3. Reading</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 flex flex-col max-w-xl mx-auto w-full">
        {/* ================= STEP 1: VOCABULARY ================= */}
        {currentStep === 'vocab' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Word Card */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {lesson.partOfSpeech}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {lesson.phonetic}
                    </span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                    {lesson.word}
                  </h1>
                </div>

                {/* Speak Word Button */}
                <button
                  onClick={handleSpeakWord}
                  disabled={isPlayingAudio}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center"
                  title="Hear Word Pronunciation"
                >
                  <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse text-amber-300' : ''}`} />
                </button>
              </div>

              {/* Syllable Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tap Syllables to Hear Individual Sounds:
                </div>
                <div className="flex flex-wrap gap-2">
                  {lesson.syllables.map((syl, i) => (
                    <button
                      key={i}
                      onClick={() => handleSpeakSyllable(syl)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all flex items-center space-x-1.5 ${
                        activeSyllable === syl
                          ? 'bg-indigo-600 text-white border-indigo-400 scale-105 shadow-sm'
                          : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600'
                      }`}
                    >
                      <span>{syl}</span>
                      <Volume2 className="w-3 h-3 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Meaning & Definition */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Meaning in Plain English</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed mt-1">
                {lesson.friendlyDefinition}
              </p>
            </div>

            {/* Example Sentence */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Sentence in Context
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "{lesson.sentenceExample}"
              </p>
            </div>

            {/* Educator Memory Trick & Etymology */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Lightbulb className="w-4 h-4" />
                <span>Educator Memory Trick</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed mt-1">
                {lesson.memoryTrick}
              </p>
              <div className="mt-2 text-[11px] text-amber-300/70 border-t border-amber-500/20 pt-2">
                <span className="font-semibold">Root Origin: </span>
                {lesson.rootOrigin}
              </div>
            </div>

            {/* Action Button: Next to Spelling */}
            <button
              onClick={() => {
                TTSEngine.stop();
                setCurrentStep('spelling');
                setTimeout(() => spellingInputRef.current?.focus(), 150);
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 mt-2"
            >
              <span>Continue to Spelling Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= STEP 2: SPELLING LAB ================= */}
        {currentStep === 'spelling' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Audio Challenge Card */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg text-center">
              <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phonetic Orthographic Mapping</span>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">
                Listen & Spell
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Tap the speaker to hear the word pronounced, then type the spelling letter by letter.
              </p>

              {/* Hear Word Button */}
              <button
                type="button"
                onClick={handleSpeakWord}
                disabled={isPlayingAudio}
                className="inline-flex items-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all"
              >
                <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse text-amber-300' : ''}`} />
                <span>Hear Word Again</span>
              </button>

              <div className="mt-3 text-xs text-slate-400 font-medium">
                Word length: <span className="text-indigo-400 font-bold">{lesson.word.length} letters</span> • {lesson.syllables.length} syllables
              </div>
            </div>

            {/* Interactive Spelling Input Form */}
            <form onSubmit={handleCheckSpelling} className="space-y-3">
              <div className="relative">
                <input
                  ref={spellingInputRef}
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={spellingInput}
                  onChange={(e) => setSpellingInput(e.target.value)}
                  placeholder="Type your spelling here..."
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 text-white rounded-xl px-4 py-3.5 text-lg font-mono tracking-wider focus:outline-none transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!spellingInput.trim()}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Check Spelling</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSpellingHint(!showSpellingHint)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition-all flex items-center space-x-1 text-xs"
                >
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>{showSpellingHint ? 'Hide Hint' : 'Hint'}</span>
                </button>
              </div>
            </form>

            {/* Supportive Educator Hint Accordion */}
            {showSpellingHint && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 animate-fadeIn">
                <span className="font-bold text-amber-400">Spelling Clue: </span>
                {lesson.spellingHint}
              </div>
            )}

            {/* Feedback & Scaffolding Display */}
            {spellingFeedback.tested && (
              <div
                className={`p-4 rounded-xl border transition-all animate-fadeIn ${
                  spellingFeedback.isCorrect
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {spellingFeedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {spellingFeedback.message}
                    </p>

                    {/* Scaffolding representation */}
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Letter Mapping:
                      </div>
                      <div className="font-mono text-base font-bold tracking-[0.25em] text-indigo-300 bg-slate-900/60 px-3 py-1.5 rounded-lg inline-block">
                        {spellingFeedback.scaffolding}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Step Button (enabled when correct) */}
            {spellingFeedback.isCorrect && (
              <button
                onClick={() => {
                  TTSEngine.stop();
                  setCurrentStep('reading');
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 animate-fadeIn"
              >
                <span>Continue to Reading Sprint</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ================= STEP 3: READING SPRINT ================= */}
        {currentStep === 'reading' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Reading Passage Card */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    60-Second Reading Sprint
                  </span>
                </div>

                <button
                  onClick={handleTogglePassageAudio}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse text-amber-300' : ''}`} />
                  <span>{isPlayingAudio ? 'Pause' : 'Listen'}</span>
                </button>
              </div>

              <h2 className="text-lg font-bold text-white mb-2">
                {lesson.readingTitle}
              </h2>

              {/* Passage with target word highlighted */}
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                {lesson.readingPassage.split(new RegExp(`(${lesson.word})`, 'gi')).map((chunk, idx) => {
                  if (chunk.toLowerCase() === lesson.word.toLowerCase()) {
                    return (
                      <span
                        key={idx}
                        className="bg-indigo-500/25 text-indigo-200 font-bold px-1.5 py-0.5 rounded border border-indigo-500/40"
                      >
                        {chunk}
                      </span>
                    );
                  }
                  return chunk;
                })}
              </p>
            </div>

            {/* Comprehension Question Card */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center space-x-1.5">
                <Compass className="w-4 h-4" />
                <span>Active Comprehension Check</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-3">
                {lesson.comprehensionQuestion}
              </h3>

              {/* Options */}
              <div className="space-y-2">
                {lesson.comprehensionOptions.map((opt, idx) => {
                  const isSelected = selectedAnswerIndex === idx;
                  const isCorrect = idx === lesson.correctOptionIndex;

                  let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750';
                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-200';
                    } else {
                      btnStyle = 'bg-slate-800/40 border-slate-700/40 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start space-x-2.5 ${btnStyle}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Educator Explanation after answering */}
              {isAnswerSubmitted && (
                <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 animate-fadeIn">
                  <span className="font-bold text-indigo-400">Educator Insight: </span>
                  {lesson.comprehensionExplanation}
                </div>
              )}
            </div>

            {/* Complete Lesson Button */}
            {isAnswerSubmitted && (
              <button
                onClick={handleCompleteLesson}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 animate-fadeIn"
              >
                <Trophy className="w-5 h-5 text-amber-300" />
                <span>Complete Lesson & Build Streak</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ================= STEP 4: CELEBRATION & WORD VAULT ================= */}
        {currentStep === 'celebration' && (
          <div className="space-y-4 animate-fadeIn text-center">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
              </div>

              <h2 className="text-2xl font-black text-white">
                Daily Lesson Complete!
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-sm mx-auto">
                You mastered <span className="text-indigo-400 font-bold">"{lesson.word}"</span> and strengthened your vocabulary, spelling, and reading skills.
              </p>

              {/* Streak Banner */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 mt-4 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-sm font-bold">
                <Flame className="w-5 h-5 fill-amber-400" />
                <span>{progress.streakCount} Day Streak Active!</span>
              </div>
            </div>

            {/* Personal Mastery Word Vault */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Mastery Vault ({progress.masteredWords.length} Words)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Permanently unlocked</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {progress.masteredWords.map((word, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {word}
                    </span>
                    <button
                      onClick={() => {
                        TTSEngine.stop();
                        TTSEngine.speak(word, 0.9);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-400"
                      title="Pronounce"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: Next Lesson or Review */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const nextDay = Math.min(DAILY_LESSONS.length, lesson.dayNumber + 1);
                  handleSelectDay(nextDay);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <span>Next Lesson (Day {Math.min(DAILY_LESSONS.length, lesson.dayNumber + 1)})</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectDay(lesson.dayNumber)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Review</span>
              </button>
            </div>
          </div>
        )}

        {/* Lesson Day Switcher Pills (at bottom of screen for easy review) */}
        <div className="mt-8 pt-4 border-t border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            10-Day Curriculum Track:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {DAILY_LESSONS.map((l) => {
              const isCurrent = l.dayNumber === selectedDay;
              const isMastered = progress.masteredWords.includes(l.word);

              return (
                <button
                  key={l.dayNumber}
                  onClick={() => handleSelectDay(l.dayNumber)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : isMastered
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span>Day {l.dayNumber}</span>
                  {isMastered && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
