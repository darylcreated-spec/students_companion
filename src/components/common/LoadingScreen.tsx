import React, { useEffect, useState } from 'react';
import { Mail, Headphones } from 'lucide-react';

interface LoadingScreenProps {
  onLoaded?: () => void;
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoaded,
  minDurationMs = 1500,
}) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [initStep, setInitStep] = useState('Initializing audio engine...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setInitStep('Loading offline lectures...');
    }, 500);

    const t2 = setTimeout(() => {
      setInitStep('Ready for commute.');
      setFadeOut(true);
    }, minDurationMs - 350);

    const t3 = setTimeout(() => {
      onLoaded?.();
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [minDurationMs, onLoaded]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#0A0F1D] text-slate-100 transition-opacity duration-500 select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Status */}
      <div className="w-full flex justify-center pt-8">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>System Initialized</span>
        </div>
      </div>

      {/* Center Hero Icon & Title */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
        {/* Clean Glass Icon Container (No spindles or rotating rings) */}
        <div className="w-24 h-24 rounded-3xl bg-[#0E1426] border border-cyan-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.25)]">
          <Headphones className="w-12 h-12 text-cyan-400" />
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            The Student's Companion
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Hands-Free Commute Audio & Real-Time Notes
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-cyan-300 rounded-full animate-pulse w-full"></div>
          </div>
          <p className="text-[11px] font-mono text-cyan-400 tracking-wide">
            {initStep}
          </p>
        </div>
      </div>

      {/* Footer displaying Requested Email */}
      <div className="w-full flex flex-col items-center space-y-1.5 pb-4">
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/5 text-slate-400 text-xs font-mono">
          <Mail className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-200">daryl.created@gmail.com</span>
        </div>
        <p className="text-[10px] text-slate-600 font-mono tracking-wider">
          VERSION 1.0 • PWA OFFLINE ACTIVE
        </p>
      </div>
    </div>
  );
};
