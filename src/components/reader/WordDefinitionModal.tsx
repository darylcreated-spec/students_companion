import React, { useState } from 'react';
import { X, Volume2, Sparkles, Highlighter, BookOpen, Check, ExternalLink } from 'lucide-react';
import { WordDefinition, HighlightColor } from '../../types';
import { DictionaryService } from '../../services/education/dictionaryService';

interface WordDefinitionModalProps {
  definition: WordDefinition | null;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onStartReading?: () => void;
  onHighlightWord?: (color: HighlightColor) => void;
}

export const WordDefinitionModal: React.FC<WordDefinitionModalProps> = ({
  definition,
  isLoading = false,
  error = null,
  onClose,
  onStartReading,
  onHighlightWord
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('amber');
  const [highlightAdded, setHighlightAdded] = useState(false);

  if (!definition && !isLoading && !error) return null;

  const handleSpeak = () => {
    if (!definition) return;
    setIsSpeaking(true);
    DictionaryService.speakDefinition(definition);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  const handleApplyHighlight = (color: HighlightColor) => {
    setSelectedColor(color);
    if (onHighlightWord) {
      onHighlightWord(color);
      setHighlightAdded(true);
      setTimeout(() => setHighlightAdded(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-slate-900 border border-slate-750 sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 text-slate-100 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Dictionary & Context Lookup
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Looking up definition...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="py-8 text-center space-y-3">
            <p className="text-red-400 text-sm font-medium">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Definition Content */}
        {!isLoading && definition && (
          <div className="space-y-4 pt-4">
            {/* Word Header */}
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-bold text-white capitalize tracking-tight">
                  {definition.word}
                </h3>
                {definition.phonetic && (
                  <span className="text-sm font-mono text-indigo-300/80 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                    {definition.phonetic}
                  </span>
                )}
                {definition.partOfSpeech && (
                  <span className="text-xs font-medium italic text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                    {definition.partOfSpeech}
                  </span>
                )}
              </div>

              {/* Pronounce Button */}
              <button
                onClick={handleSpeak}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSpeaking
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-95'
                    : 'bg-indigo-950 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60'
                }`}
                title="Pronounce Word"
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
                <span>Listen</span>
              </button>
            </div>

            {/* Meaning Box */}
            <div className="bg-slate-800/60 border border-slate-750/70 rounded-xl p-4 space-y-2">
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {definition.definition}
              </p>
              {definition.example && (
                <div className="pt-2 border-t border-slate-700/40">
                  <p className="text-xs text-slate-400 italic">
                    <span className="font-semibold not-italic text-slate-500 mr-1">Example:</span>
                    "{definition.example}"
                  </p>
                </div>
              )}
            </div>

            {/* Synonyms */}
            {definition.synonyms && definition.synonyms.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-400">Related Synonyms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {definition.synonyms.map((syn, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Journey Highlight & Action Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Highlighter className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-300">Highlight for Journey:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['amber', 'cyan', 'emerald', 'purple'] as HighlightColor[]).map((c) => {
                    const colorMap = {
                      amber: 'bg-amber-400 border-amber-300',
                      cyan: 'bg-cyan-400 border-cyan-300',
                      emerald: 'bg-emerald-400 border-emerald-300',
                      purple: 'bg-purple-400 border-purple-300',
                    };
                    return (
                      <button
                        key={c}
                        onClick={() => handleApplyHighlight(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                          colorMap[c]
                        } ${selectedColor === c && highlightAdded ? 'scale-110 ring-2 ring-white' : ''}`}
                        title={`Highlight with ${c}`}
                      >
                        {selectedColor === c && highlightAdded && (
                          <Check className="w-3 h-3 text-slate-900 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {highlightAdded && (
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Added to your Journey Audio highlights!</span>
                </div>
              )}

              {/* Start reading button */}
              {onStartReading && (
                <button
                  onClick={() => {
                    onStartReading();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm shadow-md shadow-indigo-900/30 transition-all active:scale-98"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Start Reading Lecture from This Point</span>
                </button>
              )}
            </div>

            {/* Source attribution */}
            <div className="text-right">
              <span className="text-[10px] text-slate-500">
                Source: {definition.source || 'Companion Lexicon'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
