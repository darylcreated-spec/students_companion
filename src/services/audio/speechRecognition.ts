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

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      callbacks.onError('Web Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      // 1. Initialize Microphone Audio Stream for Live Visualizer
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          source.connect(this.analyser);

          this.startAudioLevelPolling(callbacks);
        } catch (e) {
          console.warn('Microphone stream for visualizer not granted:', e);
        }
      }

      this.initRecognition(SpeechRec, callbacks);
    } catch (err: any) {
      callbacks.onError(err.message || 'Failed to start speech recognition');
      callbacks.onStateChange('error');
    }
  }

  private static initRecognition(SpeechRec: any, callbacks: VoiceCaptureCallbacks) {
    this.recognition = new SpeechRec();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStateChange('listening');
    };

    this.recognition.onresult = (event: any) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.accumulatedTranscript += ' ' + transcript;
        } else {
          interimText += transcript;
        }
      }

      const fullCurrentText = (this.accumulatedTranscript + ' ' + interimText).trim();
      callbacks.onTranscriptChange(fullCurrentText, false);
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'network') {
        // In continuous mode, harmless network or quiet period renegotiation
        return;
      }
      console.warn('Speech recognition warning:', event.error);
    };

    // Infinite Continuous Listening: Auto-restart if browser buffer finishes and user didn't stop
    this.recognition.onend = () => {
      if (this.isListening && !this.explicitlyStopped) {
        try {
          // Reconnect instantly for continuous recording
          this.recognition?.start();
        } catch (_) {
          this.isListening = false;
          callbacks.onStateChange('idle');
        }
      } else {
        this.isListening = false;
        callbacks.onStateChange('idle');
      }
    };

    this.recognition.start();
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
      const normalizedLevel = Math.min(1.0, average / 80);

      callbacks.onAudioLevelChange(normalizedLevel);
      this.animFrameId = requestAnimationFrame(poll);
    };

    poll();
  }

  public static stopListening(): string {
    this.explicitlyStopped = true;
    this.isListening = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyser = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    return this.accumulatedTranscript.trim();
  }

  public static getIsListening(): boolean {
    return this.isListening;
  }
}
