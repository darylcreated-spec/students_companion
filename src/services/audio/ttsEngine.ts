import { PlaybackRate } from '../../types';
import { DeviceDetector } from '../device/deviceDetector';

export interface TTSPlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onPause?: () => void;
  onResume?: () => void;
  onBoundary?: (charIndex: number) => void;
  onSentenceChange?: (sentenceIndex: number, totalSentences: number, sentenceText: string) => void;
}

export class TTSEngine {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;

  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static audioElement: HTMLAudioElement | null = null;
  private static silentAudio: HTMLAudioElement | null = null;
  private static currentRate: PlaybackRate = 1.0;
  private static currentPitch: number = 1.0;
  private static currentVoiceURI?: string;
  private static isPlaying = false;
  private static isPaused = false;
  private static activeCallbacks: TTSPlaybackCallbacks = {};
  private static currentText = '';

  // Sentence Streaming Queue
  private static sentenceQueue: string[] = [];
  private static currentSentenceIndex = 0;
  private static isQueueSpeaking = false;
  // Pin utterances in an array to avoid V8 garbage collection dropping active speech
  private static pinnedUtterances: SpeechSynthesisUtterance[] = [];

  static {
    // Listen for dynamic voice loading across browsers (Chrome, Safari, Android)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices ready
      };
      DeviceDetector.unlockAudioContext();
    }
  }

  /**
   * Returns all available speech synthesis voices installed in the user's browser/OS.
   */
  public static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Initializes background audio keep-alive for mobile PWAs and iOS Safari.
   */
  public static initBackgroundAudio() {
    if (typeof window === 'undefined') return;

    if (!this.silentAudio) {
      this.silentAudio = new Audio(
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
      );
      this.silentAudio.loop = true;
    }
  }

  /**
   * Primary speak method: Splits chapter text into individual sentences and
   * speaks them in continuous sequence so the browser never cuts off long text.
   */
  public static async speak(
    text: string,
    rate: PlaybackRate = 1.0,
    callbacks: TTSPlaybackCallbacks = {},
    googleApiKey?: string,
    voiceURI?: string,
    pitch: number = 1.0
  ): Promise<void> {
    return this.speakFromSentence(text, 0, rate, callbacks, googleApiKey, voiceURI, pitch);
  }

  /**
   * Speaks starting from an arbitrary sentence index within the chapter.
   */
  public static async speakFromSentence(
    text: string,
    startSentenceIndex: number = 0,
    rate: PlaybackRate = 1.0,
    callbacks: TTSPlaybackCallbacks = {},
    googleApiKey?: string,
    voiceURI?: string,
    pitch: number = 1.0
  ): Promise<void> {
    this.stop();
    this.currentText = text;
    this.currentRate = rate;
    this.currentPitch = pitch;
    this.currentVoiceURI = voiceURI;
    this.activeCallbacks = callbacks;

    // Split text into individual sentences using lookbehind for punctuation
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    this.sentenceQueue = sentences.length > 0 ? sentences : [text.trim()];
    this.currentSentenceIndex = Math.min(
      Math.max(0, startSentenceIndex),
      this.sentenceQueue.length - 1
    );

    // Start silent audio for mobile background persistence
    try {
      this.initBackgroundAudio();
      this.silentAudio?.play().catch(() => {});
    } catch (_) {}

    // Check if Google Cloud TTS is enabled & API key provided
    const cloudKey = googleApiKey || localStorage.getItem('GOOGLE_TTS_KEY');
    if (cloudKey && cloudKey.trim().length > 10) {
      try {
        await this.speakViaGoogleCloud(text, rate, callbacks, cloudKey);
        return;
      } catch (err) {
        console.warn('Google Cloud TTS failed, falling back to Web Speech API:', err);
      }
    }

    // Zero-latency native Web Speech API with sentence queueing
    this.isQueueSpeaking = true;
    this.isPaused = false;
    this.isPlaying = true;
    this.playCurrentSentenceQueue();
  }

  private static playCurrentSentenceQueue() {
    if (!this.synth || !this.isQueueSpeaking || this.isPaused) {
      return;
    }

    // Check if queue has finished all sentences in the chapter/window
    if (this.currentSentenceIndex >= this.sentenceQueue.length) {
      this.isQueueSpeaking = false;
      this.isPlaying = false;
      this.pinnedUtterances = [];
      this.activeCallbacks.onEnd?.();
      return;
    }

    const sentence = this.sentenceQueue[this.currentSentenceIndex];
    if (!sentence) {
      this.currentSentenceIndex++;
      this.playCurrentSentenceQueue();
      return;
    }

    // Cancel any stuck utterances before speaking next sentence
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(sentence);
    // Pin utterance in memory to avoid garbage collection abort bug in V8
    this.pinnedUtterances.push(utterance);
    if (this.pinnedUtterances.length > 15) {
      this.pinnedUtterances.shift();
    }
    this.currentUtterance = utterance;

    const savedVoiceURI = this.currentVoiceURI || localStorage.getItem('SELECTED_VOICE_URI');
    const savedLang = localStorage.getItem('SELECTED_LANGUAGE') || 'en';
    const voices = this.synth.getVoices();

    let preferredVoice: SpeechSynthesisVoice | undefined;
    if (savedVoiceURI) {
      preferredVoice = voices.find((v) => v.voiceURI === savedVoiceURI || v.name === savedVoiceURI);
    }
    if (!preferredVoice) {
      preferredVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(savedLang.toLowerCase().slice(0, 2)) &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Premium') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Karen') ||
              v.name.includes('Victoria') ||
              v.name.includes('Siri'))
        ) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(savedLang.toLowerCase().slice(0, 2))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    }
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = this.currentRate;
    const savedPitch = parseFloat(localStorage.getItem('SPEECH_PITCH') || '1.0');
    utterance.pitch = this.currentPitch !== 1.0 ? this.currentPitch : savedPitch;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.activeCallbacks.onSentenceChange?.(
        this.currentSentenceIndex,
        this.sentenceQueue.length,
        sentence
      );
      if (this.currentSentenceIndex === 0) {
        this.activeCallbacks.onStart?.();
      }
    };

    utterance.onend = () => {
      if (!this.isQueueSpeaking || this.isPaused) {
        return;
      }
      // Advance to next sentence in queue
      this.currentSentenceIndex++;
      this.playCurrentSentenceQueue();
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('TTS sentence speech error:', e);
      // Advance to next sentence on error rather than stopping completely
      if (this.isQueueSpeaking && !this.isPaused) {
        this.currentSentenceIndex++;
        this.playCurrentSentenceQueue();
      }
    };

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        this.activeCallbacks.onBoundary?.(e.charIndex);
      }
    };

    this.synth.speak(utterance);
  }

  /**
   * Preview a voice with native language greeting sample text
   */
  public static previewVoice(
    voiceURI?: string,
    pitch: number = 1.0,
    language: string = 'en-US',
    sampleText?: string
  ) {
    if (!this.synth) return;
    this.synth.cancel();

    const voices = this.synth.getVoices();
    const voice = voices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);

    let text = sampleText;
    if (!text) {
      const lang = (voice?.lang || language).toLowerCase();
      if (lang.startsWith('es')) {
        text = '¡Hola! Esta es una prueba de voz para tus lecturas.';
      } else if (lang.startsWith('fr')) {
        text = 'Bonjour! Ceci est un essai vocal pour vos lectures.';
      } else if (lang.startsWith('de')) {
        text = 'Hallo! Dies ist eine Hörprobe für Ihre Vorlesungen.';
      } else if (lang.startsWith('it')) {
        text = 'Ciao! Questa è una prova vocale per le tue letture.';
      } else if (lang.startsWith('pt')) {
        text = 'Olá! Esta é uma demonstração de voz para os seus estudos.';
      } else if (lang.startsWith('ja')) {
        text = 'こんにちは。学習音声のプレビューです。';
      } else if (lang.startsWith('zh')) {
        text = '您好，这是用于朗读学习资料的语音预览。';
      } else if (lang.startsWith('ar')) {
        text = 'مرحبًا! هذا اختبار صوتي لقراءة مستنداتك.';
      } else if (lang.startsWith('hi')) {
        text = 'नमस्ते! यह आपकी पढ़ाई के लिए वॉयस टेस्ट है।';
      } else {
        text = "Hello! This is a preview of your reading voice for the student's companion.";
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = 1.0;
    utterance.pitch = pitch;
    this.synth.speak(utterance);
  }

  private static async speakViaGoogleCloud(
    text: string,
    rate: PlaybackRate,
    callbacks: TTSPlaybackCallbacks,
    apiKey: string
  ) {
    const cloudVoice = localStorage.getItem('CLOUD_VOICE_NAME') || 'en-US-Journey-F';

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const payload = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: cloudVoice,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: rate,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google TTS error: ${response.statusText}`);
    }

    const data = await response.json();
    const audioBlob = this.base64ToBlob(data.audioContent, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    const audio = new Audio(audioUrl);
    this.audioElement = audio;
    audio.playbackRate = rate;

    audio.onplay = () => {
      this.isPlaying = true;
      this.isPaused = false;
      callbacks.onStart?.();
    };

    audio.onended = () => {
      this.isPlaying = false;
      this.isPaused = false;
      callbacks.onEnd?.();
    };

    audio.onerror = (e) => {
      this.isPlaying = false;
      this.isPaused = false;
      callbacks.onError?.(e);
    };

    audio.onpause = () => {
      if (audio.currentTime < audio.duration) {
        this.isPaused = true;
        callbacks.onPause?.();
      }
    };

    await audio.play();
  }

  public static pause() {
    this.isPaused = true;
    this.isQueueSpeaking = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.activeCallbacks.onPause?.();
  }

  public static resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (this.audioElement) {
      this.audioElement.play().catch(() => {});
    } else if (this.synth && this.sentenceQueue.length > 0) {
      this.isQueueSpeaking = true;
      this.isPlaying = true;
      this.playCurrentSentenceQueue();
    }
    this.activeCallbacks.onResume?.();
  }

  public static stop() {
    this.isQueueSpeaking = false;
    this.isPaused = false;
    this.isPlaying = false;
    this.sentenceQueue = [];
    this.currentSentenceIndex = 0;
    this.pinnedUtterances = [];
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public static setRate(rate: PlaybackRate) {
    this.currentRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    } else if (this.isPlaying && this.synth && this.isQueueSpeaking) {
      this.synth.cancel();
      this.playCurrentSentenceQueue();
    }
  }

  private static base64ToBlob(base64: string, mime: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }
}
