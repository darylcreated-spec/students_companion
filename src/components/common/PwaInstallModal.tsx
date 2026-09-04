import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle,
  ShieldCheck,
  Zap,
  MoreVertical,
  Layers,
  Info
} from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isSecureContext?: boolean;
  onInstall: () => Promise<boolean>;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isAndroid,
  isInstallable,
  isInstalled,
  isSecureContext = true,
  onInstall,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'ios' | 'android'>(() => (isIOS ? 'ios' : 'android'));
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [installErrorMsg, setInstallErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNativeInstallClick = async () => {
    setInstallErrorMsg(null);
    if (!isInstallable) {
      // Direct prompt not available yet — show the exact browser menu steps!
      setShowManualGuide(true);
      return;
    }

    try {
      const accepted = await onInstall();
      if (accepted) {
        onClose();
      } else {
        // User dismissed or prompt didn't show
        setShowManualGuide(true);
      }
    } catch (err: any) {
      console.warn('Install trigger error:', err);
      setShowManualGuide(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B14]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1426] border border-cyan-400/40 shadow-2xl p-5 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Install to Home Screen</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Full Offline Mobile App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. If Already Installed */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/40 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-100">App Already Installed!</h4>
            <p className="text-xs text-slate-300 font-sora">
              You are currently running the offline Progressive Web App directly on your device.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 1-Tap Install Button if Browser Prompt is Ready */}
            {isInstallable && !showManualGuide && (
              <div className="space-y-2">
                <p className="text-xs text-slate-300 font-sora leading-relaxed">
                  Tap below to add <strong>The Student's Companion</strong> directly to your phone's home screen:
                </p>
                <button
                  onClick={handleNativeInstallClick}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-[#0A0F1D] font-bold text-xs flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:brightness-110 active:scale-98 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now (1-Tap)</span>
                </button>
              </div>
            )}

            {/* Insecure Network Warning if applicable */}
            {!isSecureContext && (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-400/30 flex items-start space-x-2 text-[11px] text-amber-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Local Wi-Fi IP detected. Use your browser's menu (<strong>⋮</strong> or <strong>Share</strong>) to add this app to your home screen.
                </p>
              </div>
            )}

            {/* Device Instructions Selector (iPhone vs Android) */}
            {(!isInstallable || showManualGuide) && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex rounded-xl bg-slate-900 p-1 border border-white/5 text-xs font-mono">
                  <button
                    onClick={() => setActiveGuideTab('android')}
                    className={`flex-1 py-1.5 rounded-lg transition-all font-bold ${
                      activeGuideTab === 'android'
                        ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🤖 Android / Chrome
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('ios')}
                    className={`flex-1 py-1.5 rounded-lg transition-all font-bold ${
                      activeGuideTab === 'ios'
                        ? 'bg-cyan-400 text-obsidian-950 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🍎 iPhone / iPad
                  </button>
                </div>

                {/* Android Steps */}
                {activeGuideTab === 'android' && (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-400/30 space-y-2.5">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>How to Install on Android Phone:</span>
                    </h4>

                    <div className="space-y-2.5 text-xs text-slate-200 font-sora">
                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <p>
                          Tap the <strong>Three Dots Menu</strong> (<MoreVertical className="w-3.5 h-3.5 inline text-cyan-400" />) at the top-right corner of your browser.
                        </p>
                      </div>

                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <p>
                          Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                        </p>
                      </div>

                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <p>
                          Tap <strong>"Install"</strong>. The Companion icon will appear in your apps list and home screen!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* iOS Safari Steps */}
                {activeGuideTab === 'ios' && (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-400/30 space-y-2.5">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>How to Install on iPhone / iPad:</span>
                    </h4>

                    <div className="space-y-2.5 text-xs text-slate-200 font-sora">
                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <p>
                          Tap the <strong>Share button</strong> (<Share2 className="w-3.5 h-3.5 inline text-cyan-400" />) at the bottom of Safari.
                        </p>
                      </div>

                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <p>
                          Scroll down and tap <strong>"Add to Home Screen"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-cyan-400" />).
                        </p>
                      </div>

                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <p>
                          Tap <strong>"Add"</strong> at the top right to install Companion on your home screen!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PWA Perks */}
        <div className="pt-2 border-t border-white/5 space-y-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Works 100% offline without internet</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Fast native loading with no browser URL bar</span>
          </div>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Instant 1-tap launch from your phone home screen</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs hover:bg-slate-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
