import React, { useState } from 'react';
import { X, Key, Sparkles, Volume2, ShieldCheck, Check, Info } from 'lucide-react';
import { AppSettings } from '../../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [googleTtsKey, setGoogleTtsKey] = useState(settings.googleCloudTtsKey || '');
  const [autoResume, setAutoResume] = useState(settings.autoResumeAfterNote);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    localStorage.setItem('GOOGLE_TTS_KEY', googleTtsKey.trim());

    onSaveSettings({
      ...settings,
      geminiApiKey: apiKey.trim(),
      googleCloudTtsKey: googleTtsKey.trim(),
      autoResumeAfterNote: autoResume,
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1426] border border-cyan-400/40 shadow-2xl p-5 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">AI & Audio Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gemini Key Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1">
              <Key className="w-3 h-3" /> GEMINI API KEY
            </label>
            <span className="text-[9px] font-mono text-slate-400">Optional</span>
          </div>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
          />
          <p className="text-[10px] text-slate-400 font-mono">
            Powers Gemini 2.5 Flash for conversational radio-rewrites and smart note categorization. (App runs offline with local fallbacks if empty).
          </p>
        </div>

        {/* Google Cloud TTS Key */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> GOOGLE CLOUD TTS KEY
            </label>
            <span className="text-[9px] font-mono text-slate-400">Optional</span>
          </div>
          <input
            type="password"
            placeholder="Cloud TTS REST API Key"
            value={googleTtsKey}
            onChange={(e) => setGoogleTtsKey(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
          />
          <p className="text-[10px] text-slate-400 font-mono">
            If provided, uses Journey Neural voice; otherwise uses zero-latency browser Web Speech synthesis.
          </p>
        </div>

        {/* Commute Preferences */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="text-[11px] font-mono text-slate-300 font-bold">
            COMMUTE PLAYBACK PREFERENCES
          </label>
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span className="text-xs text-slate-200">
              Auto-Resume Audio After Dictating Note
            </span>
            <input
              type="checkbox"
              checked={autoResume}
              onChange={(e) => setAutoResume(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:brightness-110 active:scale-98 transition-all"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <span>Save Configuration</span>
          )}
        </button>
      </div>
    </div>
  );
};
