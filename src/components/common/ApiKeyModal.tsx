import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Volume2, Check, Save, Play, Sliders, Mic, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../../types';
import { TTSEngine } from '../../services/audio/ttsEngine';
import { DeviceDetector, BrowserInfo } from '../../services/device/deviceDetector';

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
  const [deviceInfo, setDeviceInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    const info = DeviceDetector.getInfo();
    setDeviceInfo(info);

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
                v.name.includes('Daniel') ||
                v.name.includes('Siri'))
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
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1426] border border-cyan-400/40 shadow-2xl p-5 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Voice & Device Settings</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Cross-browser speech & cloud intelligence
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

        {/* 1. Device & Browser Compatibility Diagnostics */}
        {deviceInfo && (
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-400/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{deviceInfo.name} on {deviceInfo.os}</span>
              </span>
              <span className="text-slate-400">
                {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>TTS Speech: {deviceInfo.capabilities.speechSynthesis ? 'Ready' : 'Fallback'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>STT Dictation: {deviceInfo.capabilities.speechRecognition ? 'Ready' : 'Cloud'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Offline Storage: Active</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Media Controls: Active</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Browser Local Voice Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMMUTE READING VOICE</span>
            </label>
            <span className="text-[10px] font-mono text-cyan-400">
              {availableVoices.length} Voices Detected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-sora focus:outline-none focus:border-cyan-400 truncate"
            >
              {availableVoices.map((voice, idx) => (
                <option key={idx} value={voice.voiceURI || voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>

            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              title="Preview Voice"
              className="px-3 py-2 rounded-xl bg-cyan-400 text-obsidian-950 font-bold text-xs flex items-center space-x-1 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_10px_rgba(34,211,238,0.3)] shrink-0"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isPreviewing ? 'animate-spin' : ''}`} />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* 3. Voice Pitch / Tone Slider */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <label className="font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>VOICE PITCH & TONE</span>
            </label>
            <span className="text-cyan-400 font-bold">{pitch.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.4"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* 4. Google Cloud Neural Voice Persona */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>GOOGLE CLOUD NEURAL PERSONA</span>
          </label>
          <select
            value={cloudVoice}
            onChange={(e) => setCloudVoice(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-sora focus:outline-none focus:border-cyan-400"
          >
            <option value="en-US-Journey-F">Journey Female (Warm & Conversational)</option>
            <option value="en-US-Journey-D">Journey Male (Deep & Narrative)</option>
            <option value="en-US-Neural2-F">Neural2 Female (Academic & Crisp)</option>
            <option value="en-US-Neural2-D">Neural2 Male (Authoritative)</option>
          </select>
        </div>

        {/* 5. Google Cloud TTS Key */}
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

        {/* 6. Gemini Key Input */}
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

        {/* 7. Commute Playback Preference */}
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
