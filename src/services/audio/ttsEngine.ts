import { PlaybackRate } from '../../types';

export interface TTSPlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onPause?: () => void;
  onResume?: () => void;
  onBoundary?: (charIndex: number) => void;
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
  private static isPlaying = false;
  private static isPaused = false;
  private static activeCallbacks: TTSPlaybackCallbacks = {};
  private static currentText = '';

  /**
   * Returns all available speech synthesis voices installed in the user's browser/OS.
   */
  public static getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Initializes background audio keep-alive for mobile PWAs.
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

  public static async speak(
    text: string,
    rate: PlaybackRate = 1.0,
    callbacks: TTSPlaybackCallbacks = {},
    googleApiKey?: string,
    voiceURI?: string,
    pitch: number = 1.0
  ): Promise<void> {
    this.stop();
    this.currentText = text;
    this.currentRate = rate;
    this.activeCallbacks = callbacks;

    // Start silent audio for background persistence
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

    // Zero-latency native Web Speech API
    this.speakViaBrowser(text, rate, callbacks, voiceURI, pitch);
  }

  private static speakViaBrowser(
    text: string,
    rate: PlaybackRate,
    callbacks: TTSPlaybackCallbacks,
    customVoiceURI?: string,
    customPitch: number = 1.0
  ) {
    if (!this.synth) {
      callbacks.onError?.('Speech Synthesis not supported in this browser.');
      return;
    }

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    const savedVoiceURI = customVoiceURI || localStorage.getItem('SELECTED_VOICE_URI');
    const voices = this.synth.getVoices();

    let preferredVoice: SpeechSynthesisVoice | undefined;

    if (savedVoiceURI) {
      preferredVoice = voices.find((v) => v.voiceURI === savedVoiceURI || v.name === savedVoiceURI);
    }

    if (!preferredVoice) {
      preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Premium') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Karen') ||
              v.name.includes('Victoria'))
        ) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = rate;
    utterance.pitch = customPitch;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      callbacks.onStart?.();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      callbacks.onEnd?.();
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      this.isPlaying = false;
      this.isPaused = false;
      callbacks.onError?.(e);
    };

    utterance.onpause = () => {
      this.isPaused = true;
      callbacks.onPause?.();
    };

    utterance.onresume = () => {
      this.isPaused = false;
      callbacks.onResume?.();
    };

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        callbacks.onBoundary?.(e.charIndex);
      }
    };

    this.synth.speak(utterance);
  }

  /**
   * Preview a voice with sample commute text
   */
  public static previewVoice(voiceURI: string, pitch: number = 1.0) {
    if (!this.synth) return;
    this.synth.cancel();

    const sampleText = "Hello! This is a preview of your reading voice for the student's companion commute journey.";
    const utterance = new SpeechSynthesisUtterance(sampleText);
    const voices = this.synth.getVoices();
    const voice = voices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);
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
        pitch: 0.0,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json();
      throw new Error(errJson.error?.message || 'Google Cloud TTS API call failed');
    }

    const data = await response.json();
    const audioBase64 = data.audioContent;
    const audioSrc = `data:audio/mp3;base64,${audioBase64}`;

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }

    const audio = new Audio(audioSrc);
    this.audioElement = audio;

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

  public static pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.isPaused = true;
      return;
    }

    if (this.synth && this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  public static resume(): void {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play().catch(() => {});
      this.isPaused = false;
      return;
    }

    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  public static stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }

    if (this.synth) {
      this.synth.cancel();
    }

    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
  }

  public static setRate(rate: PlaybackRate): void {
    this.currentRate = rate;
    if (this.isPlaying && this.currentText) {
      this.speak(this.currentText, rate, this.activeCallbacks);
    }
  }

  public static getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentRate: this.currentRate,
    };
  }
}
