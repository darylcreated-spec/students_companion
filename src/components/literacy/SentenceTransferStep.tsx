import React, { useState } from 'react';
import { TargetWordDetail, SentenceEvaluationResult } from '../../types';
import { SentenceEvaluator } from '../../services/ai/sentenceEvaluator';
import { SRSEngine } from '../../services/education/srsEngine';
import { HapticFeedback } from '../../services/device/deviceDetector';
import {
  PenTool,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Trophy,
  Award,
  BookOpen
} from 'lucide-react';

interface SentenceTransferStepProps {
  targetWords: TargetWordDetail[];
  onComplete: () => void;
}

export const SentenceTransferStep: React.FC<SentenceTransferStepProps> = ({
  targetWords,
  onComplete
}) => {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [sentenceInput, setSentenceInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<SentenceEvaluationResult | null>(null);
  const [completedWordIndices, setCompletedWordIndices] = useState<number[]>([]);

  const currentWord = targetWords[currentWordIdx] || targetWords[0];

  const handleEvaluateSentence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sentenceInput.trim() || isEvaluating) return;

    HapticFeedback.light();
    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const result = await SentenceEvaluator.evaluateSentence(sentenceInput, currentWord);
      setEvaluationResult(result);

      if (result.isValid) {
        HapticFeedback.success();
        // Record SM-2 Spaced Repetition card update
        const performance = SRSEngine.calculatePerformanceScore(0, result.score);
        await SRSEngine.recordWordReview(currentWord.word, performance);

        if (!completedWordIndices.includes(currentWordIdx)) {
          setCompletedWordIndices([...completedWordIndices, currentWordIdx]);
        }
      } else {
        HapticFeedback.warning();
      }
    } catch (err) {
      console.error('Error evaluating sentence:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextWord = () => {
    HapticFeedback.light();
    if (currentWordIdx < targetWords.length - 1) {
      setCurrentWordIdx(currentWordIdx + 1);
      setSentenceInput('');
      setEvaluationResult(null);
    } else {
      HapticFeedback.success();
      onComplete();
    }
  };

  const allWordsCompleted = completedWordIndices.length === targetWords.length;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Step Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <PenTool className="w-4 h-4" />
            <span>Step 4: Active Recall & Transfer (Mastery)</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold">
            {completedWordIndices.length}/{targetWords.length} Words Validated
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Write an original sentence demonstrating authentic contextual understanding of the target word. Our AI literacy validator will evaluate syntax, meaning, and tone.
        </p>

        {/* Word Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
          {targetWords.map((w, idx) => {
            const isDone = completedWordIndices.includes(idx);
            const isCurrent = currentWordIdx === idx;

            return (
              <button
                key={idx}
                onClick={() => {
                  HapticFeedback.light();
                  setCurrentWordIdx(idx);
                  setSentenceInput('');
                  setEvaluationResult(null);
                }}
                className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-md'
                    : isDone
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700'
                }`}
              >
                <span className="truncate">{w.word}</span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Word Card */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
              {currentWord.partOfSpeech}
            </span>
            <span className="text-xs text-slate-400 font-mono">{currentWord.phonetic}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Write with: <span className="text-emerald-400">"{currentWord.word}"</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Definition: {currentWord.definition}
          </p>
        </div>

        {/* Interactive Writing Area */}
        <form onSubmit={handleEvaluateSentence} className="space-y-3 pt-2">
          <textarea
            rows={3}
            value={sentenceInput}
            onChange={(e) => setSentenceInput(e.target.value)}
            placeholder={`Draft an original sentence incorporating "${currentWord.word}" in a meaningful context...`}
            className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 text-white rounded-xl p-3.5 text-sm leading-relaxed focus:outline-none transition-all placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={!sentenceInput.trim() || isEvaluating}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm"
          >
            {isEvaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating with AI...</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                <span>Validate Sentence with AI</span>
              </>
            )}
          </button>
        </form>

        {/* AI Evaluation Feedback Card */}
        {evaluationResult && (
          <div
            className={`p-4 rounded-xl border transition-all animate-fadeIn space-y-2.5 ${
              evaluationResult.isValid
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {evaluationResult.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
                <span className="text-sm font-bold">
                  {evaluationResult.isValid ? 'Mastery Verified!' : 'Revision Recommended'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900/80 border border-current">
                Score: {evaluationResult.score}/100
              </span>
            </div>

            <div className="text-xs space-y-1.5 pt-1">
              <div>
                <span className="font-bold text-slate-100">Syntax & Grammar: </span>
                <span>{evaluationResult.syntaxFeedback}</span>
              </div>
              <div>
                <span className="font-bold text-slate-100">Semantic Nuance: </span>
                <span>{evaluationResult.semanticFeedback}</span>
              </div>
              {evaluationResult.suggestedImprovement && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 text-[11px] text-emerald-300/90 italic">
                  <span className="font-bold">Tip to Elevate Writing: </span>
                  {evaluationResult.suggestedImprovement}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Word / Finish Button */}
        {evaluationResult?.isValid && (
          <button
            onClick={handleNextWord}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm mt-3 animate-fadeIn"
          >
            <span>{currentWordIdx < targetWords.length - 1 ? 'Save & Proceed to Next Word' : 'Complete All Transfer Sentences'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Completion Banner */}
      {allWordsCompleted && (
        <div className="p-5 bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 border border-emerald-500/50 rounded-2xl text-center space-y-3 animate-scaleIn shadow-2xl">
          <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-white">Full 4-Step Learning Loop Complete!</h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            You primed the vocabulary, immersed in a high-Lexile passage, mapped the phonemes, and demonstrated authentic generative mastery. All words scheduled in SM-2 spaced repetition.
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all inline-flex items-center space-x-2"
          >
            <span>Finish Daily Session & View Analytics</span>
            <Award className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
