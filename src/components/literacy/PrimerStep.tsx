import React, { useState } from 'react';
import { TargetWordDetail } from '../../types';
import { TTSEngine } from '../../services/audio/ttsEngine';
import { HapticFeedback } from '../../services/device/deviceDetector';
import {
  BookOpen,
  Volume2,
  Sparkles,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Layers,
  HelpCircle
} from 'lucide-react';

interface PrimerStepProps {
  targetWords: TargetWordDetail[];
  onComplete: () => void;
}

export const PrimerStep: React.FC<PrimerStepProps> = ({ targetWords, onComplete }) => {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [activeSyllable, setActiveSyllable] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentWord = targetWords[activeWordIndex] || targetWords[0];

  const handleSpeakSyllable = (syl: string) => {
    HapticFeedback.light();
    TTSEngine.stop();
    setActiveSyllable(syl);
    TTSEngine.speak(syl, 0.8, {
      onEnd: () => setActiveSyllable(null),
      onError: () => setActiveSyllable(null)
    });
  };

  const handleSpeakWord = () => {
    HapticFeedback.light();
    TTSEngine.stop();
    setIsPlayingAudio(true);
    TTSEngine.speak(currentWord.word, 0.85, {
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/30 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Step 1: Morphological & Orthographic Primer</span>
        </div>
        <h2 className="text-base font-bold text-white">
          Pre-Reading Vocabulary Anatomy
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Master the building blocks (roots, prefixes, suffixes) and spelling rules of these {targetWords.length} Tier 2 words before encountering them in your immersion passage.
        </p>

        {/* Word Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {targetWords.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                HapticFeedback.light();
                TTSEngine.stop();
                setActiveWordIndex(idx);
              }}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                activeWordIndex === idx
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 font-semibold'
                  : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700 text-xs font-medium'
              }`}
            >
              <div className="text-xs truncate">{item.word}</div>
              <div className={`text-[10px] uppercase tracking-wider mt-0.5 ${
                activeWordIndex === idx ? 'text-indigo-200' : 'text-slate-400'
              }`}>
                {item.partOfSpeech}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Word Detail Card */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/15 px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                {currentWord.partOfSpeech}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentWord.phonetic}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              {currentWord.word}
            </h1>
          </div>

          <button
            onClick={handleSpeakWord}
            disabled={isPlayingAudio}
            className="p-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center"
            title="Pronounce word"
          >
            <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse text-amber-300' : ''}`} />
          </button>
        </div>

        {/* Syllable Audio Chips */}
        <div className="mt-4 pt-3 border-t border-slate-700/60">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Tap Syllables to Hear Phonetic Chunks:
          </div>
          <div className="flex flex-wrap gap-2">
            {currentWord.syllables.map((syl, i) => (
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

      {/* Meaning & Morpheme Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Definition */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Definition in Plain English</span>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed mt-1">
            {currentWord.definition}
          </p>
          <div className="mt-3 pt-2 border-t border-slate-700/50">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Example: </span>
            <span className="text-xs text-slate-300 italic">"{currentWord.exampleSentence}"</span>
          </div>
        </div>

        {/* Morphology Anatomy */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Morpheme Decomposition</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {currentWord.morphemes.prefix && (
              <div className="flex items-start justify-between bg-slate-900/60 px-2.5 py-1 rounded-lg">
                <span className="font-semibold text-purple-300">Prefix:</span>
                <span className="text-slate-300 font-mono">{currentWord.morphemes.prefix}</span>
              </div>
            )}
            <div className="flex items-start justify-between bg-slate-900/60 px-2.5 py-1 rounded-lg">
              <span className="font-semibold text-purple-300">Root:</span>
              <span className="text-slate-300 font-mono">{currentWord.morphemes.root}</span>
            </div>
            {currentWord.morphemes.suffix && (
              <div className="flex items-start justify-between bg-slate-900/60 px-2.5 py-1 rounded-lg">
                <span className="font-semibold text-purple-300">Suffix:</span>
                <span className="text-slate-300 font-mono">{currentWord.morphemes.suffix}</span>
              </div>
            )}
            <div className="mt-2 text-[11px] text-purple-200/90 italic bg-purple-950/30 p-2 rounded-lg border border-purple-800/40">
              <span className="font-bold">Core Meaning: </span>
              {currentWord.morphemes.meaning}
            </div>
          </div>
        </div>
      </div>

      {/* Orthographic Rule Card */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Lightbulb className="w-4 h-4" />
          <span>Orthographic Spelling Rule: {currentWord.orthographicRule.title}</span>
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed mt-1">
          {currentWord.orthographicRule.explanation}
        </p>
        <div className="mt-2 text-[11px] text-amber-300/80 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-500/20">
          <span className="font-bold">Pattern Examples: </span>
          {currentWord.orthographicRule.example}
        </div>
      </div>

      {/* Advance to Next Word or Immersion */}
      <div className="flex gap-2 pt-2">
        {activeWordIndex < targetWords.length - 1 ? (
          <button
            onClick={() => {
              HapticFeedback.light();
              TTSEngine.stop();
              setActiveWordIndex(activeWordIndex + 1);
            }}
            className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <span>Examine Next Word ({activeWordIndex + 2}/{targetWords.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              HapticFeedback.success();
              TTSEngine.stop();
              onComplete();
            }}
            className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <span>All Words Prepared! Continue to Immersion Reading</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
