import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  BookOpen,
  Play,
  ZoomIn,
  ZoomOut,
  MousePointerClick,
  Highlighter,
  BookMarked,
  Search,
  Check,
  X,
  Type,
  Sun,
  Moon,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { TextHighlight, HighlightColor, EReaderTheme } from '../../types';
import { HapticFeedback } from '../../services/device/deviceDetector';

interface LiveReadingWindowProps {
  title: string;
  content: string;
  isPlaying: boolean;
  isPaused: boolean;
  progress: number; // 0 to 1
  currentTime: number;
  duration: number;
  onSentenceClick?: (sentenceIndex: number, totalSentences: number, sentenceText: string) => void;
  onOpenChapterPicker?: () => void;
  fillHeight?: boolean;
  // E-Book Reader & Journey Highlights Props
  highlights?: TextHighlight[];
  onToggleHighlight?: (sentenceIndex: number, sentenceText: string, color: HighlightColor) => void;
  onOpenDictionary?: (word: string) => void;
  initialViewMode?: 'teleprompter' | 'ebook';
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const LiveReadingWindow: React.FC<LiveReadingWindowProps> = ({
  title,
  content,
  isPlaying,
  isPaused,
  progress,
  currentTime,
  duration,
  onSentenceClick,
  onOpenChapterPicker,
  fillHeight = false,
  highlights = [],
  onToggleHighlight,
  onOpenDictionary,
  initialViewMode = 'ebook',
  isFocusMode = false,
  onToggleFocusMode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'teleprompter' | 'ebook'>(initialViewMode);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');
  const [eBookTheme, setEBookTheme] = useState<EReaderTheme>('dark');
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [quickSearchWord, setQuickSearchWord] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Split content into sentences
  const sentences = useMemo(() => {
    if (!content) return [];
    return content
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [content]);

  const activeIndex = Math.min(
    sentences.length - 1,
    Math.max(0, Math.floor(progress * (sentences.length || 1)))
  );

  // Auto-scroll to active sentence when playing in teleprompter mode
  useEffect(() => {
    if (isPlaying && !isPaused && containerRef.current && viewMode === 'teleprompter') {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex, isPlaying, isPaused, viewMode]);

  // Check if a sentence is highlighted
  const getSentenceHighlight = (index: number): TextHighlight | undefined => {
    return highlights.find((h) => h.sentenceIndex === index);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-xs leading-relaxed';
      case 'lg':
        return 'text-base sm:text-lg leading-loose';
      case 'md':
      default:
        return 'text-sm sm:text-base leading-relaxed';
    }
  };

  const getThemeContainerClass = () => {
    if (viewMode === 'teleprompter') {
      return 'bg-[#0E1426]/95 border-cyan-400/25 text-slate-100';
    }
    switch (eBookTheme) {
      case 'oled':
        return 'bg-black border-slate-800 text-slate-200';
      case 'sepia':
        return 'bg-[#FBF0D9] border-[#E2D5B5] text-[#3E3126] selection:bg-[#EBD5B3]';
      case 'dark':
      default:
        return 'bg-[#111827] border-slate-750 text-slate-100';
    }
  };

  const getHighlightClass = (color?: HighlightColor) => {
    switch (color) {
      case 'amber':
        return eBookTheme === 'sepia'
          ? 'bg-amber-300/40 text-[#402B00] border-l-4 border-amber-500 pl-2 font-medium'
          : 'bg-amber-400/20 text-amber-200 border-l-4 border-amber-400 pl-2 font-medium';
      case 'cyan':
        return eBookTheme === 'sepia'
          ? 'bg-cyan-300/40 text-[#003844] border-l-4 border-cyan-600 pl-2 font-medium'
          : 'bg-cyan-400/20 text-cyan-200 border-l-4 border-cyan-400 pl-2 font-medium';
      case 'emerald':
        return eBookTheme === 'sepia'
          ? 'bg-emerald-300/40 text-[#053B18] border-l-4 border-emerald-600 pl-2 font-medium'
          : 'bg-emerald-400/20 text-emerald-200 border-l-4 border-emerald-400 pl-2 font-medium';
      case 'purple':
        return eBookTheme === 'sepia'
          ? 'bg-purple-300/40 text-[#300A52] border-l-4 border-purple-600 pl-2 font-medium'
          : 'bg-purple-400/20 text-purple-200 border-l-4 border-purple-400 pl-2 font-medium';
      default:
        return '';
    }
  };

  const handleSentenceClick = (idx: number, sentenceText: string) => {
    HapticFeedback.trigger('light');
    setActiveSentenceIndex((prev) => (prev === idx ? null : idx));
  };

  const handleStartReadingHere = (idx: number, sentenceText: string) => {
    HapticFeedback.trigger('medium');
    setActiveSentenceIndex(null);
    onSentenceClick?.(idx, sentences.length, sentenceText);
  };

  const handleHighlight = (idx: number, sentenceText: string, color: HighlightColor) => {
    HapticFeedback.trigger('success');
    onToggleHighlight?.(idx, sentenceText, color);
  };

  const handleDefineSentence = (sentenceText: string) => {
    HapticFeedback.trigger('light');
    setActiveSentenceIndex(null);
    // Find the first notable word (> 3 chars) or let user type
    const words = sentenceText.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    const wordToLookup = words[0] || sentenceText.slice(0, 15);
    onOpenDictionary?.(wordToLookup);
  };

  const handleQuickWordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearchWord.trim()) return;
    HapticFeedback.trigger('light');
    onOpenDictionary?.(quickSearchWord.trim());
    setQuickSearchWord('');
    setIsSearchOpen(false);
  };

  return (
    <div
      className={`w-full rounded-2xl border shadow-xl backdrop-blur-xl flex flex-col overflow-hidden transition-colors ${getThemeContainerClass()} ${
        fillHeight ? 'flex-1 min-h-0' : ''
      }`}
    >
      {/* Reader Mode Bar (Responsive horizontally scrollable on mobile) */}
      <div
        className={`px-2.5 sm:px-4 py-2 flex items-center justify-between border-b text-xs shrink-0 overflow-x-auto no-scrollbar gap-2 ${
          eBookTheme === 'sepia'
            ? 'bg-[#F2E6C8] border-[#DECBA6] text-[#4A3D2F]'
            : 'bg-slate-900/90 border-white/5 text-slate-300'
        }`}
      >
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Toggle View Mode: E-Book vs Teleprompter */}
          <div className="flex items-center rounded-lg bg-black/25 p-0.5 border border-white/10 text-[11px] font-mono">
            <button
              onClick={() => {
                HapticFeedback.trigger('light');
                setViewMode('ebook');
              }}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'ebook'
                  ? 'bg-cyan-500 text-obsidian-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>E-Book</span>
            </button>
            <button
              onClick={() => {
                HapticFeedback.trigger('light');
                setViewMode('teleprompter');
              }}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'teleprompter'
                  ? 'bg-cyan-500 text-obsidian-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Teleprompter</span>
            </button>
          </div>

          {isPlaying && !isPaused && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-1" />
          )}
        </div>

