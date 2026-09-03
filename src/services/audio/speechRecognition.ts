export interface VoiceCaptureCallbacks {
  onTranscriptChange: (transcript: string, isFinal: boolean) => void;
  onAudioLevelChange: (level: number) => void;
  onStateChange: (state: 'idle' | 'listening' | 'processing' | 'error') => void;
  onError: (error: string) => void;
}

export class VoiceRecognitionService {
  private static recognition: any = null;
  private static audioContext: AudioContext | null = null;
  private static analyser: AnalyserNode | null = null;
  private static microphoneStream: MediaStream | null = null;
  private static animFrameId: number | null = null;
  private static isListening = false;
  private static explicitlyStopped = false;
  private static accumulatedTranscript = '';
  private static currentCallbacks: VoiceCaptureCallbacks | null = null;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public static async startListening(callbacks: VoiceCaptureCallbacks): Promise<void> {
    this.stopListening();
    this.explicitlyStopped = false;
    this.accumulatedTranscript = '';
    this.currentCallbacks = callbacks;

    // 1. Try starting audio level visualizer without blocking speech recognition
    this.initAudioVisualizer(callbacks).catch((e) => {
      console.warn('Audio level visualizer could not be initialized:', e);
    });

    // 2. Initialize Speech Recognition
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      callbacks.onStateChange('listening'); // Fallback to manual/browser input
      callbacks.onError('Web Speech API is not supported in this browser. You can type your note directly.');
      return;
    }

    try {
      this.initRecognition(SpeechRec, callbacks);
    } catch (err: any) {
      console.error('Speech recognition initiation error:', err);
      callbacks.onError(err.message || 'Failed to access speech recognition');
      callbacks.onStateChange('error');
    }
  }

  private static async initAudioVisualizer(callbacks: VoiceCaptureCallbacks) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.startAudioLevelPolling(callbacks);
    } catch (err) {
      console.warn('Microphone stream for waveform visualizer not granted:', err);
    }
  }

  private static initRecognition(SpeechRec: any, callbacks: VoiceCaptureCallbacks) {
    const recognition = new SpeechRec();
    this.recognition = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

    recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStateChange('listening');
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

      const fullCurrentText = (this.accumulatedTranscript + ' ' + interimText).trim();
      callbacks.onTranscriptChange(fullCurrentText, false);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      if (
        event.error === 'no-speech' ||
        event.error === 'network' ||
        event.error === 'aborted'
      ) {
        // Recoverable silence / network event
        return;
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        callbacks.onError('Microphone permission denied. Please allow microphone access in your browser settings.');
        callbacks.onStateChange('error');
      }
    };

    recognition.onend = () => {
      if (this.isListening && !this.explicitlyStopped) {
        try {
          // Reconnect instantly for continuous recording
          recognition.start();
        } catch {
          this.isListening = false;
          callbacks.onStateChange('idle');
        }
      } else {
        this.isListening = false;
        callbacks.onStateChange('idle');
      }
    };

    try {
      recognition.start();
    } catch (e: any) {
      console.warn('SpeechRecognition start failed:', e);
      callbacks.onError('Failed to start microphone speech engine.');
    }
  }

  private static startAudioLevelPolling(callbacks: VoiceCaptureCallbacks) {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const poll = () => {
      if (!this.analyser || !this.isListening) return;

      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }

      const average = sum / dataArray.length;
      const normalizedLevel = Math.min(1.0, average / 128);

      callbacks.onAudioLevelChange(normalizedLevel);
      this.animFrameId = requestAnimationFrame(poll);
    };

    this.animFrameId = requestAnimationFrame(poll);
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

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    const final = this.accumulatedTranscript.trim();
    this.accumulatedTranscript = '';
    return final;
  }
}
