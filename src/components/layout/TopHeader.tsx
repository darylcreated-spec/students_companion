import React from 'react';
import { Wifi, Sparkles, Settings, Volume2 } from 'lucide-react';

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title = "The Student's Companion",
  subtitle,
  hasApiKey,
  onOpenSettings,
}) => {
  return (
    <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/5 bg-[#0A0F1D]/80 backdrop-blur-md z-30">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/5 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
          <Volume2 className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-[11px] text-cyan-400 font-mono tracking-wide truncate max-w-[190px]">
              {subtitle}
            </p>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>OFFLINE READY</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Gemini AI Status Badge */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all ${
            hasApiKey
              ? 'bg-cyan-950/60 border-cyan-400/40 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{hasApiKey ? 'AI FLASH' : 'LOCAL'}</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
