import { PunctuationService } from './punctuationService';

export interface VoiceCaptureCallbacks {
  onTranscriptChange: (transcript: string, isFinal: boolean) => void;
  onAudioLevelChange: (level: number) => void;
  onStateChange: (state: 'idle' | 'listening' | 'processing' | 'error') => void;
  onError: (error: string) => void;
}

export class VoiceRecognitionService {
  private static recognition: any = null;
  private static animFrameId: number | null = null;
  private static pulseInterval: any = null;
  private static isListening = false;
  private static explicitlyStopped = false;
  private static accumulatedTranscript = '';
  private static currentCallbacks: VoiceCaptureCallbacks | null = null;

  /**
   * Checks whether Web Speech API is supported in the current browser/OS.
   */
  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Checks if running under a secure context required for microphone capture on mobile devices.
   */
  public static isSecureOrigin(): boolean {
    if (typeof window === 'undefined') return true;
    if (window.isSecureContext !== undefined) return window.isSecureContext;
    return (
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }

  /**
   * Starts speech recognition synchronously to preserve mobile user-gesture tokens.
   */
  public static startListening(callbacks: VoiceCaptureCallbacks): void {
    this.stopListening();
    this.explicitlyStopped = false;
    this.accumulatedTranscript = '';
    this.currentCallbacks = callbacks;

    // Check secure context for mobile devices
    if (!this.isSecureOrigin()) {
      callbacks.onStateChange('error');
      callbacks.onError(
        'Mobile browsers require HTTPS for direct microphone access. You can type or tap the microphone on your mobile keyboard to dictate directly.'
      );
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      callbacks.onStateChange('listening');
      callbacks.onError(
        'Direct Web Speech is not supported in this browser. Please use your mobile keyboard microphone (dictation key) to speak directly into the text box.'
      );
      return;
    }

    try {
      this.initRecognition(SpeechRec, callbacks);
    } catch (err: any) {
      console.error('Speech recognition initiation error:', err);
      callbacks.onError(err.message || 'Could not start microphone on this device.');
      callbacks.onStateChange('error');
    }
  }

  private static isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  private static isMobile(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  private static initRecognition(SpeechRec: any, callbacks: VoiceCaptureCallbacks) {
    const recognition = new SpeechRec();
    this.recognition = recognition;

    const isAppleMobile = this.isIOS();

    // iOS Safari WebKit implementation aborts if continuous is true!
    // Non-iOS browsers (Chrome, Edge, Android) support continuous mode cleanly.
    recognition.continuous = !isAppleMobile;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Use selected language or device language
    const configuredLang =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('SELECTED_LANGUAGE')
        : null;

    recognition.lang =
      configuredLang && configuredLang !== 'all'
        ? configuredLang
        : typeof navigator !== 'undefined'
        ? navigator.language || 'en-US'
        : 'en-US';

    recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStateChange('listening');
      this.startSimulatedAudioLevel(callbacks);
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';

        if (item.isFinal) {
          newFinal += ' ' + text;
        } else {
          interimText += ' ' + text;
        }
      }

      if (newFinal.trim()) {
        this.accumulatedTranscript = (this.accumulatedTranscript + ' ' + newFinal).trim();
      }

      const rawCurrentText = (this.accumulatedTranscript + ' ' + interimText).trim();
      const punctuatedText = PunctuationService.formatSpokenPunctuation(rawCurrentText);
      callbacks.onTranscriptChange(punctuatedText, false);

      // Boost waveform audio feedback on speech activity
      callbacks.onAudioLevelChange(0.75 + Math.random() * 0.25);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);

      if (
        event.error === 'no-speech' ||
        event.error === 'network' ||
        event.error === 'aborted'
      ) {
        // Recoverable silence / network event — do not close
        return;
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        callbacks.onError(
          'Microphone permission denied. Tap the lock/info icon in your browser URL bar to allow microphone access, or use your mobile keyboard microphone.'
        );
        callbacks.onStateChange('error');
      } else if (event.error === 'audio-capture') {
        callbacks.onError(
          'Microphone hardware is busy or in use by another app. Please close other audio apps and try again.'
        );
        callbacks.onStateChange('error');
      }
    };

    recognition.onend = () => {
      // Clean reconnection for continuous speech across all devices
      if (this.isListening && !this.explicitlyStopped) {
        const delay = this.isMobile() ? 120 : 50;
        setTimeout(() => {
          if (this.isListening && !this.explicitlyStopped && this.recognition) {
            try {
              this.recognition.start();
            } catch (err: any) {
              // If already active or stopped, safely reset
              if (err.name !== 'InvalidStateError') {
                this.isListening = false;
                callbacks.onStateChange('idle');
              }
            }
          }
        }, delay);
      } else {
        this.isListening = false;
        callbacks.onStateChange('idle');
        this.stopSimulatedAudioLevel(callbacks);
      }
    };

    // Synchronously start speech recognition right in the user-gesture tick
    try {
      recognition.start();
    } catch (e: any) {
      console.warn('SpeechRecognition start failed:', e);
      if (e.name === 'InvalidStateError') {
        // Recognition was already running
        this.isListening = true;
      } else {
        callbacks.onError(
          'Could not start microphone. You can type or use your mobile keyboard microphone directly in the text box.'
        );
        callbacks.onStateChange('error');
      }
    }
  }

  /**
   * Generates a lightweight, responsive audio wave pulse without locking the physical microphone.
   * This completely prevents the classic mobile bug where getUserMedia and SpeechRecognition conflict.
   */
  private static startSimulatedAudioLevel(callbacks: VoiceCaptureCallbacks) {
    this.stopSimulatedAudioLevel(callbacks);

    this.pulseInterval = setInterval(() => {
      if (!this.isListening) return;
      // Ambient breathing pulse (0.15 to 0.45)
      const basePulse = 0.2 + Math.sin(Date.now() / 250) * 0.15;
      callbacks.onAudioLevelChange(basePulse);
    }, 100);
  }

  private static stopSimulatedAudioLevel(callbacks: VoiceCaptureCallbacks) {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    callbacks.onAudioLevelChange(0);
  }

  public static stopListening(): string {
    this.explicitlyStopped = true;
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    return PunctuationService.formatSpokenPunctuation(this.accumulatedTranscript);
  }
}