        {/* E-Reader Customization Tools */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Quick Dictionary Search Button */}
          {onOpenDictionary && (
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSearchOpen
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : eBookTheme === 'sepia'
                  ? 'bg-[#EBD5B3] hover:bg-[#DFC6A0] text-[#3E3126] border-[#D0B891]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Lookup Word Meaning"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Chapters Picker */}
          {onOpenChapterPicker && (
            <button
              id="chapters-picker-btn"
              onClick={onOpenChapterPicker}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition-colors ${
                eBookTheme === 'sepia'
                  ? 'bg-[#EBD5B3] hover:bg-[#DFC6A0] text-[#3E3126] border-[#D0B891]'
                  : 'bg-slate-800 hover:bg-cyan-950 text-cyan-300 border-cyan-400/30'
              }`}
            >
              <span>Chapters</span>
            </button>
          )}

          {/* Typography Controls */}
          {viewMode === 'ebook' && (
            <div className="flex items-center space-x-1">
              {/* Serif / Sans Toggle */}
              <button
                onClick={() => setFontFamily(f => (f === 'sans' ? 'serif' : 'sans'))}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                  fontFamily === 'serif'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-400/40 font-serif'
                    : 'bg-slate-800 text-slate-300 border-slate-700 font-sans'
                }`}
                title="Toggle Serif / Sans Font"
              >
                {fontFamily === 'serif' ? 'Serif' : 'Sans'}
              </button>

              {/* Theme Toggle (Dark / Sepia / OLED) */}
              <button
                onClick={() => {
                  setEBookTheme(t => (t === 'dark' ? 'sepia' : t === 'sepia' ? 'oled' : 'dark'));
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize"
                title="Cycle Theme (Dark, Sepia, OLED)"
              >
                {eBookTheme}
              </button>
            </div>
          )}

          {/* Font Zoom Controls */}
          <div className="flex items-center space-x-0.5">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                fontSize === 'sm'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                fontSize === 'md'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                fontSize === 'lg'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              A+
            </button>
          </div>

          {/* Fullscreen Focus Mode Toggle */}
          {onToggleFocusMode && (
            <button
              onClick={() => {
                HapticFeedback.trigger('light');
                onToggleFocusMode();
              }}
              className={`p-1 rounded text-[10px] font-bold border transition-colors ${
                isFocusMode
                  ? 'bg-cyan-400 text-obsidian-950 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isFocusMode ? 'Exit Focus Mode' : 'Focus Mode (Maximize Reading Viewport)'}
            >
              {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Quick Word Lookup Bar (Expandable) */}
      {isSearchOpen && (
        <form
          onSubmit={handleQuickWordSearch}
          className="px-4 py-2 bg-slate-900 border-b border-indigo-500/30 flex items-center gap-2 animate-in slide-in-from-top-1 shrink-0"
        >
          <Search className="w-4 h-4 text-indigo-400" />
          <input
            type="text"
            value={quickSearchWord}
            onChange={(e) => setQuickSearchWord(e.target.value)}
            placeholder="Type any word from lecture to get meaning..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Lookup
          </button>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Reading Text Body */}
      <div
        ref={containerRef}
        className={`p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-2.5 ${getFontSizeClass()} ${
          fontFamily === 'serif' ? 'font-serif' : 'font-sora'
        } ${fillHeight ? 'flex-1 min-h-0' : 'max-h-[220px] sm:max-h-[340px]'}`}
      >
        {sentences.length > 0 ? (
          sentences.map((sentence, idx) => {
            const isCurrent = idx === activeIndex && isPlaying && !isPaused;
            const isRead = idx < activeIndex;
            const isSelected = activeSentenceIndex === idx;
            const hl = getSentenceHighlight(idx);

            return (
              <div key={idx} className="relative group">
                <p
                  data-active={isCurrent}
                  onClick={() => handleSentenceClick(idx, sentence)}
                  onDoubleClick={() => {
                    // Double click word definition lookup
                    const selected = window.getSelection()?.toString().trim();
                    if (selected && onOpenDictionary) {
                      onOpenDictionary(selected);
                    }
                  }}
                  title="Tap for reader actions: Start Reading, Highlight for Journey, or Define Word"
                  className={`transition-all duration-150 rounded-xl p-2 cursor-pointer relative ${
                    hl ? getHighlightClass(hl.color) : ''
                  } ${
                    isCurrent
                      ? 'text-cyan-300 bg-cyan-950/70 border-l-4 border-cyan-400 font-medium shadow-[0_0_15px_rgba(34,211,238,0.2)] pl-3'
                      : isSelected
                      ? 'bg-slate-800/90 ring-1 ring-cyan-400/50 rounded-xl'
                      : isRead
                      ? eBookTheme === 'sepia'
                        ? 'text-[#5C4D3E]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      : eBookTheme === 'sepia'
                      ? 'text-[#3E3126]'
                      : 'text-slate-200 hover:text-cyan-200 hover:bg-slate-900/60'
                  }`}
                >
                  {sentence}

                  {/* Highlight pill badge if highlighted */}
                  {hl && (
                    <span className="inline-flex items-center ml-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase bg-black/40 text-white/90 border border-white/20">
                      Journey
                    </span>
                  )}
                </p>

                {/* Interactive Action Toolbar on sentence tap */}
                {isSelected && (
                  <div className="my-1 p-2 rounded-xl bg-slate-900 border border-cyan-400/40 shadow-xl flex items-center justify-between flex-wrap gap-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-2">
                      {/* 1. Start Reading Here */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartReadingHere(idx, sentence);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 text-xs font-bold font-mono transition-transform active:scale-95 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start Reading</span>
                      </button>

                      {/* 2. Define Word */}
                      {onOpenDictionary && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDefineSentence(sentence);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 text-xs font-medium transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Define</span>
                        </button>
                      )}
                    </div>

                    {/* 3. Highlight for Journey Colors */}
                    {onToggleHighlight && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                          <Highlighter className="w-3 h-3 text-amber-400" />
                          <span>Highlight:</span>
                        </span>
                        {(['amber', 'cyan', 'emerald', 'purple'] as HighlightColor[]).map((c) => {
                          const bgMap = {
                            amber: 'bg-amber-400',
                            cyan: 'bg-cyan-400',
                            emerald: 'bg-emerald-400',
                            purple: 'bg-purple-400',
                          };
                          const isColorActive = hl?.color === c;
                          return (
                            <button
                              key={c}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHighlight(idx, sentence, c);
                              }}
                              className={`w-5 h-5 rounded-full ${bgMap[c]} transition-transform hover:scale-125 flex items-center justify-center ${
                                isColorActive ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                              }`}
                              title={`Highlight with ${c} for Journey`}
                            >
                              {isColorActive && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400 italic">
            {content || 'Audio content text will appear here as it is read.'}
          </p>
        )}
      </div>

      {/* Footer Instructions & Status */}
      <div
        className={`px-4 py-1.5 border-t flex items-center justify-between text-[10px] font-mono shrink-0 ${
          eBookTheme === 'sepia'
            ? 'bg-[#F2E6C8] border-[#DECBA6] text-[#6A5A4A]'
            : 'bg-slate-950/70 border-white/5 text-slate-400'
        }`}
      >
        <span className="flex items-center gap-1">
          <MousePointerClick className="w-3 h-3 text-cyan-400" />
          <span>Tap sentence to Start Reading, Highlight, or Define</span>
        </span>
        <span className="text-cyan-400 font-semibold">
          {Math.round(progress * 100)}% Complete
        </span>
      </div>
    </div>
  );
};
