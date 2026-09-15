import React, { useState, useEffect } from 'react';
import {
  DailyLesson,
  UserLiteracyProgress,
  ImmersionPassage,
  ReadingDomain,
  LexileBand
} from '../types';
import { DailyLiteracyManager } from '../services/education/dailyLiteracyProgram';
import { ImmersionPassageManager } from '../services/education/immersionPassages';
import { SRSEngine } from '../services/education/srsEngine';
import { db } from '../db/database';
import { TTSEngine } from '../services/audio/ttsEngine';
import { HapticFeedback } from '../services/device/deviceDetector';

// Step Components
import { PrimerStep } from '../components/literacy/PrimerStep';
import { ImmersionStep } from '../components/literacy/ImmersionStep';
import { OrthographicLabStep } from '../components/literacy/OrthographicLabStep';
import { SentenceTransferStep } from '../components/literacy/SentenceTransferStep';
import { LiteracyAnalyticsModal } from '../components/literacy/LiteracyAnalyticsModal';

import {
  GraduationCap,
  Flame,
  BarChart3,
  BookOpen,
  Layers,
  Compass,
  Sparkles,
  PenTool,
  Trophy,
  Award,
  ChevronRight,
  RotateCcw,
  Volume2,
  BookmarkCheck,
  Check
} from 'lucide-react';

type Step = 'primer' | 'immersion' | 'orthographic' | 'transfer' | 'celebration';

