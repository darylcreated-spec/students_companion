import React, { useEffect, useState } from 'react';
import { Mail, Headphones } from 'lucide-react';

interface LoadingScreenProps {
  onLoaded?: () => void;
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoaded,
  minDurationMs = 1200,
}) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [initStep, setInitStep] = useState('Initializing audio vault...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setInitStep('Loading offline lectures...');
    }, 400);

    const t2 = setTimeout(() => {
      setInitStep('Ready for commute.');
      setFadeOut(true);
    }, minDurationMs - 300);

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#0A0F1D] text-slate-100 transition-opacity duration-400 select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Status */}
      <div className="w-full flex justify-center pt-8">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>System Initialized</span>
        </div>
      </div>

      {/* Center Hero Icon & Title */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
        {/* Branded Owl Icon Container */}
        <div className="w-24 h-24 rounded-3xl overflow-hidden border border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.35)] bg-[#070B14]">
          <img
            src="/icon-192.png"
            alt="The Student's Companion"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight font-sora">
            The Student's Companion
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-mono">
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
