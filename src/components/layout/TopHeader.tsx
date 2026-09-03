import React from 'react';
import { Volume2, Settings, Download } from 'lucide-react';

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  hasApiKey: boolean;
  onOpenSettings: () => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title = "The Student's Companion",
  subtitle,
  hasApiKey,
  onOpenSettings,
  onOpenInstall,
  isInstalled = false,
}) => {
  return (
    <header className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-white/5 bg-[#0A0F1D]/80 backdrop-blur-md z-30">
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/5 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)] shrink-0">
          <Volume2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-100 tracking-tight truncate">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-[11px] text-cyan-400 font-mono tracking-wide truncate max-w-[170px] sm:max-w-[220px]">
              {subtitle}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 font-mono">
              Offline Audio Vault Active
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {/* Install PWA Button (Visible in browser when not installed yet) */}
        {!isInstalled && onOpenInstall && (
          <button
            onClick={onOpenInstall}
            aria-label="Install App"
            title="Install App to Home Screen"
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900 flex items-center space-x-1 text-[11px] font-mono transition-all active:scale-95 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        )}

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
