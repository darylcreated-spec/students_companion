import React from 'react';
import { Volume2, Sparkles, Settings } from 'lucide-react';

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
            <p className="text-[10px] text-slate-400 font-mono">
              Offline Audio Vault Active
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
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