export const DailyLiteracyScreen: React.FC = () => {
  const [progress, setProgress] = useState<UserLiteracyProgress>(() =>
    DailyLiteracyManager.getProgress()
  );
  const [currentStep, setCurrentStep] = useState<Step>('primer');
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Active Passage & Target Words
  const [selectedDomain, setSelectedDomain] = useState<ReadingDomain>('Philosophy');
  const [selectedLexile, setSelectedLexile] = useState<LexileBand>('1000L');
  const [currentPassage, setCurrentPassage] = useState<ImmersionPassage>(() =>
    ImmersionPassageManager.getPassage('Philosophy', '1000L')
  );

  // Session Statistics
  const [sessionWPM, setSessionWPM] = useState<number>(245);
  const [sessionAccuracy, setSessionAccuracy] = useState<number>(95);

  // SM-2 Due Queue Count
  const [dueCardsCount, setDueCardsCount] = useState(0);

  useEffect(() => {
    const checkDue = async () => {
      try {
        const due = await SRSEngine.getDueCards();
        setDueCardsCount(due.length);
      } catch (err) {
        console.error('Error fetching due cards:', err);
      }
    };
    checkDue();
  }, [currentStep]);

  // Clean audio on step switch
  useEffect(() => {
    return () => {
      TTSEngine.stop();
    };
  }, [currentStep, currentPassage]);

  // Step 1 -> Step 2
  const handlePrimerComplete = () => {
    setCurrentStep('immersion');
  };

  // Step 2 -> Step 3
  const handleImmersionComplete = (stats: { wpm: number; durationSeconds: number }) => {
    setSessionWPM(stats.wpm);
    setCurrentStep('orthographic');
  };

  // Step 3 -> Step 4
  const handleOrthographicComplete = (accuracyRate: number) => {
    setSessionAccuracy(accuracyRate);
    setCurrentStep('transfer');
  };

  // Step 4 -> Complete & Celebration
  const handleTransferComplete = async () => {
    HapticFeedback.success();

    // 1. Record in reading analytics table
    try {
      await db.readingAnalytics.add({
        id: `analytics-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        domain: currentPassage.domain,
        lexileLevel: currentPassage.lexile,
        wpm: sessionWPM,
        wordsRead: currentPassage.wordCount,
        orthographicAccuracy: sessionAccuracy,
        durationSeconds: Math.round((currentPassage.wordCount / Math.max(1, sessionWPM)) * 60)
      });
    } catch (err) {
      console.warn('Could not record analytics:', err);
    }

    // 2. Complete daily lesson and update streak
    const primaryWord = currentPassage.targetWords[0]?.word || 'Empirical';
    const updatedProgress = DailyLiteracyManager.completeDailyLesson(progress.currentDay, primaryWord);
    setProgress(updatedProgress);

    setCurrentStep('celebration');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-900 text-slate-100 pb-28">
      {/* Top Header & Navigation Ribbon */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Literacy Engine
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                  {currentPassage.domain} • {currentPassage.lexile}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-100 truncate">
                {currentPassage.title}
              </h2>
            </div>
          </div>

          {/* Right Action Controls: Streak & Analytics Trigger */}
          <div className="flex items-center space-x-2">
            {/* Analytics Modal Button */}
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 transition-all flex items-center justify-center"
              title="Open Literacy Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            {/* Streak Counter */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span className="text-xs font-bold tracking-wide">
                {progress.streakCount} Day{progress.streakCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Step Daily Loop Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 mt-3">
          <button
            onClick={() => {
              TTSEngine.stop();
              setCurrentStep('primer');
            }}
            className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              currentStep === 'primer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="truncate">1. Primer</span>
          </button>

          <button
            onClick={() => {
              TTSEngine.stop();
              setCurrentStep('immersion');
            }}
            className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              currentStep === 'immersion'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span className="truncate">2. Immersion</span>
          </button>

          <button
            onClick={() => {
              TTSEngine.stop();
              setCurrentStep('orthographic');
            }}
            className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              currentStep === 'orthographic'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span className="truncate">3. Spelling</span>
          </button>

          <button
            onClick={() => {
              TTSEngine.stop();
              setCurrentStep('transfer');
            }}
            className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
              currentStep === 'transfer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span className="truncate">4. Transfer</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 flex flex-col max-w-xl mx-auto w-full">
        {/* STEP 1: PRIMER */}
        {currentStep === 'primer' && (
          <PrimerStep
            targetWords={currentPassage.targetWords}
            onComplete={handlePrimerComplete}
          />
        )}

        {/* STEP 2: CONTEXTUAL IMMERSION */}
        {currentStep === 'immersion' && (
          <ImmersionStep
            initialDomain={selectedDomain}
            initialLexile={selectedLexile}
            onPassageChange={(p) => {
              setCurrentPassage(p);
              setSelectedDomain(p.domain);
              setSelectedLexile(p.lexile);
            }}
            onComplete={handleImmersionComplete}
          />
        )}

        {/* STEP 3: ORTHOGRAPHIC LAB */}
        {currentStep === 'orthographic' && (
          <OrthographicLabStep
            targetWords={currentPassage.targetWords}
            onComplete={handleOrthographicComplete}
          />
        )}

        {/* STEP 4: ACTIVE RECALL & TRANSFER */}
        {currentStep === 'transfer' && (
          <SentenceTransferStep
            targetWords={currentPassage.targetWords}
            onComplete={handleTransferComplete}
          />
        )}

        {/* CELEBRATION & MASTERY VAULT */}
        {currentStep === 'celebration' && (
          <div className="space-y-4 animate-fadeIn text-center">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
              </div>

              <h2 className="text-2xl font-black text-white">
                Daily Literacy Sprint Complete!
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-sm mx-auto">
                You primed, immersed, mapped phonemes, and composed original sentences for {currentPassage.targetWords.length} high-impact words.
              </p>

              {/* Performance Pills */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono font-bold">
                  Speed: {sessionWPM} WPM
                </div>
                <div className="px-3 py-1.5 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-mono font-bold">
                  Spelling: {sessionAccuracy}%
                </div>
                <div className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{progress.streakCount}d Streak</span>
                </div>
              </div>
            </div>

            {/* Mastery Vault Section */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Mastery Vault ({progress.masteredWords.length} Words)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">SM-2 Spaced Retention Active</span>
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

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const domains: ReadingDomain[] = ['Philosophy', 'Science', 'Literature', 'CurrentAffairs'];
                  const nextDomain = domains[(domains.indexOf(selectedDomain) + 1) % domains.length];
                  setSelectedDomain(nextDomain);
                  const p = ImmersionPassageManager.getPassage(nextDomain, selectedLexile);
                  setCurrentPassage(p);
                  setCurrentStep('primer');
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md"
              >
                <span>Practice Next Domain</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAnalyticsOpen(true)}
                className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 flex items-center space-x-1.5 transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      <LiteracyAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
    </div>
  );
};
