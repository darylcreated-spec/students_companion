import { PlaybackRate } from '../../types';

export interface TTSPlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (err: any) => void;
  onBoundary?: (charIndex: number) => void;
}

export class TTSEngine {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static audioElement: HTMLAudioElement | null = null;
  private static silentAudio: HTMLAudioElement | null = null;
  private static currentRate: PlaybackRate = 1.0;
  private static isPlaying = false;
  private static isPaused = false;
  private static activeCallbacks: TTSPlaybackCallbacks = {};
  private static currentText = '';

  /**
   * Initializes background audio keep-alive for mobile PWAs.
   * Browsers allow speech synthesis and background audio when an active HTMLAudioElement is playing.
   */
  public static initBackgroundAudio() {
    if (typeof window === 'undefined') return;

    if (!this.silentAudio) {
      // 1-second looping silent audio data URI
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
    googleApiKey?: string
  ): Promise<void> {
    this.stop();
    this.currentText = text;
    this.currentRate = rate;
    this.activeCallbacks = callbacks;

    // Start silent audio to ensure background persistence
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

    // Zero-latency native Web Speech API fallback
    this.speakViaBrowser(text, rate, callbacks);
  }

  private static speakViaBrowser(
    text: string,
    rate: PlaybackRate,
    callbacks: TTSPlaybackCallbacks
  ) {
    if (!this.synth) {
      callbacks.onError?.('Speech Synthesis not supported in this browser.');
      return;
    }

    // Cancel any stuck utterances
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Select optimal natural voice (prefer Google, Natural, or Enhanced voices)
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Samantha') || v.name.includes('Daniel')))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = rate;
    utterance.pitch = 1.0;

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

  private static async speakViaGoogleCloud(
    text: string,
    rate: PlaybackRate,
    callbacks: TTSPlaybackCallbacks,
    apiKey: string
  ): Promise<void> {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Journey-F', // Warm, conversational Journey voice
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: rate
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google TTS API HTTP error ${response.status}`);
    }

    const data = await response.json();
    const audioBlob = this.base64ToBlob(data.audioContent, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }

    this.audioElement = new Audio(audioUrl);
    this.audioElement.playbackRate = rate;

    this.audioElement.onplay = () => {
      this.isPlaying = true;
      this.isPaused = false;
      callbacks.onStart?.();
    };

    this.audioElement.onended = () => {
      this.isPlaying = false;
      this.isPaused = false;
      callbacks.onEnd?.();
    };

    this.audioElement.onerror = (e) => {
      this.isPlaying = false;
      callbacks.onError?.(e);
    };

    await this.audioElement.play();
  }

  public static pause() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.isPaused = true;
      this.activeCallbacks.onPause?.();
    } else if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPaused = true;
      this.activeCallbacks.onPause?.();
    }
  }

  public static resume() {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
      this.isPaused = false;
      this.activeCallbacks.onResume?.();
    } else if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.isPaused = false;
      this.activeCallbacks.onResume?.();
    }
  }

  public static stop() {
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
  }

  public static setRate(rate: PlaybackRate) {
    this.currentRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    } else if (this.isPlaying && this.currentText) {
      // Re-speak with new rate
      this.speak(this.currentText, rate, this.activeCallbacks);
    }
  }

  public static getPlaybackStatus(): { isPlaying: boolean; isPaused: boolean } {
    return { isPlaying: this.isPlaying, isPaused: this.isPaused };
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
