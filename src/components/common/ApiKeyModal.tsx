import React, { useState, useEffect, useMemo } from 'react';
import { X, Volume2, Check, Save, Play, Sliders, Mic, Globe, Key, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { AppSettings } from '../../types';
import { TTSEngine } from '../../services/audio/ttsEngine';
import { DeviceDetector, BrowserInfo } from '../../services/device/deviceDetector';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (United States)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (United Kingdom)', flag: '🇬🇧' },
  { code: 'en-CA', name: 'English (Canada)', flag: '🇨🇦' },
  { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺' },
  { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Español (México / LatAm)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'Français (France)', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'Français (Canada)', flag: '🇨🇦' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italiano (Italia)', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'ja-JP', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'zh-CN', name: '中文 (Simplified Chinese)', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文 (Traditional Chinese)', flag: '🇹🇼' },
  { code: 'ko-KR', name: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'ar-SA', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'nl-NL', name: 'Nederlands (Dutch)', flag: '🇳🇱' },
  { code: 'ru-RU', name: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'all', name: 'All Languages / System Voices', flag: '🌐' },
];

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenInstall,
  isInstalled = false,
}) => {
  const [selectedLang, setSelectedLang] = useState(
    settings.selectedLanguage || localStorage.getItem('SELECTED_LANGUAGE') || 'en-US'
  );
  const [selectedVoice, setSelectedVoice] = useState(
    settings.selectedVoiceURI || localStorage.getItem('SELECTED_VOICE_URI') || ''
  );
  const [pitch, setPitch] = useState(
    settings.speechPitch || parseFloat(localStorage.getItem('SPEECH_PITCH') || '1.0')
  );
  const [rate, setRate] = useState(
    settings.speechRate || parseFloat(localStorage.getItem('SPEECH_RATE') || '1.0')
  );
  const [cloudVoice, setCloudVoice] = useState(settings.cloudVoiceName || 'en-US-Journey-F');
  const [googleTtsKey, setGoogleTtsKey] = useState(settings.googleCloudTtsKey || '');
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [autoResume, setAutoResume] = useState(settings.autoResumeAfterNote);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saved, setSaved] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<BrowserInfo | null>(null);
  const [oledMode, setOledMode] = useState(
    !!settings.oledMode || (typeof localStorage !== 'undefined' && localStorage.getItem('STUDENT_COMPANION_OLED') === 'true')
  );
  const [haptics, setHaptics] = useState(
    settings.hapticFeedbackEnabled !== false &&
      (typeof localStorage !== 'undefined' ? localStorage.getItem('STUDENT_COMPANION_HAPTICS') !== 'false' : true)
  );

  useEffect(() => {
    const info = DeviceDetector.getInfo();
    setDeviceInfo(info);

    const loadVoices = () => {
      const voices = TTSEngine.getAvailableVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Filter voices based on selected language
  const filteredVoices = useMemo(() => {
    if (selectedLang === 'all') return availableVoices;
    const prefix = selectedLang.slice(0, 2).toLowerCase();
    const exact = selectedLang.toLowerCase();

    const matched = availableVoices.filter((v) => {
      const vLang = v.lang.toLowerCase();
      return vLang === exact || vLang.startsWith(prefix);
    });

    return matched.length > 0 ? matched : availableVoices;
  }, [availableVoices, selectedLang]);

  // Update selected voice when language changes if current voice does not match
  useEffect(() => {
    if (filteredVoices.length > 0) {
      const voiceStillValid = filteredVoices.some(
        (v) => (v.voiceURI || v.name) === selectedVoice
      );
      if (!voiceStillValid) {
        // Pick best natural voice in this language
        const bestVoice =
          filteredVoices.find(
            (v) =>
              v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Premium') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Siri')
          ) || filteredVoices[0];

        if (bestVoice) {
          setSelectedVoice(bestVoice.voiceURI || bestVoice.name);
        }
      }
    }
  }, [filteredVoices, selectedVoice]);

  if (!isOpen) return null;

  const handlePreview = () => {
    setIsPreviewing(true);
    TTSEngine.previewVoice(selectedVoice, pitch, selectedLang);
    setTimeout(() => setIsPreviewing(false), 3200);
  };

  const handleSave = () => {
    localStorage.setItem('SELECTED_LANGUAGE', selectedLang);
    localStorage.setItem('SELECTED_VOICE_URI', selectedVoice);
    localStorage.setItem('SPEECH_PITCH', pitch.toString());
    localStorage.setItem('SPEECH_RATE', rate.toString());
    localStorage.setItem('CLOUD_VOICE_NAME', cloudVoice);
    localStorage.setItem('GOOGLE_TTS_KEY', googleTtsKey.trim());
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    localStorage.setItem('STUDENT_COMPANION_OLED', oledMode ? 'true' : 'false');
    localStorage.setItem('STUDENT_COMPANION_HAPTICS', haptics ? 'true' : 'false');

    onSaveSettings({
      ...settings,
      selectedLanguage: selectedLang,
      selectedVoiceURI: selectedVoice,
      speechPitch: pitch,
      speechRate: rate,
      cloudVoiceName: cloudVoice,
      googleCloudTtsKey: googleTtsKey.trim(),
      geminiApiKey: apiKey.trim(),
      autoResumeAfterNote: autoResume,
      oledMode,
      hapticFeedbackEnabled: haptics,
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B14]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1426] border border-cyan-400/40 shadow-2xl p-5 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Language & Voice Settings</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Speech synthesis & recognition preferences
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

        {/* 1. Language Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>READING & TRANSCRIBING LANGUAGE</span>
            </label>
            <span className="text-[10px] font-mono text-cyan-400">
              {filteredVoices.length} voices
            </span>
          </div>

          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-sora focus:outline-none focus:border-cyan-400"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Voice Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>VOICE PERSONA</span>
            </label>
            <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Natural Audio</span>
            </span>
          </div>

          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-sora focus:outline-none focus:border-cyan-400"
          >
            {filteredVoices.length === 0 && (
              <option value="">Default System Voice</option>
            )}
            {filteredVoices.map((voice, idx) => (
              <option key={idx} value={voice.voiceURI || voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>

          <button
            onClick={handlePreview}
            disabled={isPreviewing}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          >
            <Play className={`w-3.5 h-3.5 fill-current text-cyan-400 ${isPreviewing ? 'animate-pulse' : ''}`} />
            <span>{isPreviewing ? 'Speaking Sample...' : 'Test Selected Voice'}</span>
          </button>
        </div>

        {/* 3. Voice Pitch & Tone Slider */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <label className="font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>VOICE PITCH & TONE</span>
            </label>
            <span className="text-cyan-400 font-bold">{pitch.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* 4. Reading Speed Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <label className="font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>SPEECH PACE (DEFAULT)</span>
            </label>
            <span className="text-cyan-400 font-bold">{rate.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.8"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Commute Ergonomics & Battery Mode */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            Commute Ergonomics & Battery
          </div>

          {/* OLED Pure Black Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
            <div>
              <div className="text-xs font-semibold text-slate-200">OLED Pure Black Theme</div>
              <div className="text-[10px] text-slate-400 font-mono">Maximum battery saving on mobile screens</div>
            </div>
            <button
              type="button"
              onClick={() => setOledMode(!oledMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                oledMode ? 'bg-cyan-400' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  oledMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptic Feedback Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
            <div>
              <div className="text-xs font-semibold text-slate-200">Tactile Haptic Feedback</div>
              <div className="text-[10px] text-slate-400 font-mono">Pocket vibration pulses on skip & bookmark</div>
            </div>
            <button
              type="button"
              onClick={() => setHaptics(!haptics)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                haptics ? 'bg-cyan-400' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  haptics ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 5. Device Compatibility Info */}
        {deviceInfo && (
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1 text-[10px] font-mono text-slate-400">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span>{deviceInfo.name} on {deviceInfo.os}</span>
              <span className="text-cyan-400">{deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Speech Audio (TTS):</span>
              <span className="text-emerald-400">Available</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Voice Dictation (STT):</span>
              <span className={deviceInfo.capabilities.speechRecognition ? 'text-emerald-400' : 'text-amber-400'}>
                {deviceInfo.capabilities.speechRecognition ? 'Ready' : 'Browser Fallback'}
              </span>
            </div>
          </div>
        )}

        {/* 6. Advanced Cloud AI Settings (Collapsible) */}
        <div className="pt-1 border-t border-white/5">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <span>Advanced Cloud Keys & Neural Voices</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-2 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                  <Mic className="w-3 h-3 text-cyan-400" />
                  <span>GOOGLE CLOUD NEURAL PERSONA</span>
                </label>
                <select
                  value={cloudVoice}
                  onChange={(e) => setCloudVoice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-sora focus:outline-none focus:border-cyan-400"
                >
                  <option value="en-US-Journey-F">Journey Female (Warm & Conversational)</option>
                  <option value="en-US-Journey-D">Journey Male (Deep Narrative)</option>
                  <option value="en-US-Neural2-F">Neural2 Female (Crisp Academic)</option>
                  <option value="en-US-Neural2-D">Neural2 Male (Authoritative)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                  <Key className="w-3 h-3 text-cyan-400" />
                  <span>GOOGLE CLOUD TTS KEY</span>
                </label>
                <input
                  type="password"
                  placeholder="Optional AIzaSy..."
                  value={googleTtsKey}
                  onChange={(e) => setGoogleTtsKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>GEMINI API KEY</span>
                </label>
                <input
                  type="password"
                  placeholder="Optional AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile PWA Install Option */}
        {!isInstalled && onOpenInstall && (
          <div className="pt-1 border-t border-white/5">
            <button
              onClick={() => {
                onClose();
                onOpenInstall();
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
            >
              <span>📲 Install as Mobile App (PWA)</span>
            </button>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-[#0A0F1D] font-bold text-xs flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:brightness-110 active:scale-98 transition-all shrink-0"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Language & Voice Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
