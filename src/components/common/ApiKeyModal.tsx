import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Volume2, Check, Save, Play, Sliders, Mic } from 'lucide-react';
import { AppSettings } from '../../types';
import { TTSEngine } from '../../services/audio/ttsEngine';

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
  const [selectedVoice, setSelectedVoice] = useState(settings.selectedVoiceURI || '');
  const [cloudVoice, setCloudVoice] = useState(settings.cloudVoiceName || 'en-US-Journey-F');
  const [pitch, setPitch] = useState(settings.speechPitch || 1.0);
  const [autoResume, setAutoResume] = useState(settings.autoResumeAfterNote);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saved, setSaved] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const voices = TTSEngine.getAvailableVoices();
      setAvailableVoices(voices);

      if (!selectedVoice && voices.length > 0) {
        const defaultV =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('Daniel'))
          ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

        if (defaultV) {
          setSelectedVoice(defaultV.voiceURI || defaultV.name);
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  if (!isOpen) return null;

  const handlePreview = () => {
    setIsPreviewing(true);
    TTSEngine.previewVoice(selectedVoice, pitch);
    setTimeout(() => setIsPreviewing(false), 3000);
  };

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    localStorage.setItem('GOOGLE_TTS_KEY', googleTtsKey.trim());
    localStorage.setItem('SELECTED_VOICE_URI', selectedVoice);
    localStorage.setItem('CLOUD_VOICE_NAME', cloudVoice);

    onSaveSettings({
      ...settings,
      geminiApiKey: apiKey.trim(),
      googleCloudTtsKey: googleTtsKey.trim(),
      selectedVoiceURI: selectedVoice,
      cloudVoiceName: cloudVoice,
      speechPitch: pitch,
      autoResumeAfterNote: autoResume,
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const cloudVoices = [
    { id: 'en-US-Journey-F', label: 'Journey Female (Expressive & Warm)' },
    { id: 'en-US-Journey-D', label: 'Journey Male (Deep & Narrative)' },
    { id: 'en-US-Neural2-F', label: 'Neural2 Female (Clear & Crisp)' },
    { id: 'en-US-Neural2-D', label: 'Neural2 Male (Authoritative)' },
    { id: 'en-GB-Neural2-B', label: 'British Neural2 Male (Oxford Accent)' },
    { id: 'en-GB-Neural2-A', label: 'British Neural2 Female (London Accent)' },
    { id: 'en-AU-Neural2-A', label: 'Australian Neural2 Female (Friendly)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1426] border border-cyan-400/40 shadow-2xl p-5 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Audio & Voice Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Reading Voice Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>COMMUTE READING VOICE</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">{availableVoices.length} Voices</span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
            >
              {availableVoices.length > 0 ? (
                availableVoices.map((v) => (
                  <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))
              ) : (
                <option value="">System Default Voice</option>
              )}
            </select>

            <button
              onClick={handlePreview}
              title="Preview Voice"
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                isPreviewing
                  ? 'bg-cyan-400 text-obsidian-950 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                  : 'bg-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-400'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* 2. Voice Pitch & Tone Slider */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>VOICE PITCH / TONE</span>
            </span>
            <span className="text-cyan-300 font-bold">{pitch.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.7}
            max={1.4}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>Deeper Tone</span>
            <span>Natural</span>
            <span>Crisp Tone</span>
          </div>
        </div>

        {/* 3. Google Cloud Neural Voice Personas */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>CLOUD NEURAL VOICE PERSONA</span>
            </label>
            <span className="text-[9px] font-mono text-slate-400">If Key Provided</span>
          </div>
          <select
            value={cloudVoice}
            onChange={(e) => setCloudVoice(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
          >
            {cloudVoices.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Google Cloud TTS Key */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>GOOGLE CLOUD TTS API KEY</span>
            </label>
            <span className="text-[9px] font-mono text-slate-400">Optional</span>
          </div>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={googleTtsKey}
            onChange={(e) => setGoogleTtsKey(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* 5. Gemini Key Input */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>GEMINI API KEY</span>
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
        </div>

        {/* 6. Commute Playback Preference */}
        <div className="space-y-2 pt-2 border-t border-white/5">
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
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-obsidian-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:brightness-110 active:scale-98 transition-all shrink-0"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Voice & Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Voice Configuration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
